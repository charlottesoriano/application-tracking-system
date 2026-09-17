import { Link } from "react-router"
import ScoreCircle from "./ScoreCircle"
import { usePuterStore } from "~/lib/puter"
import { useEffect, useState } from "react"



const ResumeCard = ({ resume, onDelete }: { resume: Resume; onDelete?: (id: string) => void }) => {
    const { fs, kv } = usePuterStore()
    const [resumeUrl, setResumeUrl] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const loadResume = async () => {
            try {
                const blob = await fs.read(resume.imagePath)
                if (!blob) return

                let url = URL.createObjectURL(blob)
                setResumeUrl(url)
            } catch {
                // Image no longer exists in storage; leave resumeUrl unset.
            }
        }

        loadResume()
    }, [resume.imagePath])

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (isDeleting) return
        if (!window.confirm('Delete this resume? This cannot be undone.')) return

        setIsDeleting(true)
        try {
            await Promise.all([
                fs.delete(resume.resumePath),
                fs.delete(resume.imagePath),
            ])
            await kv.delete(`resume:${resume.id}`)
            if (resumeUrl) URL.revokeObjectURL(resumeUrl)
            onDelete?.(resume.id)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Link to={`/resume/${resume.id}`}
            className="resume-card animate-in fade-in duration-1000 relative">
            <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Delete resume"
                title="Delete resume"
                className="absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white/90 shadow-md hover:bg-red-500 hover:text-white text-gray-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
                {isDeleting ? '...' : '✕'}
            </button>
            <div className="resume-card-header">
                <div className="flex flex-col gap-2">
                    {resume.companyName && <h2 className="!text-black font-bold break-words">
                        {resume.companyName}
                    </h2>}
                    {resume.jobTitle && <h3 className="text-lg break-words text-gray-500">
                        {resume.jobTitle}
                    </h3>}
                    {!resume.companyName && !resume.jobTitle && <h2>Resume</h2>}
                </div>
                <div className="flex-shrink-0">
                    <ScoreCircle score={resume.feedback.overallScore} />
                </div>
            </div>
            {resumeUrl && (<div className="gradient-border animate-in fade-in duration-1000">
                <div className="w-full h-full">
                    {resumeUrl && <img src={resumeUrl} alt="resume" className="w-full h-[350px] max-sm:h-[200px] object-cover object-top" />}
                </div>
            </div>)}
        </Link>
    )
}

export default ResumeCard