import { cn } from "~/lib/utils"

interface Suggestion {
    type: "good" | "improve";
    tip: string;
}

const ATS = ({ score, suggestions }: { score: number, suggestions: Suggestion[] }) => {
    const tone = score > 69 ? 'positive' : score > 49 ? 'caution' : 'danger'

    const bg = tone === 'positive' ? 'bg-positive-bg' : tone === 'caution' ? 'bg-caution-bg' : 'bg-danger-bg'
    const border = tone === 'positive' ? 'border-positive-border' : tone === 'caution' ? 'border-caution-border' : 'border-danger/20'
    const accent = tone === 'positive' ? 'bg-positive' : tone === 'caution' ? 'bg-caution' : 'bg-danger'

    const clampedScore = Math.min(100, Math.max(0, score))

    return (
        <div className={cn('rounded-2xl border p-6 sm:p-8 w-full', bg, border)}>
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <span className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', accent)}>
                        {tone === 'positive' ? (
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A1 1 0 003 19.5h18a1 1 0 00.89-1.46L13.71 3.86a1 1 0 00-1.42 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </span>
                    <h2 className="text-xl font-display font-bold text-foreground">ATS compatibility</h2>
                </div>
                <p className="text-2xl font-display font-bold text-foreground flex-shrink-0">
                    {score}<span className="text-base font-medium text-foreground-secondary">/100</span>
                </p>
            </div>

            <div className="h-2.5 rounded-full bg-surface/70 overflow-hidden mb-6">
                <div className={cn('h-full rounded-full', accent)} style={{ width: `${clampedScore}%` }} />
            </div>

            <p className="text-foreground-secondary mb-4">
                This score represents how well your resume is likely to perform in Applicant
                Tracking Systems used by employers.
            </p>

            <ul className="flex flex-col gap-3">
                {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex flex-row gap-2 items-start">
                        <img
                            src={suggestion.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'}
                            alt={suggestion.type === 'good' ? 'Check' : 'Warning'}
                            className="w-5 h-5 mt-0.5 flex-shrink-0"
                        />
                        <span className="text-foreground-secondary">{suggestion.tip}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default ATS
