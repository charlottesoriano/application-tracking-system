const ScoreBadge = ({ score }: { score: number }) => {
    const badgeStyles = score > 69
        ? 'bg-badge-green text-green-600'
        : score > 49
            ? 'bg-badge-yellow text-yellow-600'
            : 'bg-badge-red text-red-600'

    const label = score > 69 ? 'Strong' : score > 49 ? 'Good Start' : 'Needs Work'

    return (
        <div className={`score-badge ${badgeStyles}`}>
            <p className="text-sm font-medium">{label}</p>
        </div>
    )
}

export default ScoreBadge
