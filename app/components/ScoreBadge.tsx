const ScoreBadge = ({ score }: { score: number }) => {
    const badgeStyles = score > 69
        ? 'bg-positive-bg text-positive'
        : score > 49
            ? 'bg-caution-bg text-caution'
            : 'bg-danger-bg text-danger'

    const label = score > 69 ? 'Strong' : score > 49 ? 'Good Start' : 'Needs Work'

    return (
        <div className={`score-badge ${badgeStyles}`}>
            <p className="text-sm font-medium">{label}</p>
        </div>
    )
}

export default ScoreBadge
