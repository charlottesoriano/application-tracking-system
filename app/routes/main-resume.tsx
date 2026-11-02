import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import Navbar from "~/components/Navbar"
import FileUploader from "~/components/FileUploader"
import { usePuterStore } from "~/lib/puter"
import { getMainResume, removeMainResume, saveMainResume } from "~/lib/mainResume"
import { formatSize, MAX_FILE_SIZE } from "~/lib/utils"

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const MainResumePage = () => {
    const { auth, fs } = usePuterStore()
    const navigate = useNavigate()
    const [mainResume, setMainResume] = useState<MainResume | null>(null)
    const [imageUrl, setImageUrl] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [file, setFile] = useState<File | null>(null)
    // Bumped after a save so the uploader resets to its empty state.
    const [uploaderKey, setUploaderKey] = useState(0)
    const [error, setError] = useState<string>()
    const [statusText, setStatusText] = useState('')

    useEffect(() => {
        if (!auth.isAuthenticated) navigate('/auth?next=/main-resume')
    }, [auth.isAuthenticated])

    useEffect(() => {
        getMainResume()
            .then(setMainResume)
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        if (!mainResume) return setImageUrl('')

        let url = ''
        let cancelled = false
        fs.read(mainResume.imagePath).then((blob) => {
            if (!blob || cancelled) return
            url = URL.createObjectURL(blob)
            setImageUrl(url)
        })
        return () => {
            cancelled = true
            if (url) URL.revokeObjectURL(url)
        }
    }, [mainResume?.imagePath])

    const handleFileSelect = (file: File | null, error?: string) => {
        setFile(file)
        setError(error)
    }

    const handleSave = async () => {
        if (!file || statusText) return

        setError(undefined)
        setStatusText('Uploading...')
        try {
            setMainResume(await saveMainResume(file))
            setFile(null)
            setUploaderKey((key) => key + 1)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setStatusText('')
        }
    }

    const handleRemove = async () => {
        if (statusText) return
        if (!window.confirm('Remove your main resume? Applications already analyzed with it keep their copy.')) return

        setStatusText('Removing...')
        try {
            await removeMainResume()
            setMainResume(null)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : 'Something went wrong')
        } finally {
            setStatusText('')
        }
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
                        <span className="text-xs font-semibold uppercase tracking-wide text-accent-600">Main Resume</span>
                        <h1>Upload once, reuse everywhere</h1>
                        <p className="text-foreground-secondary max-w-md">
                            Save the resume you send to most roles. When you submit a new application, choose
                            "Use main resume" instead of uploading the same file again.
                        </p>

                        {isLoading ? (
                            <img src="/images/resume-scan-2.gif" alt="" className="w-[160px]" />
                        ) : mainResume ? (
                            <div className="flex flex-col gap-4">
                                <div className="uploader-selected-file gap-3 bg-surface border border-border">
                                    <img src="/images/pdf.png" alt="pdf" className="size-10" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-lg text-foreground font-medium truncate">{mainResume.fileName}</p>
                                        <p className="text-sm text-foreground-secondary">
                                            {formatSize(mainResume.size)} · Uploaded {formatDate(mainResume.uploadedAt)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemove}
                                        disabled={!!statusText}
                                        className="text-sm font-semibold text-danger px-3 py-1.5 rounded-full hover:bg-danger/10 disabled:opacity-50 cursor-pointer transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt="Main resume preview"
                                        className="w-full max-w-md border border-border rounded-2xl shadow-sm"
                                    />
                                )}
                            </div>
                        ) : (
                            <p className="text-foreground-muted">You haven't set a main resume yet.</p>
                        )}
                    </div>

                    <div className="bg-surface border border-border rounded-2xl shadow-sm p-6 sm:p-8 w-full flex flex-col gap-6">
                        <div className="form-div">
                            <label htmlFor="uploader">{mainResume ? 'Replace main resume' : 'Upload main resume'}</label>
                            <FileUploader key={uploaderKey} onFileSelect={handleFileSelect} />
                            {error && <p className="text-danger text-sm">{error}</p>}
                            <p className="text-sm text-foreground-muted">PDF up to {formatSize(MAX_FILE_SIZE)}.</p>
                        </div>
                        <button
                            type="button"
                            className="primary-button disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleSave}
                            disabled={!file || !!statusText}
                        >
                            {statusText || (mainResume ? 'Replace main resume' : 'Save main resume')}
                        </button>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default MainResumePage
