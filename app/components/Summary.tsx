const ScoreRing = ({ score }: { score: number }) => {
    const radius = 54
    const stroke = 10
    const normalizedRadius = radius - stroke / 2
    const circumference = 2 * Math.PI * normalizedRadius
    const progress = Math.min(100, Math.max(0, score)) / 100
    const strokeDashoffset = circumference * (1 - progress)

    return (
        <div className="relative w-[140px] h-[140px] flex-shrink-0">
            <svg width="100%" height="100%" viewBox="0 0 120 120" className="-rotate-90">
                <circle cx="60" cy="60" r={normalizedRadius} stroke="#E7EEFC" strokeWidth={stroke} fill="none" />
                <circle
                    cx="60"
                    cy="60"
                    r={normalizedRadius}
                    stroke="#2F5FD9"
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-display font-bold text-foreground">{score}</span>
                <span className="text-sm text-foreground-muted">/100</span>
            </div>
        </div>
    )
}

const CategoryStat = ({ title, score }: { title: string, score: number }) => (
    <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-foreground-secondary">{title}</p>
            <p className="text-sm font-semibold text-foreground">{score}</p>
        </div>
        <div className="h-1.5 rounded-full bg-surface-alt overflow-hidden">
            <div
                className="h-full rounded-full bg-accent-600"
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
        </div>
    </div>
)

const Summary = ({ feedback }: { feedback: Feedback }) => {
    return (
        <div className="bg-surface border border-border rounded-2xl w-full p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
                <ScoreRing score={feedback.overallScore} />
                <div className="hidden sm:block w-px self-stretch bg-border" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    <CategoryStat title="Tone & style" score={feedback.toneAndStyle.score} />
                    <CategoryStat title="Content" score={feedback.content.score} />
                    <CategoryStat title="Structure" score={feedback.structure.score} />
                    <CategoryStat title="Skills" score={feedback.skills.score} />
                </div>
            </div>
        </div>
    )
}

export default Summary
