import { usePuterStore } from "./puter"
import { useAnalysisQueue } from "./queue"
import { convertPdfToImage } from "./pdf2img"

export const MAIN_RESUME_KEY = 'main-resume'

export const getMainResume = async (): Promise<MainResume | null> => {
    const value = await usePuterStore.getState().kv.get(MAIN_RESUME_KEY)
    return value ? JSON.parse(value) as MainResume : null
}

// Applications can share the main resume's files, so a path is only deleted
// once nothing points at it: not the main resume, a saved entry or a queued
// job. Entries listed in ignoreIds are being deleted and don't count.
export const deleteUnreferencedFiles = async (paths: string[], ignoreIds: string[] = []) => {
    const candidates = paths.filter(Boolean)
    if (candidates.length === 0) return

    const { fs, kv } = usePuterStore.getState()
    const [items, mainResume] = await Promise.all([
        kv.list('resume:*', true) as Promise<KVItem[] | undefined>,
        getMainResume(),
    ])

    const referenced = new Set<string>()
    const addPaths = (entry: { resumePath: string; imagePath: string }) => {
        referenced.add(entry.resumePath)
        referenced.add(entry.imagePath)
    }

    if (mainResume) addPaths(mainResume)
    items?.forEach((item) => {
        const resume = JSON.parse(item.value) as Resume
        if (!ignoreIds.includes(resume.id)) addPaths(resume)
    })
    Object.values(useAnalysisQueue.getState().jobs).forEach((job) => {
        if (!ignoreIds.includes(job.resume.id)) addPaths(job.resume)
    })

    await Promise.allSettled(
        candidates.filter((path) => !referenced.has(path)).map((path) => fs.delete(path))
    )
}

// Uploads a new main resume and replaces the old one. The old files are kept
// while existing applications still use them.
export const saveMainResume = async (file: File): Promise<MainResume> => {
    const { fs, kv } = usePuterStore.getState()
    const uploadedPaths: string[] = []

    try {
        const uploadedFile = await fs.upload([file])
        if (!uploadedFile) throw new Error('Failed to upload file')
        uploadedPaths.push(uploadedFile.path)

        const imageFile = await convertPdfToImage(file)
        if (!imageFile.file) throw new Error(imageFile.error ?? 'Failed to convert PDF to image')

        const uploadedImage = await fs.upload([imageFile.file])
        if (!uploadedImage) throw new Error('Failed to upload image')
        uploadedPaths.push(uploadedImage.path)

        const previous = await getMainResume()
        const mainResume: MainResume = {
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            fileName: file.name,
            size: file.size,
            uploadedAt: new Date().toISOString(),
        }
        await kv.set(MAIN_RESUME_KEY, JSON.stringify(mainResume))

        if (previous) await deleteUnreferencedFiles([previous.resumePath, previous.imagePath])
        return mainResume
    } catch (err) {
        await Promise.allSettled(uploadedPaths.map((path) => fs.delete(path)))
        throw err
    }
}

export const removeMainResume = async () => {
    const previous = await getMainResume()
    if (!previous) return

    await usePuterStore.getState().kv.delete(MAIN_RESUME_KEY)
    await deleteUnreferencedFiles([previous.resumePath, previous.imagePath])
}
