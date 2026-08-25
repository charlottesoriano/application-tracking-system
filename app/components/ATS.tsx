interface Suggestion {
    type: "good" | "improve";
    tip: string;
}

const ATS = ({ score, suggestions }: { score: number, suggestions: Suggestion[] }) => {
    const gradientClass = score > 69
        ? 'from-green-100'
        : score > 49
            ? 'from-yellow-100'
            : 'from-red-100'

    const icon = score > 69
        ? '/icons/ats-good.svg'
        : score > 49
            ? '/icons/ats-warning.svg'
            : '/icons/ats-bad.svg'

    const subtitle = score > 69
        ? 'Great Job!'
        : score > 49
            ? 'Good Start'
            : 'Needs Improvement'

    return (
        <div className={`bg-gradient-to-b ${gradientClass} to-white rounded-2xl shadow-md w-full p-6`}>
            <div className="flex flex-row items-center gap-4 mb-6">
                <img src={icon} alt="ATS Score Icon" className="w-10 h-10" />
                <h2 className="text-2xl font-bold">ATS Score - {score}/100</h2>
            </div>

            <div className="flex flex-col gap-4">
                <h3 className="text-xl font-semibold">{subtitle}</h3>
                <p className="text-gray-500">
                    This score represents how well your resume is likely to perform in Applicant
                    Tracking Systems used by employers.
                </p>

                <div className="flex flex-col gap-3">
                    {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex flex-row gap-2 items-start">
                            <img
                                src={suggestion.type === 'good' ? '/icons/check.svg' : '/icons/warning.svg'}
                                alt={suggestion.type === 'good' ? 'Check' : 'Warning'}
                                className="w-5 h-5 mt-1"
                            />
                            <p className="text-gray-500">{suggestion.tip}</p>
                        </div>
                    ))}
                </div>

                <p className="text-gray-500 italic">
                    Keep refining your resume to improve your chances of passing ATS filters and
                    landing more interviews.
                </p>
            </div>
        </div>
    )
}

export default ATS
