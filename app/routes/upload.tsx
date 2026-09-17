import { useEffect, useRef, useState, type FormEvent } from "react"
import Navbar from "../components/Navbar"
import FileUploader from "~/components/FileUploader"
import { ACCEPTED_FILE_TYPE, formatSize, generateUUID, MAX_FILE_SIZE, stripCodeFences } from "~/lib/utils"
import { usePuterStore } from "~/lib/puter"
import { useNavigate } from "react-router"
import { convertPdfToImage } from "~/lib/pdf2img"
import { AIResponseFormat, prepareInstructions } from "../../constants"

interface FormErrors {
    companyName?: string
    jobTitle?: string
    jobDescription?: string
    file?: string
}

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
            feedback: ''
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
        <main className="bg-main bg-cover">
            <Navbar />
            <section className="main-section">
                <div className="page-heading py-16">
                    <h1>Smart feedback for your dream job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" className="w-full" />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips</h2>
                    )}

                    {!isProcessing ? (
                        <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
                            <div className="form-div">
                                <label htmlFor="company-name">Company Name</label>
                                <input
                                    type="text"
                                    name="company-name"
                                    placeholder="Company Name"
                                    id="company-name"
                                    aria-invalid={!!errors.companyName}
                                    className={errors.companyName ? 'border-red-500' : ''}
                                    onChange={(e) => e.target.value.trim() && clearError('companyName')}
                                />
                                {errors.companyName && <p className="text-red-500 text-sm">{errors.companyName}</p>}
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-title">Job Title</label>
                                <input
                                    type="text"
                                    name="job-title"
                                    placeholder="Job Title"
                                    id="job-title"
                                    aria-invalid={!!errors.jobTitle}
                                    className={errors.jobTitle ? 'border-red-500' : ''}
                                    onChange={(e) => e.target.value.trim() && clearError('jobTitle')}
                                />
                                {errors.jobTitle && <p className="text-red-500 text-sm">{errors.jobTitle}</p>}
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea
                                    rows={5}
                                    name="job-description"
                                    placeholder="Job Description"
                                    id="job-description"
                                    aria-invalid={!!errors.jobDescription}
                                    className={errors.jobDescription ? 'border-red-500' : ''}
                                    onChange={(e) => e.target.value.trim() && clearError('jobDescription')}
                                />
                                {errors.jobDescription && <p className="text-red-500 text-sm">{errors.jobDescription}</p>}
                            </div>
                            <div className="form-div">
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                                {errors.file && <p className="text-red-500 text-sm">{errors.file}</p>}
                            </div>

                            <button className="primary-button" type="submit">Analyze Resume</button>
                        </form>
                    ) : (
                        <></>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Upload