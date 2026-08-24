import { useState, type FormEvent } from "react"
import Navbar from "../components/Navbar"
import FileUploader from "~/components/FileUploader"

interface FormErrors {
    companyName?: string
    jobTitle?: string
    jobDescription?: string
    file?: string
}

const Upload = () => {
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusText, setStatusText] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<FormErrors>({})

    const handleFileSelect = (file: File | null) => {
        setFile(file)
        setErrors((prev) => ({ ...prev, file: file ? undefined : prev.file }))
    }

    const clearError = (field: keyof FormErrors) => {
        setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
    }

    const validate = (companyName: string, jobTitle: string, jobDescription: string) => {
        const newErrors: FormErrors = {}

        if (!companyName.trim()) newErrors.companyName = 'Company name is required'
        if (!jobTitle.trim()) newErrors.jobTitle = 'Job title is required'
        if (!jobDescription.trim()) newErrors.jobDescription = 'Job description is required'
        if (!file) newErrors.file = 'Resume is required'

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

    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
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