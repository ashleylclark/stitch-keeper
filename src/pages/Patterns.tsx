import { useState } from 'react'
import { Plus } from 'lucide-react'
import { mockPatternDashboardMeta, mockPatterns } from '../data/mock-patterns'
import type { Pattern, PatternStatus } from '../types/models'
import { Link } from 'react-router-dom'

type DifficultyFilter = NonNullable<Pattern['difficulty']> | 'all'
type CategoryFilter = NonNullable<Pattern['category']> | 'all'
type RequirementFilter = 'all' | 'ready' | 'review' | 'missing'

const patternMetaById = new Map(mockPatternDashboardMeta.map((item) => [item.patternId, item]))

const categoryOptions: { label: string; value: CategoryFilter }[] = [
  { label: 'All categories', value: 'all' },
  { label: 'Accessory', value: 'accessory' },
  { label: 'Bag', value: 'bag' },
  { label: 'Blanket', value: 'blanket' },
  { label: 'Garment', value: 'garment' },
  { label: 'Home', value: 'home' },
]

const difficultyOptions: { label: string; value: DifficultyFilter }[] = [
  { label: 'All difficulties', value: 'all' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
]

const requirementOptions: { label: string; value: RequirementFilter }[] = [
  { label: 'All stash matches', value: 'all' },
  { label: 'Meets all requirements', value: 'ready' },
  { label: 'Needs review', value: 'review' },
  { label: 'Missing supplies', value: 'missing' },
]

const difficultyStyles: Record<NonNullable<Pattern['difficulty']>, string> = {
  beginner: 'bg-lime-100 text-lime-700 ring-1 ring-inset ring-lime-200',
  intermediate: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  advanced: 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200',
}

const requirementStyles: Record<PatternStatus, string> = {
  planned: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200',
  'ready-to-start': 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  'review-supplies': 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  'need-supplies': 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
}

const requirementLabels: Record<PatternStatus, string> = {
  planned: 'Planned',
  'ready-to-start': 'Meets Requirements',
  'review-supplies': 'Needs Review',
  'need-supplies': 'Missing Supplies',
}

function TitleCase({ value }: { value: string }) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function DifficultyBadge({ difficulty }: { difficulty?: Pattern['difficulty'] }) {
  if (!difficulty) {
    return <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">Unknown</span>
  }

  return (
    <span className={['rounded-full px-3 py-1 text-xs font-semibold', difficultyStyles[difficulty]].join(' ')}>
      <TitleCase value={difficulty} />
    </span>
  )
}

function RequirementBadge({ status }: { status?: PatternStatus }) {
  if (!status) {
    return <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">Unscored</span>
  }

  return (
    <span className={['rounded-full px-3 py-1 text-xs font-semibold', requirementStyles[status]].join(' ')}>
      {requirementLabels[status]}
    </span>
  )
}

export default function Patterns() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all')
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementFilter>('all')

  const filteredPatterns = mockPatterns.filter((pattern) => {
    const meta = patternMetaById.get(pattern.id)

    const categoryMatches = selectedCategory === 'all' || pattern.category === selectedCategory
    const difficultyMatches = selectedDifficulty === 'all' || pattern.difficulty === selectedDifficulty
    const requirementMatches =
      selectedRequirement === 'all' ||
      (selectedRequirement === 'ready' && meta?.status === 'ready-to-start') ||
      (selectedRequirement === 'review' && meta?.status === 'review-supplies') ||
      (selectedRequirement === 'missing' && meta?.status === 'need-supplies')

    return categoryMatches && difficultyMatches && requirementMatches
  })

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">Stitch Keeper</p>
          <h1 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">Patterns</h1>
          <p className="max-w-2xl text-base leading-7 text-stone-600">
            Browse your pattern library and narrow it down by category, difficulty, and stash readiness.
          </p>
        </div>

        <button
          type="button"
          aria-label="Add pattern"
          className="inline-flex w-fit self-start items-center justify-center rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 sm:gap-2 sm:px-5"
        >
          <Plus size={18} />
          <span className="hidden whitespace-nowrap sm:inline">Add Pattern</span>
        </button>
      </div>

      <section className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value as CategoryFilter)}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Difficulty</span>
            <select
              value={selectedDifficulty}
              onChange={(event) => setSelectedDifficulty(event.target.value as DifficultyFilter)}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
            >
              {difficultyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Stash Match</span>
            <select
              value={selectedRequirement}
              onChange={(event) => setSelectedRequirement(event.target.value as RequirementFilter)}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
            >
              {requirementOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-stone-600">
            Showing <span className="font-semibold text-stone-900">{filteredPatterns.length}</span> patterns
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
        <table className='w-full table-auto'>
          <thead>
            <tr className='border-b border-stone-200/70 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 sm:px-6'>
              <th className='text-left px-5 py-4'>Pattern</th>
              <th className='text-left px-5 py-4'>Category</th>
              <th className='text-left px-5 py-4'>Difficulty</th>
              <th className='text-left px-5 py-4'>Status</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-stone-100'>
            {filteredPatterns.map((pattern) => {
              const meta = patternMetaById.get(pattern.id)

              return (
                <tr key={pattern.id} className='hover:bg-stone-50 transition'>
                  <td className='px-5 py-5 sm:px-6 '>
                    <Link to={`/patterns/${pattern.id}`} className='font-semibold text-stone-900 hover:underline'>
                      {pattern.name}
                    </Link>
                    <p className="text-sm leading-6 text-stone-600">
                      {pattern.notes ?? 'No notes yet for this pattern.'}
                    </p>
                  </td>
                  <td className='px-5 py-5 sm:px-6 text-sm text-stone-700'>
                    {pattern.category ? <TitleCase value={pattern.category} /> : 'Uncategorized'}
                  </td>
                  <td className='px-5 py-5 sm:px-6'>
                    <DifficultyBadge difficulty={pattern.difficulty} />
                  </td>
                  <td className='px-5 py-5 sm:px-6'>
                    <RequirementBadge status={meta?.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {/* <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-stone-200/70 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 sm:px-6">
          <span>Pattern</span>
          <span>Category</span>
          <span>Difficulty</span>
        </div> */}

        {/* <div className="divide-y divide-stone-100">
          {filteredPatterns.map((pattern) => {
            const meta = patternMetaById.get(pattern.id)

            return (
              <article key={pattern.id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="grid flex-1 gap-4 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="space-y-1">
                      <h2 className="text-base font-semibold text-stone-900">{pattern.name}</h2>
                      <p className="text-sm leading-6 text-stone-600">
                        {pattern.notes ?? 'No notes yet for this pattern.'}
                      </p>
                    </div>

                    <div className="text-sm text-stone-700">
                      <span className="font-medium text-stone-500 sm:hidden">Category: </span>
                      {pattern.category ? <TitleCase value={pattern.category} /> : 'Uncategorized'}
                    </div>

                    <div>
                      <DifficultyBadge difficulty={pattern.difficulty} />
                    </div>
                  </div>

                  <div className="lg:pl-6">
                    <RequirementBadge status={meta?.status} />
                  </div>
                </div>
              </article>
            )
          })}
        </div> */}
      </section>
    </section>
  )
}
