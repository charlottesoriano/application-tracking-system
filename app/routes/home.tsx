import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import ResumeCard from "~/components/ResumeCard";
import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router"
import { usePuterStore } from "~/lib/puter"

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "The Reality Check" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setIsLoading] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const { auth, fs, kv } = usePuterStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.isAuthenticated) navigate('/auth?next=/')
  }, [auth.isAuthenticated])

  useEffect(() => {
    const dirname = (path: string) => path.slice(0, path.lastIndexOf('/'))

    const loadResumes = async () => {
      setIsLoading(true)

      const kvResumes = await kv.list('resume:*', true) as KVItem[]
      const parsedResumes = kvResumes?.map((e) => JSON.parse(e.value) as Resume) ?? []

      const dirs = new Set(parsedResumes.flatMap((r) => [dirname(r.resumePath), dirname(r.imagePath)]))
      const existingPaths = new Set<string>()
      await Promise.all(
        Array.from(dirs).map(async (dir) => {
          try {
            const items = await fs.readDir(dir)
            items?.forEach((item) => existingPaths.add(item.path))
          } catch {
            // Directory itself is gone; its files are treated as missing.
          }
        })
      )

      const validResumes: Resume[] = []
      await Promise.all(
        parsedResumes.map(async (resume) => {
          const resumeExists = existingPaths.has(resume.resumePath)
          const imageExists = existingPaths.has(resume.imagePath)

          if (resumeExists && imageExists) {
            validResumes.push(resume)
            return
          }

          // Orphaned entry: storage is missing one or both files. Finish
          // cleaning it up so it doesn't keep showing up on future loads.
          const cleanup: Promise<unknown>[] = [kv.delete(`resume:${resume.id}`)]
          if (resumeExists) cleanup.push(fs.delete(resume.resumePath))
          if (imageExists) cleanup.push(fs.delete(resume.imagePath))
          await Promise.allSettled(cleanup)
        })
      )

      setResumes(validResumes)
    }
    loadResumes()
    setIsLoading(false)
  }, [])

  const handleResumeDelete = (id: string) => {
    setResumes((prev) => prev.filter((resume) => resume.id !== id))
  }

  const handleDeleteAll = async () => {
    if (isDeletingAll || resumes.length === 0) return
    if (!window.confirm(`Delete all ${resumes.length} resume(s)? This cannot be undone.`)) return

    setIsDeletingAll(true)
    try {
      await Promise.all(
        resumes.flatMap((resume) => [
          fs.delete(resume.resumePath),
          fs.delete(resume.imagePath),
          kv.delete(`resume:${resume.id}`),
        ])
      )
      setResumes([])
    } finally {
      setIsDeletingAll(false)
    }
  }

  return <main className="bg-main bg-cover">
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
          <>
            <div className="flex justify-end w-full max-w-[1850px] px-4">
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-full disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isDeletingAll ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
            <div className="resumes-section">
              {
                resumes.map((resume) => (
                  <ResumeCard key={resume.id} resume={resume} onDelete={handleResumeDelete} />
                ))
              }
            </div>
          </>
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
