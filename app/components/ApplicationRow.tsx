import { useState } from "react"
import { Link } from "react-router"
import ScoreBadge from "./ScoreBadge"
import { usePuterStore } from "~/lib/puter"
import { useAnalysisQueue } from "~/lib/queue"
import { deleteUnreferencedFiles } from "~/lib/mainResume"
import { getResumeStatus } from "~/lib/utils"

const formatDate = (iso?: string) => {
    if (!iso) return '—'
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const ApplicationRow = ({ resume, onDelete }: { resume: Resume; onDelete?: (id: string) => void }) => {
    const { kv } = usePuterStore()
    const statusText = useAnalysisQueue((state) => state.jobs[resume.id]?.statusText)
    const retry = useAnalysisQueue((state) => state.retry)
    const cancel = useAnalysisQueue((state) => state.cancel)
    const [isDeleting, setIsDeleting] = useState(false)

    const status = getResumeStatus(resume)
    const score = resume.feedback?.overallScore ?? 0
    const initial = (resume.companyName || resume.jobTitle || '?').charAt(0).toUpperCase()

    const handleDelete = async () => {
        if (isDeleting) return
        if (!window.confirm('Delete this resume? This cannot be undone.')) return

        setIsDeleting(true)
        try {
            // Stop any queued or running analysis first so it can't re-save the entry.
            cancel(resume.id)
            await deleteUnreferencedFiles([resume.resumePath, resume.imagePath], [resume.id])
            await kv.delete(`resume:${resume.id}`)
            onDelete?.(resume.id)
        } finally {
            setIsDeleting(false)
        }
    }

    const title = (
        <>
            <span className="w-10 h-10 flex-shrink-0 rounded-xl bg-accent-100 text-accent-700 font-display font-bold flex items-center justify-center">
                {initial}
            </span>
            <span className="flex flex-col">
                <span className="font-semibold text-foreground">{resume.companyName || 'Resume'}</span>
                {resume.jobTitle && <span className="text-sm text-foreground-secondary">{resume.jobTitle}</span>}
            </span>
        </>
    )

    return (
        <tr className="border-t border-border">
            <td className="p-4">
                {status === 'done' ? (
                    <Link to={`/resume/${resume.id}`} className="flex items-center gap-3">{title}</Link>
                ) : (
                    <div className="flex items-center gap-3">{title}</div>
                )}
            </td>
            <td className="p-4 text-sm text-foreground-secondary whitespace-nowrap">{formatDate(resume.createdAt)}</td>
            <td className="p-4">
                {status === 'processing' && (
                    <div className="flex items-center gap-3 min-w-[140px] text-sm text-foreground-secondary">
                        <span className="w-4 h-4 flex-shrink-0 rounded-full border-2 border-accent-100 border-t-accent-600 animate-spin" />
                        {statusText || 'Processing...'}
                    </div>
                )}
                {status === 'failed' && (
                    <p className="text-sm text-danger min-w-[140px] max-w-[240px] truncate" title={resume.error}>
                        {resume.error || 'Analysis failed'}
                    </p>
                )}
                {status === 'done' && (
                    <div className="flex items-center gap-3 min-w-[140px]">
                        <div className="flex-1 h-2 rounded-full bg-surface-alt overflow-hidden">
                            <div
                                className="h-full rounded-full bg-accent-600"
                                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                            />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{score}</span>
                    </div>
                )}
            </td>
            <td className="p-4">
                {status === 'processing' && (
                    <div className="score-badge bg-accent-100 text-accent-700">
                        <p className="text-sm font-medium">Processing</p>
                    </div>
                )}
                {status === 'failed' && (
                    <div className="score-badge bg-danger-bg text-danger">
                        <p className="text-sm font-medium">Failed</p>
                    </div>
                )}
                {status === 'done' && <ScoreBadge score={score} />}
            </td>
            <td className="p-4">
                <div className="flex items-center gap-2 justify-end">
                    {status === 'failed' && (
                        <button
                            type="button"
                            onClick={() => retry(resume)}
                            aria-label="Retry analysis"
                            title="Retry analysis"
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-foreground-secondary hover:bg-surface-alt transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 12a8 8 0 0 1 14-5.3M20 4v5h-5M20 12a8 8 0 0 1-14 5.3M4 20v-5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                    {status === 'done' && (
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
                    )}
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
