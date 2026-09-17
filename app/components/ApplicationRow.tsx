import { useState } from "react"
import { Link } from "react-router"
import ScoreBadge from "./ScoreBadge"
import { usePuterStore } from "~/lib/puter"

const formatDate = (iso?: string) => {
    if (!iso) return '—'
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const ApplicationRow = ({ resume, onDelete }: { resume: Resume; onDelete?: (id: string) => void }) => {
    const { fs, kv } = usePuterStore()
    const [isDeleting, setIsDeleting] = useState(false)

    const score = resume.feedback?.overallScore ?? 0
    const initial = (resume.companyName || resume.jobTitle || '?').charAt(0).toUpperCase()

    const handleDelete = async () => {
        if (isDeleting) return
        if (!window.confirm('Delete this resume? This cannot be undone.')) return

        setIsDeleting(true)
        try {
            await Promise.all([
                fs.delete(resume.resumePath),
                fs.delete(resume.imagePath),
            ])
            await kv.delete(`resume:${resume.id}`)
            onDelete?.(resume.id)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <tr className="border-t border-border">
            <td className="p-4">
                <Link to={`/resume/${resume.id}`} className="flex items-center gap-3">
                    <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-accent-100 text-accent-700 font-display font-bold flex items-center justify-center">
                        {initial}
                    </span>
                    <span className="flex flex-col">
                        <span className="font-semibold text-foreground">{resume.companyName || 'Resume'}</span>
                        {resume.jobTitle && <span className="text-sm text-foreground-secondary">{resume.jobTitle}</span>}
                    </span>
                </Link>
            </td>
            <td className="p-4 text-sm text-foreground-secondary whitespace-nowrap">{formatDate(resume.createdAt)}</td>
            <td className="p-4">
                <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="flex-1 h-2 rounded-full bg-surface-alt overflow-hidden">
                        <div
                            className="h-full rounded-full bg-accent-600"
                            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                        />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{score}</span>
                </div>
            </td>
            <td className="p-4">
                <ScoreBadge score={score} />
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2 justify-end">
                    <Link
                        to={`/resume/${resume.id}`}
                        aria-label="View resume"
                        title="View resume"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground-secondary hover:bg-surface-alt transition-colors"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        aria-label="Delete resume"
                        title="Delete resume"
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground-secondary hover:bg-danger hover:text-white hover:border-danger transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        {isDeleting ? (
                            <span className="text-xs">...</span>
                        ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                </div>
            </td>
        </tr>
    )
}

export default ApplicationRow
