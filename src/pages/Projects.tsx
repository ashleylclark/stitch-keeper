import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { mockPatterns } from '../data/mock-patterns'
import { mockProjects } from '../data/mock-projects'
import type { Pattern, Project, ProjectStatus } from '../types/models'
import { Link } from 'react-router-dom'

type StatusFilter = ProjectStatus | 'all'

type StatusConfig = {
  label: string
  dateLabel: string | null
  badgeClassName: string
}

type ProjectFormErrors = {
  name?: string
  patternId?: string
  status?: string
}

type ProjectFormValues = {
  name: string
  patternId: string
  status: ProjectStatus
  startDate: string
  endDate: string
  notes: string
}

const statusOrder: ProjectStatus[] = ['planned', 'in-progress', 'need-supplies', 'paused', 'completed']

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Planned', value: 'planned' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Need Supplies', value: 'need-supplies' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
]

const projectStatusOptions: { label: string; value: ProjectStatus }[] = [
  { label: 'Planned', value: 'planned' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Need Supplies', value: 'need-supplies' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
]

const statusConfig: Record<ProjectStatus, StatusConfig> = {
  planned: {
    label: 'Planned',
    dateLabel: null,
    badgeClassName: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200',
  },
  'in-progress': {
    label: 'In Progress',
    dateLabel: 'Started',
    badgeClassName: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  },
  'need-supplies': {
    label: 'Need Supplies',
    dateLabel: 'Started',
    badgeClassName: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  },
  paused: {
    label: 'Paused',
    dateLabel: 'Started',
    badgeClassName: 'bg-stone-200 text-stone-700 ring-1 ring-inset ring-stone-300',
  },
  completed: {
    label: 'Completed',
    dateLabel: 'Completed',
    badgeClassName: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
  },
}

const initialProjectFormValues: ProjectFormValues = {
  name: '',
  patternId: '',
  status: 'planned',
  startDate: '',
  endDate: '',
  notes: '',
}

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <span className="text-sm font-medium text-stone-700">
      {label}
      {required ? <span className="text-rose-500"> *</span> : null}
    </span>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-rose-600">{message}</p>
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={['rounded-full px-3 py-1 text-xs font-semibold', statusConfig[status].badgeClassName].join(' ')}>
      {statusConfig[status].label}
    </span>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function getRelevantDate(project: Project) {
  if (project.status === 'completed') {
    return project.endDate ? { label: statusConfig.completed.dateLabel, value: formatDate(project.endDate) } : null
  }

  if (project.status === 'in-progress' || project.status === 'need-supplies' || project.status === 'paused') {
    return project.startDate
      ? { label: statusConfig[project.status].dateLabel, value: formatDate(project.startDate) }
      : null
  }

  return null
}

function ProjectRow({ project }: { project: Project }) {
  const relevantDate = getRelevantDate(project)

  return (
    <article className="px-5 py-5 sm:px-6">
      <Link
        to={`/projects/${project.id}`}
        className="flex min-w-0 flex-1 flex-col gap-4 rounded-[1.25rem] transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-stone-900">{project.name}</h3>
            {relevantDate ? (
              <p className="text-sm text-stone-600">
                <span className="font-medium text-stone-500">{relevantDate.label}: </span>
                {relevantDate.value}
              </p>
            ) : null}
          </div>

          <div className="sm:pl-6">
            <StatusBadge status={project.status} />
          </div>
        </div>
      </Link>
    </article>
  )
}

function ProjectSection({ status, projects }: { status: ProjectStatus; projects: Project[] }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
      <div className="border-b border-stone-200/70 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl text-stone-900">{statusConfig[status].label}</h2>
            <p className="mt-1 text-sm text-stone-600">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-stone-100">
        {projects.map((project) => (
          <ProjectRow key={project.id} project={project} />
        ))}
      </div>
    </section>
  )
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [patterns] = useState<Pattern[]>(mockPatterns)
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all')
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false)
  const [projectFormValues, setProjectFormValues] = useState<ProjectFormValues>(initialProjectFormValues)
  const [projectFormErrors, setProjectFormErrors] = useState<ProjectFormErrors>({})

  const filteredProjects =
    selectedStatus === 'all'
      ? projects
      : projects.filter((project) => project.status === selectedStatus)

  const groupedProjects = statusOrder
    .map((status) => ({
      status,
      projects: filteredProjects.filter((project) => project.status === status),
    }))
    .filter((group) => group.projects.length > 0)

  function closeProjectModal() {
    setIsAddProjectOpen(false)
    setProjectFormValues(initialProjectFormValues)
    setProjectFormErrors({})
  }

  function updateProjectForm<Key extends keyof ProjectFormValues>(field: Key, value: ProjectFormValues[Key]) {
    setProjectFormValues((current) => ({ ...current, [field]: value }))
    setProjectFormErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validateProjectForm(values: ProjectFormValues) {
    const errors: ProjectFormErrors = {}

    if (!values.name.trim()) {
      errors.name = 'Project name is required.'
    }

    if (!values.patternId) {
      errors.patternId = 'A linked pattern is required.'
    }

    if (!values.status) {
      errors.status = 'Status is required.'
    }

    return errors
  }

  function handleProjectSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateProjectForm(projectFormValues)
    if (Object.keys(errors).length > 0) {
      setProjectFormErrors(errors)
      return
    }

    const nextProject: Project = {
      id: `project-${Date.now()}`,
      name: projectFormValues.name.trim(),
      patternId: projectFormValues.patternId,
      status: projectFormValues.status,
      startDate: projectFormValues.startDate || undefined,
      endDate: projectFormValues.endDate || undefined,
      notes: projectFormValues.notes.trim() || undefined,
      stashItemIds: [],
    }

    setProjects((current) => [nextProject, ...current])
    closeProjectModal()
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">Stitch Keeper</p>
            <h1 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">Projects</h1>
            <p className="max-w-2xl text-base leading-7 text-stone-600">
              View crochet projects by status, from planned ideas to finished makes.
            </p>
          </div>

          <button
            type="button"
            aria-label="Add project"
            onClick={() => setIsAddProjectOpen(true)}
            className="inline-flex w-fit self-start items-center justify-center rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 sm:gap-2 sm:px-5"
          >
            <Plus size={18} />
            <span className="hidden whitespace-nowrap sm:inline">Add Project</span>
          </button>
        </div>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <label className="space-y-2">
              <FieldLabel label="Status" />
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as StatusFilter)}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-stone-600">
              Showing <span className="font-semibold text-stone-900">{filteredProjects.length}</span> projects
            </div>
          </div>
        </section>

        <div className="grid gap-5">
          {groupedProjects.map((group) => (
            <ProjectSection key={group.status} status={group.status} projects={group.projects} />
          ))}
        </div>
      </section>

      {isAddProjectOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4 py-6 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/80 bg-[#fffaf7] shadow-[0_30px_80px_-40px_rgba(41,37,36,0.45)]">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200/70 px-6 py-5 sm:px-8">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">Add Project</p>
                <h2 className="font-serif text-3xl text-stone-900">New Project</h2>
                <p className="max-w-2xl text-sm leading-6 text-stone-600">
                  Add the basic project details and connect it to an existing pattern.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close add project form"
                onClick={closeProjectModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 transition hover:border-rose-200 hover:text-stone-900"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProjectSubmit} className="space-y-5 px-6 py-6 sm:px-8 sm:py-8">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <FieldLabel label="Name" required />
                  <input
                    type="text"
                    value={projectFormValues.name}
                    onChange={(event) => updateProjectForm('name', event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                    placeholder="Project name"
                  />
                  <FieldError message={projectFormErrors.name} />
                </label>

                <label className="space-y-2">
                  <FieldLabel label="Linked pattern" required />
                  <select
                    value={projectFormValues.patternId}
                    onChange={(event) => updateProjectForm('patternId', event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                  >
                    <option value="">Select a pattern</option>
                    {patterns.map((pattern) => (
                      <option key={pattern.id} value={pattern.id}>
                        {pattern.name}
                      </option>
                    ))}
                  </select>
                  <FieldError message={projectFormErrors.patternId} />
                </label>

                <label className="space-y-2">
                  <FieldLabel label="Status" required />
                  <select
                    value={projectFormValues.status}
                    onChange={(event) => updateProjectForm('status', event.target.value as ProjectStatus)}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                  >
                    {projectStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FieldError message={projectFormErrors.status} />
                </label>

                <label className="space-y-2">
                  <FieldLabel label="Start date" />
                  <input
                    type="date"
                    value={projectFormValues.startDate}
                    onChange={(event) => updateProjectForm('startDate', event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <FieldLabel label="End date" />
                  <input
                    type="date"
                    value={projectFormValues.endDate}
                    onChange={(event) => updateProjectForm('endDate', event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <FieldLabel label="Notes" />
                  <textarea
                    value={projectFormValues.notes}
                    onChange={(event) => updateProjectForm('notes', event.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                    placeholder="Optional project notes"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeProjectModal}
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-rose-200 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Add Project
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
