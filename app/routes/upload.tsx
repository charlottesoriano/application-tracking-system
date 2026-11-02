import { useEffect, useState, type FormEvent } from "react"
import Navbar from "../components/Navbar"
import FileUploader from "~/components/FileUploader"
import { ACCEPTED_FILE_TYPE, cn, formatSize, MAX_FILE_SIZE } from "~/lib/utils"
import { usePuterStore } from "~/lib/puter"
import { useAnalysisQueue } from "~/lib/queue"
import { getMainResume } from "~/lib/mainResume"
import { Link, useNavigate } from "react-router"

type ResumeSource = 'upload' | 'main'

interface FormErrors {
    companyName?: string
    jobTitle?: string
    jobDescription?: string
    file?: string
}

const Step = ({ number, title, description }: { number: number; title: string; description: string }) => (
    <li className="flex gap-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-100 text-accent-700 font-display font-bold flex items-center justify-center">
            {number}
        </span>
        <div className="flex flex-col gap-1 pt-0.5">
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-sm text-foreground-secondary">{description}</p>
        </div>
    </li>
)

const Upload = () => {
    const { auth } = usePuterStore()
    const enqueue = useAnalysisQueue((state) => state.enqueue)
    const navigate = useNavigate()
    const [file, setFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<FormErrors>({})
    const [source, setSource] = useState<ResumeSource>('upload')
    const [mainResume, setMainResume] = useState<MainResume | null>(null)
    const [isMainResumeLoading, setIsMainResumeLoading] = useState(true)

    useEffect(() => {
        if (!auth.isAuthenticated) navigate('/auth?next=/upload')
    }, [auth.isAuthenticated])

    // Default to the main resume when one exists, so it isn't uploaded again.
    useEffect(() => {
        getMainResume()
            .then((resume) => {
                setMainResume(resume)
                if (resume) setSource('main')
            })
            .catch(console.error)
            .finally(() => setIsMainResumeLoading(false))
    }, [])

    const handleSourceChange = (value: ResumeSource) => {
        // The uploader unmounts on switch, so drop its file to match.
        setSource(value)
        setFile(null)
        clearError('file')
    }

    const handleFileSelect = (file: File | null, error?: string) => {
        setFile(file)
        setErrors((prev) => ({ ...prev, file: error ?? (file ? undefined : prev.file) }))
    }

    const clearError = (field: keyof FormErrors) => {
        setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
    }

    const validate = (companyName: string, jobTitle: string, jobDescription: string) => {
        const newErrors: FormErrors = {}

        if (!companyName.trim()) newErrors.companyName = 'Company name is required'
        if (!jobTitle.trim()) newErrors.jobTitle = 'Job title is required'
        if (!jobDescription.trim()) newErrors.jobDescription = 'Job description is required'

        if (source === 'main') {
            if (!mainResume) newErrors.file = 'Set a main resume first, or upload a file'
        } else if (!file) {
            newErrors.file = 'Resume is required'
        } else if (file.type !== ACCEPTED_FILE_TYPE) {
            newErrors.file = 'Only PDF files are allowed'
        } else if (file.size > MAX_FILE_SIZE) {
            newErrors.file = `File is too large. Max size is ${formatSize(MAX_FILE_SIZE)}`
        }

        return newErrors
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        const companyName = formData.get('company-name') as string
        const jobTitle = formData.get('job-title') as string
        const jobDescription = formData.get('job-description') as string

        const newErrors = validate(companyName, jobTitle, jobDescription)
        setErrors(newErrors)

        if (Object.keys(newErrors).length > 0) return

        // Analysis runs in the background queue; progress shows on the homepage.
        if (source === 'main' && mainResume) {
            enqueue({ companyName, jobTitle, jobDescription, mainResume })
        } else if (file) {
            enqueue({ companyName, jobTitle, jobDescription, file })
        } else {
            return
        }
        navigate('/')
    }

    return (
        <main className="!pt-0 min-h-screen bg-background">
            <Navbar backTo={{ to: '/', label: 'Back to homepage' }} />
            <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col gap-6">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 w-fit text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <div className="flex flex-col gap-6 lg:pt-6">
                        <span className="text-xs font-semibold uppercase tracking-wide text-accent-600">New Submission</span>
                        <h1>Smart feedback for your dream job</h1>
                        <p className="text-foreground-secondary max-w-md">
                            Drop your resume and the role you are applying for. You will get an ATS score and specific, section-by-section improvement tips.
                        </p>

                        <hr className="border-border" />

                        <ol className="flex flex-col gap-6">
                            <Step
                                number={1}
                                title="Add the role details"
                                description="Tell us the company, job title and description so feedback matches the role."
                            />
                            <Step
                                number={2}
                                title="Choose your resume"
                                description={`Use your main resume, or upload a PDF up to ${formatSize(MAX_FILE_SIZE)}.`}
                            />
                            <Step
                                number={3}
                                title="Get instant feedback"
                                description="An ATS score plus a breakdown of tone, content, structure and skills."
                            />
                        </ol>
                    </div>

                    <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 sm:p-8 w-full">
                            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
                                <div className="form-div">
                                    <label htmlFor="company-name">Company name</label>
                                    <input
                                        type="text"
                                        name="company-name"
                                        placeholder="e.g. Accion Labs"
                                        id="company-name"
                                        aria-invalid={!!errors.companyName}
                                        className={errors.companyName ? 'border-danger' : 'border-border'}
                                        onChange={(e) => e.target.value.trim() && clearError('companyName')}
                                    />
                                    {errors.companyName && <p className="text-danger text-sm">{errors.companyName}</p>}
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-title">Job title</label>
                                    <input
                                        type="text"
                                        name="job-title"
                                        placeholder="e.g. Senior Full Stack Developer"
                                        id="job-title"
                                        aria-invalid={!!errors.jobTitle}
                                        className={errors.jobTitle ? 'border-danger' : 'border-border'}
                                        onChange={(e) => e.target.value.trim() && clearError('jobTitle')}
                                    />
                                    {errors.jobTitle && <p className="text-danger text-sm">{errors.jobTitle}</p>}
                                </div>
                                <div className="form-div">
                                    <div className="flex items-baseline justify-between w-full">
                                        <label htmlFor="job-description">Job description</label>
                                    </div>
                                    <textarea
                                        rows={5}
                                        name="job-description"
                                        placeholder="Paste the job description here"
                                        id="job-description"
                                        aria-invalid={!!errors.jobDescription}
                                        className={errors.jobDescription ? 'border-danger' : 'border-border'}
                                        onChange={(e) => e.target.value.trim() && clearError('jobDescription')}
                                    />
                                    {errors.jobDescription && <p className="text-danger text-sm">{errors.jobDescription}</p>}
                                </div>
                                <div className="form-div">
                                    <label htmlFor="uploader">Resume</label>
                                    <div role="tablist" className="grid grid-cols-2 w-full p-1 bg-surface-alt rounded-full">
                                        {([
                                            ['upload', 'Upload'],
                                            ['main', 'Use main resume'],
                                        ] as const).map(([value, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                role="tab"
                                                aria-selected={source === value}
                                                onClick={() => handleSourceChange(value)}
                                                className={cn(
                                                    'text-sm font-semibold rounded-full py-2 transition-colors cursor-pointer',
                                                    source === value
                                                        ? 'bg-surface text-foreground shadow-sm'
                                                        : 'text-foreground-secondary hover:text-foreground'
                                                )}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {source === 'upload' ? (
                                        <FileUploader onFileSelect={handleFileSelect} />
                                    ) : mainResume ? (
                                        <div className="uploader-selected-file gap-3 w-full">
                                            <img src="/images/pdf.png" alt="pdf" className="size-10" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-lg text-foreground font-medium truncate">{mainResume.fileName}</p>
                                                <p className="text-sm text-foreground-secondary">{formatSize(mainResume.size)}</p>
                                            </div>
                                            <Link to="/main-resume" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                                                Change
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="uploader-selected-file w-full !justify-start">
                                            <p className="text-sm text-foreground-secondary">
                                                {isMainResumeLoading ? 'Loading your main resume...' : (
                                                    <>
                                                        You haven't set a main resume yet.{' '}
                                                        <Link to="/main-resume" className="font-semibold text-accent-600 hover:text-accent-700">
                                                            Upload one
                                                        </Link>
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                    )}
                                    {errors.file && <p className="text-danger text-sm">{errors.file}</p>}
                                </div>

                                <button className="primary-button" type="submit">Analyze resume</button>
                            </form>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Upload
