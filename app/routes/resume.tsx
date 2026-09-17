import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import ATS from '~/components/ATS'
import Details from '~/components/Details'
import Summary from '~/components/Summary'
import Navbar from '~/components/Navbar'
import { usePuterStore } from '~/lib/puter'
import { cn } from '~/lib/utils'

export const meta = () => ([
    { title: 'The Reality Check | Review' },
    { name: 'description', content: 'Detailed overview of your resume' }
])

const MatchBadge = ({ score }: { score: number }) => {
    const tone = score > 69 ? 'positive' : score > 49 ? 'caution' : 'danger'
    const style = tone === 'positive'
        ? 'bg-positive-bg text-positive'
        : tone === 'caution'
            ? 'bg-caution-bg text-caution'
            : 'bg-danger-bg text-danger'
    const label = tone === 'positive' ? 'Strong match' : tone === 'caution' ? 'Good match' : 'Needs work'

    return (
        <span className={cn('px-3 py-1.5 rounded-full text-sm font-semibold flex-shrink-0', style)}>
            {label}
        </span>
    )
}

const Resume = () => {
    const [imageUrl, setImageUrl] = useState('')
    const [resumeUrl, setResumeUrl] = useState('')
    const [feedback, setFeedback] = useState<Feedback | null>(null)
    const [resumeInfo, setResumeInfo] = useState<{ companyName?: string; jobTitle?: string }>({})
    const { auth, isLoading, fs, kv } = usePuterStore()
    const { id } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume${id}`)
    }, [isLoading])

    useEffect(() => {
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`)

            if (!resume) return

            const data = JSON.parse(resume)
            setResumeInfo({ companyName: data.companyName, jobTitle: data.jobTitle })

            const resumeBlob = await fs.read(data.resumePath)
            if (!resumeBlob) return
            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' })
            const resumeUrl = URL.createObjectURL(pdfBlob)
            setResumeUrl(resumeUrl)

            const imageBlob = await fs.read(data.imagePath)
            if (!imageBlob) return
            const imageUrl = URL.createObjectURL(imageBlob)
            setImageUrl(imageUrl)

            setFeedback(data.feedback)
        }

        loadResume()
    }, [id])

    return (
        <main className="!pt-0 min-h-screen bg-background">
            <Navbar />
            <section className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-10 flex flex-col gap-6">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 w-fit text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to homepage
                </Link>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="!text-4xl">
                        {resumeInfo.companyName || 'Resume'}
                        {resumeInfo.jobTitle && <> · {resumeInfo.jobTitle}</>}
                    </h1>
                    {feedback && <MatchBadge score={feedback.overallScore} />}
                </div>

                {feedback ? (
                    <div className="flex flex-col gap-6 animate-in fade-in duration-1000">
                        <Summary feedback={feedback} />

                        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
                            {imageUrl && resumeUrl && (
                                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                                    <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                        <img src={imageUrl} className="w-full h-auto object-contain" title="resume" />
                                    </a>
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                                <h3 className="text-xl font-display font-bold text-foreground">Score breakdown</h3>
                                <Details feedback={feedback} />
                            </div>
                        </div>
                    </div>
                ) : (
                    <img src="/images/resume-scan-2.gif" className="w-full max-w-md mx-auto" />
                )}
            </section>
        </main>
    )
}

export default Resume
