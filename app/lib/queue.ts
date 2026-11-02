import { create } from "zustand"
import { usePuterStore } from "./puter"
import { convertPdfToImage } from "./pdf2img"
import { generateUUID, stripCodeFences } from "./utils"
import { prepareInstructions } from "../../constants"

export interface AnalysisJob {
    resume: Resume
    statusText: string
    // Kept in memory so a job that failed before its upload finished can be retried.
    file?: File
}

interface AnalysisQueueStore {
    jobs: Record<string, AnalysisJob>
    // Pass either a new file to upload, or the main resume to reuse its stored files.
    enqueue: (input: { companyName: string; jobTitle: string; jobDescription: string; file?: File; mainResume?: MainResume }) => string
    retry: (resume: Resume) => void
    cancel: (id: string) => void
}

// Jobs run one at a time, in the order they were submitted. They live in
// memory, so they keep going across route changes but stop on a page reload.
let queue: Promise<void> = Promise.resolve()

export const useAnalysisQueue = create<AnalysisQueueStore>((set, get) => {
    const update = (id: string, patch: Partial<AnalysisJob>, resumePatch: Partial<Resume> = {}) => {
        set((state) => {
            const job = state.jobs[id]
            if (!job) return state
            return { jobs: { ...state.jobs, [id]: { ...job, ...patch, resume: { ...job.resume, ...resumePatch } } } }
        })
    }

    // A job is cancelled by removing it from the store (e.g. the row was deleted).
    const isCancelled = (id: string) => !get().jobs[id]

    const run = async (id: string) => {
        const job = get().jobs[id]
        if (!job) return

        const { fs, ai, kv } = usePuterStore.getState()
        const resume: Resume = { ...job.resume, status: 'processing', error: undefined }
        const uploadedPaths: string[] = []

        const step = (statusText: string) => update(id, { statusText })

        const persist = async () => {
            await kv.set(`resume:${id}`, JSON.stringify(resume))
            // Deleted while the write was in flight: undo it.
            if (isCancelled(id)) await kv.delete(`resume:${id}`)
        }

        const discardUploads = async () => {
            await Promise.allSettled(uploadedPaths.map((path) => fs.delete(path)))
        }

        try {
            if (!resume.resumePath || !resume.imagePath) {
                if (!job.file) throw new Error('The original file is no longer available. Please upload it again.')

                step('Uploading the file...')
                const uploadedFile = await fs.upload([job.file])
                if (!uploadedFile) throw new Error('Failed to upload file')
                uploadedPaths.push(uploadedFile.path)
                if (isCancelled(id)) return discardUploads()

                step('Converting to image...')
                const imageFile = await convertPdfToImage(job.file)
                if (!imageFile.file) throw new Error(imageFile.error ?? 'Failed to convert PDF to image')
                if (isCancelled(id)) return discardUploads()

                step('Uploading the image...')
                const uploadedImage = await fs.upload([imageFile.file])
                if (!uploadedImage) throw new Error('Failed to upload image')
                uploadedPaths.push(uploadedImage.path)
                if (isCancelled(id)) return discardUploads()

                resume.resumePath = uploadedFile.path
                resume.imagePath = uploadedImage.path
                update(id, {}, { resumePath: resume.resumePath, imagePath: resume.imagePath })
            }

            // Saved as "processing" so a reload mid-analysis can be detected and retried.
            await persist()
            if (isCancelled(id)) return discardUploads()

            step('Analyzing...')
            const feedback = await ai.feedback(
                resume.resumePath,
                prepareInstructions({ jobTitle: resume.jobTitle ?? '', jobDescription: resume.jobDescription ?? '' })
            )
            if (isCancelled(id)) return discardUploads()
            if (!feedback) throw new Error('Failed to analyze resume')

            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text

            resume.feedback = JSON.parse(stripCodeFences(feedbackText))
            resume.status = 'done'
            await persist()
            if (isCancelled(id)) return discardUploads()

            update(id, { statusText: '', file: undefined }, { feedback: resume.feedback, status: 'done', error: undefined })
        } catch (err) {
            if (isCancelled(id)) return discardUploads()

            console.error(err)
            resume.status = 'failed'
            resume.error = err instanceof Error ? err.message : 'Something went wrong'
            update(id, { statusText: '' }, { status: 'failed', error: resume.error })

            // Only entries whose files made it to storage are worth keeping across reloads.
            if (resume.resumePath && resume.imagePath) await persist().catch(console.error)
        }
    }

    const schedule = (id: string) => {
        queue = queue.then(() => run(id)).catch(console.error)
    }

    return {
        jobs: {},
        enqueue: ({ file, mainResume, ...details }) => {
            const id = generateUUID()
            const resume: Resume = {
                id,
                ...details,
                // With the main resume the paths are already set, so the upload step is skipped.
                resumePath: mainResume?.resumePath ?? '',
                imagePath: mainResume?.imagePath ?? '',
                status: 'processing',
                createdAt: new Date().toISOString(),
            }
            set((state) => ({ jobs: { ...state.jobs, [id]: { resume, file, statusText: 'Queued' } } }))
            schedule(id)
            return id
        },
        retry: (resume) => {
            const existing = get().jobs[resume.id]
            if (existing?.resume.status === 'processing') return

            set((state) => ({
                jobs: {
                    ...state.jobs,
                    [resume.id]: {
                        resume: { ...resume, status: 'processing', error: undefined },
                        file: existing?.file,
                        statusText: 'Queued',
                    },
                },
            }))
            schedule(resume.id)
        },
        cancel: (id) => {
            set((state) => {
                const { [id]: _, ...jobs } = state.jobs
                return { jobs }
            })
        },
    }
})
