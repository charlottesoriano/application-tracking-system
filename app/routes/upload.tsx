import { useEffect, useRef, useState, type FormEvent } from "react"
import Navbar from "../components/Navbar"
import FileUploader from "~/components/FileUploader"
import { ACCEPTED_FILE_TYPE, formatSize, generateUUID, MAX_FILE_SIZE, stripCodeFences } from "~/lib/utils"
import { usePuterStore } from "~/lib/puter"
import { Link, useNavigate } from "react-router"
import { convertPdfToImage } from "~/lib/pdf2img"
import { AIResponseFormat, prepareInstructions } from "../../constants"

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
    const { auth, isLoading, fs, ai, kv } = usePuterStore()
    const navigate = useNavigate()
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusText, setStatusText] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<FormErrors>({})
    const cancelledRef = useRef(false)

    useEffect(() => {
        if (!auth.isAuthenticated) {
            cancelledRef.current = true
            if (isProcessing) {
                setIsProcessing(false)
                setStatusText("")
            }
            navigate('/auth?next=/upload')
        }
    }, [auth.isAuthenticated])

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

        if (!file) {
            newErrors.file = 'Resume is required'
        } else if (file.type !== ACCEPTED_FILE_TYPE) {
            newErrors.file = 'Only PDF files are allowed'
        } else if (file.size > MAX_FILE_SIZE) {
            newErrors.file = `File is too large. Max size is ${formatSize(MAX_FILE_SIZE)}`
        }

        return newErrors
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
        cancelledRef.current = false
        setIsProcessing(true)
        setStatusText('Uploading the file...')
        const uploadedFile = await fs.upload([file])
        if (cancelledRef.current) return

        if (!uploadedFile) return setStatusText('Error: Failed to upload file')

        setStatusText('Converting to image...')
        const imageFile = await convertPdfToImage(file)
        if (cancelledRef.current) return
        console.log("imageFile", imageFile)
        if (!imageFile || !imageFile.file) setStatusText('Error: Failed to convert PDF to image')

        setStatusText('Uploading the image...')
        console.log(imageFile.file)
        const uploadedImage = await fs.upload([imageFile.file!])
        if (cancelledRef.current) return
        if (!uploadedImage) return setStatusText('Error: Failed to upload image')

        setStatusText('Preparing data...')

        const uuid = generateUUID()

        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName, jobTitle, jobDescription,
            feedback: '',
            createdAt: new Date().toISOString()
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data))
        if (cancelledRef.current) return
        setStatusText('Analyzing...')

        const feedback = await ai.feedback(
            uploadedFile.path,
            prepareInstructions({ jobTitle, jobDescription })
        )
        if (cancelledRef.current) return

        if (!feedback) return setStatusText('Error: Failed to analyze resume')

        const feedbackText = typeof feedback.message.content === 'string'
            ? feedback.message.content
            : feedback.message.content[0].text

        data.feedback = JSON.parse(stripCodeFences(feedbackText))
        await kv.set(`resume:${uuid}`, JSON.stringify(data))
        if (cancelledRef.current) return
        setStatusText('Analysis complete. Redirecting...')
        console.log(data)
        navigate(`/resume/${uuid}`)
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

        if (!file) return

        handleAnalyze({ companyName, jobTitle, jobDescription, file })
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
                                title="Upload your resume"
                                description={`PDF up to ${formatSize(MAX_FILE_SIZE)}.`}
                            />
                            <Step
                                number={3}
                                title="Get instant feedback"
                                description="An ATS score plus a breakdown of tone, content, structure and skills."
                            />
                        </ol>
                    </div>

                    <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 sm:p-8 w-full">
                        {isProcessing ? (
                            <div className="flex flex-col items-center gap-6 py-10 text-center">
                                <img src="/images/resume-scan.gif" className="w-full max-w-xs" />
                                <p className="font-display font-semibold text-lg text-foreground">{statusText}</p>
                            </div>
                        ) : (
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
                                    <label htmlFor="uploader">Upload resume</label>
                                    <FileUploader onFileSelect={handleFileSelect} />
                                    {errors.file && <p className="text-danger text-sm">{errors.file}</p>}
                                </div>

                                <button className="primary-button" type="submit">Analyze resume</button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Upload
