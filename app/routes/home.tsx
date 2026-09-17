import Navbar from "~/components/Navbar";
import type { Route } from "./+types/home";
import ApplicationRow from "~/components/ApplicationRow";
import UploadButton from "~/components/UploadButton";
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { usePuterStore } from "~/lib/puter"

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "The Reality Check" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

type SortOrder = 'newest' | 'oldest'

const StatCell = ({ label, value, suffix }: { label: string; value: number; suffix?: string }) => (
  <div className="flex flex-col gap-2 p-6">
    <span className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">{label}</span>
    <span className="text-3xl font-display font-bold text-foreground">
      {value}
      {suffix && <span className="text-lg font-medium text-foreground-secondary">{suffix}</span>}
    </span>
  </div>
)

export default function Home() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setIsLoading] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
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

  const averageScore = resumes.length
    ? Math.round(resumes.reduce((sum, r) => sum + (r.feedback?.overallScore ?? 0), 0) / resumes.length)
    : 0
  const topScore = resumes.length
    ? Math.max(...resumes.map((r) => r.feedback?.overallScore ?? 0))
    : 0

  const sortedResumes = [...resumes].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB
  })

  return <main className="!pt-0 min-h-screen bg-background">
    <Navbar />
    <section className="main-section max-w-[1400px] w-full !mx-auto items-stretch px-4 sm:px-6 lg:px-10">
      <div className="flex flex-col gap-3 w-full items-start">
        <h1>Track your applications and resume ratings</h1>
        {!loading && resumes.length === 0 ? (
          <h2 className="max-w-2xl">No resumes found. Upload your first resume to get feedback.</h2>
        ) : (
          <h2 className="max-w-2xl">Review every submission in one place and see exactly how each tailored resume is scoring, before a recruiter does.</h2>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center">
          <img src="/images/resume-scan-2.gif" className="w-[200px]" />
        </div>
      )}

      {!loading && resumes.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border bg-surface border border-border rounded-2xl w-full overflow-hidden">
            <StatCell label="Applications" value={resumes.length} />
            <StatCell label="Average score" value={averageScore} suffix="/100" />
            <StatCell label="Top score" value={topScore} suffix="/100" />
          </div>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-display font-bold text-foreground">Your applications</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    className="appearance-none bg-surface border border-border rounded-full pl-4 pr-9 py-2 text-sm font-medium text-foreground cursor-pointer focus:outline-none"
                  >
                    <option value="newest">Sort: Newest</option>
                    <option value="oldest">Sort: Oldest</option>
                  </select>
                  <svg
                    className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground-muted"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={isDeletingAll}
                  className="bg-danger-bg text-danger border border-danger/20 hover:bg-danger/10 font-semibold px-4 py-2 rounded-full text-sm disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isDeletingAll ? 'Deleting...' : 'Delete all'}
                </button>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl w-full overflow-hidden">
              <div className="overflow-auto max-h-[520px]">
                <table className="w-full min-w-[720px] text-left border-collapse">
                  <thead className="bg-surface-alt text-xs font-semibold uppercase tracking-wide text-foreground-muted sticky top-0 z-10">
                    <tr>
                      <th className="p-4 font-semibold">Company / Role</th>
                      <th className="p-4 font-semibold">Applied</th>
                      <th className="p-4 font-semibold">Score</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedResumes.map((resume) => (
                      <ApplicationRow key={resume.id} resume={resume} onDelete={handleResumeDelete} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && resumes.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-10 gap-4">
          <UploadButton />
        </div>
      )}
    </section>

  </main>;
}
