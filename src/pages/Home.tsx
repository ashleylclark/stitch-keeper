import { mockPatternDashboardMeta, mockPatterns } from '../data/mock-patterns'
import { mockProjects } from '../data/mock-projects'
import type { PatternDashboardMeta, PatternStatus, ProjectStatus } from '../types/models'

type HomeStat = {
  label: string
  value: number
  helperText: string
}

type StatusTone = 'rose' | 'amber' | 'emerald' | 'sky'

type DashboardItem = {
  id: string
  name: string
  detail: string
  status: string
  tone: StatusTone
}

const badgeClasses: Record<StatusTone, string> = {
  rose: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
  amber: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  emerald: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  sky: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200',
}

const projectStatusConfig: Record<ProjectStatus, { label: string; tone: StatusTone }> = {
  planned: { label: 'Planned', tone: 'sky' },
  'in-progress': { label: 'In Progress', tone: 'rose' },
  completed: { label: 'Completed', tone: 'emerald' },
  paused: { label: 'Paused', tone: 'amber' },
  'need-supplies': { label: 'Need More Supplies', tone: 'amber' },
}

const patternStatusConfig: Record<PatternStatus, { label: string; tone: StatusTone }> = {
  planned: { label: 'Planned', tone: 'sky' },
  'ready-to-start': { label: 'Ready To Start', tone: 'emerald' },
  'review-supplies': { label: 'Review Supplies', tone: 'amber' },
  'need-supplies': { label: 'Need More Supplies', tone: 'amber' },
}

// MOCK DATA
const patternMetaById = new Map(mockPatternDashboardMeta.map((item) => [item.patternId, item]))

const activeProjects = mockProjects
  .filter((project) => project.status !== 'completed' && project.status !== 'paused')
  .map<DashboardItem>((project) => ({
    id: project.id,
    name: project.name,
    detail: project.notes ?? 'No project notes yet.',
    status: projectStatusConfig[project.status].label,
    tone: projectStatusConfig[project.status].tone,
  }))

const readyPatterns = mockPatterns
  .filter((pattern) => patternMetaById.get(pattern.id)?.status === 'ready-to-start')
  .map<DashboardItem>((pattern) => {
    const meta = patternMetaById.get(pattern.id) as PatternDashboardMeta

    return {
      id: pattern.id,
      name: pattern.name,
      detail: meta.detail,
      status: patternStatusConfig[meta.status].label,
      tone: patternStatusConfig[meta.status].tone,
    }
  })

const recentPatterns = [...mockPatterns]
  .filter((pattern) => pattern.addedAt)
  .sort((left, right) => new Date(right.addedAt ?? '').getTime() - new Date(left.addedAt ?? '').getTime())
  .slice(0, 3)
  .map<DashboardItem>((pattern) => {
    const meta = patternMetaById.get(pattern.id)

    return {
      id: pattern.id,
      name: pattern.name,
      detail: pattern.addedAt ? `Added ${formatDate(pattern.addedAt)}` : 'Recently added',
      status: meta ? patternStatusConfig[meta.status].label : 'New',
      tone: meta ? patternStatusConfig[meta.status].tone : 'rose',
    }
  })

const homeStats: HomeStat[] = [
  {
    label: 'Active Projects',
    value: activeProjects.length,
    helperText: 'Projects currently in progress, planned, or waiting on supplies.',
  },
  {
    label: 'Ready Patterns',
    value: readyPatterns.length,
    helperText: 'Patterns you can start now with what you already have.',
  },
  {
    label: 'Recent Patterns',
    value: recentPatterns.length,
    helperText: 'Newly added patterns surfaced on the dashboard.',
  },
  {
    label: 'Finished Makes',
    value: mockProjects.filter((project) => project.status === 'completed').length,
    helperText: 'Projects marked complete in your project history.',
  },
]

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function StatCard({ label, value, helperText }: HomeStat) {
  return (
    <article className="rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className="font-serif text-4xl leading-none text-stone-900">{value}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-stone-600">{helperText}</p>
    </article>
  )
}

function StatusBadge({ status, tone }: Pick<DashboardItem, 'status' | 'tone'>) {
  return (
    <span className={['inline-flex rounded-full px-3 py-1 text-xs font-semibold justify-center', badgeClasses[tone]].join(' ')}>
      {status}
    </span>
  )
}

function DashboardList({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: DashboardItem[]
}) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
      <div className="space-y-2">
        <h2 className="font-serif text-2xl text-stone-900">{title}</h2>
        <p className="text-sm leading-6 text-stone-600">{description}</p>
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-[1.5rem] border border-stone-100 bg-stone-50/80 px-4 py-4 transition hover:border-rose-100 hover:bg-rose-50/50"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-stone-900">{item.name}</h3>
                <p className="text-sm leading-6 text-stone-600">{item.detail}</p>
              </div>
              <StatusBadge status={item.status} tone={item.tone} />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">Stitch Keeper</p>
        <h1 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">Home</h1>
        <p className="max-w-2xl text-base leading-7 text-stone-600">
          A quick snapshot of the parts of your crochet stash you will check most often.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {homeStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardList
          title="Active Projects"
          description="Projects that are underway or lined up next."
          items={activeProjects}
        />
        <DashboardList
          title="Patterns You Can Make Now"
          description="Patterns matched to yarn and tools you already have."
          items={readyPatterns}
        />
      </div>

      <div className="grid gap-5">
        <DashboardList
          title="Recently Added Patterns"
          description="Fresh additions to your library that may be worth queuing up soon."
          items={recentPatterns}
        />
      </div>
    </section>
  )
}
