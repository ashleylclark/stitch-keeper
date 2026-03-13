import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { mockPatterns } from '../data/mock-patterns'
import { mockProjects } from '../data/mock-projects'
import type { Pattern, ProjectStatus } from '../types/models'

const statusConfig: Record<
  ProjectStatus,
  { label: string; badgeClassName: string }
> = {
  planned: {
    label: 'Planned',
    badgeClassName: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200',
  },
  'in-progress': {
    label: 'In Progress',
    badgeClassName: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  },
  'need-supplies': {
    label: 'Need Supplies',
    badgeClassName: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  },
  paused: {
    label: 'Paused',
    badgeClassName: 'bg-stone-200 text-stone-700 ring-1 ring-inset ring-stone-300',
  },
  completed: {
    label: 'Completed',
    badgeClassName: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
  },
}

const difficultyStyles: Record<NonNullable<Pattern['difficulty']>, string> = {
  beginner: 'bg-lime-100 text-lime-700 ring-1 ring-inset ring-lime-200',
  intermediate: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  advanced: 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200',
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={['rounded-full px-3 py-1 text-xs font-semibold', statusConfig[status].badgeClassName].join(' ')}>
      {statusConfig[status].label}
    </span>
  )
}

function DifficultyBadge({ difficulty }: { difficulty?: Pattern['difficulty'] }) {
  if (!difficulty) {
    return <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">Unknown</span>
  }

  return (
    <span className={['rounded-full px-3 py-1 text-xs font-semibold', difficultyStyles[difficulty]].join(' ')}>
      {titleCase(difficulty)}
    </span>
  )
}

function NotFoundState() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link to="/projects" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900">
        <ArrowLeft size={16} />
        Back to projects
      </Link>
      <div className="rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
        <h1 className="font-serif text-3xl text-stone-900">Project not found</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          This project does not exist in the current project list.
        </p>
      </div>
    </section>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-stone-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <p className="mt-2 text-sm text-stone-800">{value}</p>
    </div>
  )
}

export default function ProjectDetail() {
  const { projectId } = useParams()
  const project = mockProjects.find((item) => item.id === projectId)

  if (!project) {
    return <NotFoundState />
  }

  const linkedPattern = project.patternId ? mockPatterns.find((pattern) => pattern.id === project.patternId) : undefined

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <Link to="/projects" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900">
        <ArrowLeft size={16} />
        Back to projects
      </Link>

      <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">Stitch Keeper</p>
            <h1 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">{project.name}</h1>
            <p className="max-w-3xl text-base leading-7 text-stone-600">
              {project.notes ?? 'No notes have been added for this project yet.'}
            </p>
          </div>
          <StatusBadge status={project.status} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {project.startDate ? <DetailRow label="Started" value={formatDate(project.startDate)} /> : null}
          {project.endDate ? <DetailRow label="Completed" value={formatDate(project.endDate)} /> : null}
          <DetailRow label="Stash Items Linked" value={String(project.stashItemIds.length)} />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur sm:p-8">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-stone-900">Linked Pattern</h2>
          <p className="text-sm leading-6 text-stone-600">The pattern this project is based on.</p>
        </div>

        {linkedPattern ? (
          <Link
            to={`/patterns/${linkedPattern.id}`}
            className="mt-6 block rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5 transition hover:border-rose-200 hover:bg-rose-50/60"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-stone-900">{linkedPattern.name}</h3>
                <div className="flex flex-wrap gap-2">
                  {linkedPattern.category ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700 ring-1 ring-inset ring-stone-200">
                      {titleCase(linkedPattern.category)}
                    </span>
                  ) : null}
                  <DifficultyBadge difficulty={linkedPattern.difficulty} />
                </div>
                <p className="text-sm leading-6 text-stone-600">
                  {linkedPattern.notes ?? 'No notes have been added for this pattern yet.'}
                </p>
              </div>
              <span className="text-sm font-medium text-rose-600">View pattern</span>
            </div>
          </Link>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-5 text-sm leading-6 text-stone-600">
            No linked pattern could be found for this project.
          </div>
        )}
      </section>
    </section>
  )
}
