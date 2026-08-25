import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import { usePuterStore } from "~/lib/puter"

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Resumind" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setIsLoading] = useState(false)
  const { auth, kv } = usePuterStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/')
  }, [auth.isAuthenticated])

  useEffect(() => {
    const loadResumes = async () => {
      setIsLoading(true)

      const resumes = await kv.list('resume:*', true) as KVItem[]

      const parsedResumes = resumes?.map((e) => JSON.parse(e.value) as Resume)
      console.log("parsedResumes", parsedResumes)
      setResumes(parsedResumes)
    }
    loadResumes()
    setIsLoading(false)
  }, [])

  return <main className="bg-[url('/images/bg-main.svg')] bg-cover">
    <Navbar />
    <section className="main-section">
      <div className="page-heading py-16">
        <h1>Track Your Applications & Resume Ratings</h1>
        {!loading && resumes?.length == 0 ? (
          <h2>No resumes found. Upload your first resume to get feedback.</h2>
        ) : (
          <h2>Review your submissions and check AI-powered feedback.</h2>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center">
          <img src="/images/resume-scan-2.gif" className="w-[200px]" />
        </div>
      )}


      {
        !loading && resumes.length > 0 && (
          <div className="resumes-section">
            {
              resumes.map((resume) => (
                <ResumeCard key={resume.id} resume={resume} />
              ))
            }
          </div>
        )
      }

      {
        loading && resumes.length == 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
        )
      }
    </section>

  </main>;
}
