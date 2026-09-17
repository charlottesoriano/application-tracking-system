import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router"
import { usePuterStore } from "~/lib/puter"

export const meta = () => ([
    { title: 'The Reality Check | Auth' },
    { name: 'description', content: 'Log into your account' }
])

const highlights = [
    'An ATS compatibility score for every resume you upload',
    'Section-by-section feedback, not just a single number',
    'Every application and resume version tracked in one place',
]

const Logo = ({ dark }: { dark?: boolean }) => (
    <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center p-2 ${dark ? 'bg-white/10' : 'bg-accent-900'}`}>
            <img src="/images/logo-transparent.png" alt="" className="w-full h-full object-contain" />
        </div>
        <span className={`font-display font-bold text-2xl ${dark ? 'text-white' : 'text-foreground'}`}>
            Reality Check
        </span>
    </div>
)

const Auth = () => {
    const { isLoading, error, auth } = usePuterStore()
    const location = useLocation()
    const next = location.search.split('next=')[1]
    const navigate = useNavigate()

    useEffect(() => {
        if (auth.isAuthenticated) navigate(next)
    }, [auth.isAuthenticated, next])

    return (
        <main className="!pt-0 min-h-screen flex flex-col lg:flex-row">
            <section className="hidden lg:flex lg:w-1/2 xl:w-[45%] flex-col justify-between bg-accent-900 p-12 xl:p-16">
                <Logo dark />

                <div className="flex flex-col gap-8 max-w-xl">
                    <h1 className="auth-hero-heading">
                        Know exactly how your resume performs, before you hit submit.
                    </h1>
                    <ul className="flex flex-col gap-4">
                        {highlights.map((item) => (
                            <li key={item} className="flex items-start gap-3 text-white/90">
                                <svg
                                    className="mt-0.5 w-5 h-5 flex-shrink-0"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
                                    <path
                                        d="M8 12.5L10.5 15L16 9"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="text-sm text-white/50 max-w-sm">
                    Built for job seekers who want a clear read on their resume before every application.
                </p>
            </section>

            <section className="flex-1 flex flex-col items-center justify-center gap-10 bg-surface px-6 py-16 lg:px-16">
                <div className="lg:hidden">
                    <Logo />
                </div>

                <div className="flex flex-col gap-8 w-full max-w-sm">
                    <div className="flex flex-col gap-2">
                        <h2 className="auth-panel-heading">Welcome back</h2>
                        <p className="text-foreground-secondary">
                            Log in to continue tracking your applications and resume scores.
                        </p>
                    </div>

                    {isLoading ? (
                        <button className="auth-button animate-pulse cursor-default" disabled>
                            <span>Signing you in...</span>
                        </button>
                    ) : auth.isAuthenticated ? (
                        <button className="auth-button" onClick={auth.signOut}>
                            <span>Log Out</span>
                        </button>
                    ) : (
                        <button className="auth-button" onClick={auth.signIn}>
                            <span>Log In</span>
                            <svg
                                className="w-4 h-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M5 12h14M13 6l6 6-6 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}

                    {error && (
                        <p className="text-danger text-sm">{error}</p>
                    )}

                    <p className="text-xs text-foreground-muted">
                        By continuing you agree to our Terms of Service and acknowledge our Privacy Policy.
                    </p>
                </div>
            </section>
        </main>
    )
}

export default Auth
