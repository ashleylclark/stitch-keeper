import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { mockPatternDashboardMeta, mockPatterns } from '../data/mock-patterns'
import type { ItemCategory, Pattern, PatternDashboardMeta, PatternRequirement, PatternStatus, YarnWeight } from '../types/models'
import { Link } from 'react-router-dom'

type DifficultyFilter = NonNullable<Pattern['difficulty']> | 'all'
type CategoryFilter = NonNullable<Pattern['category']> | 'all'
type RequirementFilter = 'all' | 'ready' | 'review' | 'missing'

type PatternFormErrors = {
  name?: string
  instructions?: string
}

type RequirementFormErrors = {
  name?: string
}

type PatternFormValues = {
  name: string
  category: NonNullable<Pattern['category']> | ''
  difficulty: NonNullable<Pattern['difficulty']> | ''
  source: string
  sourceUrl: string
  notes: string
  instructions: string
}

type RequirementFormValues = {
  category: ItemCategory
  name: string
  weight: YarnWeight | ''
  quantityNeeded: string
  unit: string
  size: string
  notes: string
}

const categoryOptions: { label: string; value: CategoryFilter }[] = [
  { label: 'All categories', value: 'all' },
  { label: 'Accessory', value: 'accessory' },
  { label: 'Bag', value: 'bag' },
  { label: 'Blanket', value: 'blanket' },
  { label: 'Garment', value: 'garment' },
  { label: 'Home', value: 'home' },
]

const patternCategoryOptions: { label: string; value: NonNullable<Pattern['category']> | '' }[] = [
  { label: 'Select category', value: '' },
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

const patternDifficultyOptions: { label: string; value: NonNullable<Pattern['difficulty']> | '' }[] = [
  { label: 'Select difficulty', value: '' },
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

const requirementCategoryOptions: { label: string; value: ItemCategory }[] = [
  { label: 'Yarn', value: 'yarn' },
  { label: 'Hook', value: 'hook' },
  { label: 'Needle', value: 'needle' },
  { label: 'Safety Eyes', value: 'eyes' },
  { label: 'Stuffing', value: 'stuffing' },
  { label: 'Other', value: 'other' },
]

const yarnWeightOptions: { label: string; value: YarnWeight | '' }[] = [
  { label: 'Select weight', value: '' },
  { label: 'Lace', value: 'lace' },
  { label: 'Fingering', value: 'fingering' },
  { label: 'Sport', value: 'sport' },
  { label: 'DK', value: 'dk' },
  { label: 'Worsted', value: 'worsted' },
  { label: 'Bulky', value: 'bulky' },
  { label: 'Super bulky', value: 'super-bulky' },
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

const initialPatternFormValues: PatternFormValues = {
  name: '',
  category: '',
  difficulty: '',
  source: '',
  sourceUrl: '',
  notes: '',
  instructions: '',
}

const initialRequirementFormValues: RequirementFormValues = {
  category: 'yarn',
  name: '',
  weight: '',
  quantityNeeded: '',
  unit: '',
  size: '',
  notes: '',
}

function TitleCase({ value }: { value: string }) {
  return value.charAt(0).toUpperCase() + value.slice(1)
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
  const [patterns, setPatterns] = useState<Pattern[]>(mockPatterns)
  const [patternMeta, setPatternMeta] = useState<PatternDashboardMeta[]>(mockPatternDashboardMeta)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all')
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementFilter>('all')
  const [isAddPatternOpen, setIsAddPatternOpen] = useState(false)
  const [patternFormValues, setPatternFormValues] = useState<PatternFormValues>(initialPatternFormValues)
  const [requirementFormValues, setRequirementFormValues] = useState<RequirementFormValues>(initialRequirementFormValues)
  const [pendingRequirements, setPendingRequirements] = useState<PatternRequirement[]>([])
  const [patternFormErrors, setPatternFormErrors] = useState<PatternFormErrors>({})
  const [requirementErrors, setRequirementErrors] = useState<RequirementFormErrors>({})

  const patternMetaById = new Map(patternMeta.map((item) => [item.patternId, item]))

  const filteredPatterns = patterns.filter((pattern) => {
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

  function closePatternModal() {
    setIsAddPatternOpen(false)
    setPatternFormValues(initialPatternFormValues)
    setRequirementFormValues(initialRequirementFormValues)
    setPendingRequirements([])
    setPatternFormErrors({})
    setRequirementErrors({})
  }

  function updatePatternForm<Key extends keyof PatternFormValues>(field: Key, value: PatternFormValues[Key]) {
    setPatternFormValues((current) => ({ ...current, [field]: value }))
    setPatternFormErrors((current) => ({ ...current, [field]: undefined }))
  }

  function updateRequirementForm<Key extends keyof RequirementFormValues>(field: Key, value: RequirementFormValues[Key]) {
    setRequirementFormValues((current) => ({ ...current, [field]: value }))
    setRequirementErrors((current) => ({ ...current, [field]: undefined }))
  }

  function addRequirement() {
    if (!requirementFormValues.name.trim()) {
      setRequirementErrors({ name: 'Requirement name is required.' })
      return
    }

    const nextRequirement: PatternRequirement = {
      id: `requirement-${Date.now()}`,
      category: requirementFormValues.category,
      name: requirementFormValues.name.trim(),
      weight: requirementFormValues.weight || undefined,
      quantityNeeded: requirementFormValues.quantityNeeded ? Number(requirementFormValues.quantityNeeded) : undefined,
      unit: requirementFormValues.unit.trim() || undefined,
      size: requirementFormValues.size.trim() || undefined,
      notes: requirementFormValues.notes.trim() || undefined,
    }

    setPendingRequirements((current) => [...current, nextRequirement])
    setRequirementFormValues(initialRequirementFormValues)
    setRequirementErrors({})
  }

  function removeRequirement(requirementId: string) {
    setPendingRequirements((current) => current.filter((requirement) => requirement.id !== requirementId))
  }

  function validatePatternForm(values: PatternFormValues) {
    const errors: PatternFormErrors = {}

    if (!values.name.trim()) {
      errors.name = 'Pattern name is required.'
    }

    if (!values.instructions.trim()) {
      errors.instructions = 'Instructions are required.'
    }

    return errors
  }

  function handlePatternSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validatePatternForm(patternFormValues)
    if (Object.keys(errors).length > 0) {
      setPatternFormErrors(errors)
      return
    }

    const nextPatternId = `pattern-${Date.now()}`

    const nextPattern: Pattern = {
      id: nextPatternId,
      name: patternFormValues.name.trim(),
      addedAt: new Date().toISOString().slice(0, 10),
      category: patternFormValues.category || undefined,
      difficulty: patternFormValues.difficulty || undefined,
      source: patternFormValues.source.trim() || undefined,
      sourceUrl: patternFormValues.sourceUrl.trim() || undefined,
      notes: patternFormValues.notes.trim() || undefined,
      instructions: patternFormValues.instructions,
      requirements: pendingRequirements,
    }

    const nextMeta: PatternDashboardMeta = {
      patternId: nextPatternId,
      status: 'planned',
      detail: 'Recently added to your pattern library.',
    }

    setPatterns((current) => [nextPattern, ...current])
    setPatternMeta((current) => [nextMeta, ...current])
    closePatternModal()
  }

  return (
    <>
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
            onClick={() => setIsAddPatternOpen(true)}
            className="inline-flex w-fit self-start items-center justify-center rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 sm:gap-2 sm:px-5"
          >
            <Plus size={18} />
            <span className="hidden whitespace-nowrap sm:inline">Add Pattern</span>
          </button>
        </div>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
            <label className="space-y-2">
              <FieldLabel label="Category" />
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
              <FieldLabel label="Difficulty" />
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
              <FieldLabel label="Stash Match" />
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
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-stone-200/70 px-5 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 sm:px-6">
                <th className="px-5 py-4 text-left">Pattern</th>
                <th className="px-5 py-4 text-left">Category</th>
                <th className="px-5 py-4 text-left">Difficulty</th>
                <th className="px-5 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPatterns.map((pattern) => {
                const meta = patternMetaById.get(pattern.id)

                return (
                  <tr key={pattern.id} className="transition hover:bg-stone-50">
                    <td className="px-5 py-5 sm:px-6">
                      <Link to={`/patterns/${pattern.id}`} className="font-semibold text-stone-900 hover:underline">
                        {pattern.name}
                      </Link>
                      <p className="text-sm leading-6 text-stone-600">{pattern.notes ?? 'No notes yet for this pattern.'}</p>
                    </td>
                    <td className="px-5 py-5 text-sm text-stone-700 sm:px-6">
                      {pattern.category ? <TitleCase value={pattern.category} /> : 'Uncategorized'}
                    </td>
                    <td className="px-5 py-5 sm:px-6">
                      <DifficultyBadge difficulty={pattern.difficulty} />
                    </td>
                    <td className="px-5 py-5 sm:px-6">
                      <RequirementBadge status={meta?.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </section>

      {isAddPatternOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4 py-6 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/80 bg-[#fffaf7] shadow-[0_30px_80px_-40px_rgba(41,37,36,0.45)]">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200/70 px-6 py-5 sm:px-8">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">Add Pattern</p>
                <h2 className="font-serif text-3xl text-stone-900">New Pattern</h2>
                <p className="max-w-2xl text-sm leading-6 text-stone-600">
                  Add the main pattern details, build the requirements list, and enter the full instructions below.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close add pattern form"
                onClick={closePatternModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 transition hover:border-rose-200 hover:text-stone-900"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePatternSubmit} className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
              <section className="space-y-5">
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl text-stone-900">Pattern Details</h3>
                  <p className="text-sm text-stone-600">Add the core information shown in your library and detail page.</p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="space-y-2">
                    <FieldLabel label="Name" required />
                    <input
                      type="text"
                      value={patternFormValues.name}
                      onChange={(event) => updatePatternForm('name', event.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      placeholder="Pattern name"
                    />
                    <FieldError message={patternFormErrors.name} />
                  </label>

                  <label className="space-y-2">
                    <FieldLabel label="Category" />
                    <select
                      value={patternFormValues.category}
                      onChange={(event) => updatePatternForm('category', event.target.value as PatternFormValues['category'])}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                    >
                      {patternCategoryOptions.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <FieldLabel label="Difficulty" />
                    <select
                      value={patternFormValues.difficulty}
                      onChange={(event) => updatePatternForm('difficulty', event.target.value as PatternFormValues['difficulty'])}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                    >
                      {patternDifficultyOptions.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2">
                    <FieldLabel label="Source" />
                    <input
                      type="text"
                      value={patternFormValues.source}
                      onChange={(event) => updatePatternForm('source', event.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      placeholder="Designer, book, website"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel label="Source URL" />
                    <input
                      type="url"
                      value={patternFormValues.sourceUrl}
                      onChange={(event) => updatePatternForm('sourceUrl', event.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      placeholder="https://"
                    />
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel label="Notes" />
                    <textarea
                      value={patternFormValues.notes}
                      onChange={(event) => updatePatternForm('notes', event.target.value)}
                      rows={3}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      placeholder="Optional notes about the pattern"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-5">
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl text-stone-900">Requirements</h3>
                  <p className="text-sm text-stone-600">Add requirements one at a time, then review them below.</p>
                </div>

                <div className="rounded-[1.75rem] border border-stone-200/70 bg-stone-50/80 p-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <label className="space-y-2">
                      <FieldLabel label="Category" />
                      <select
                        value={requirementFormValues.category}
                        onChange={(event) => updateRequirementForm('category', event.target.value as ItemCategory)}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      >
                        {requirementCategoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <FieldLabel label="Requirement name" required />
                      <input
                        type="text"
                        value={requirementFormValues.name}
                        onChange={(event) => updateRequirementForm('name', event.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                        placeholder="Cotton yarn, 5 mm hook"
                      />
                      <FieldError message={requirementErrors.name} />
                    </label>

                    <label className="space-y-2">
                      <FieldLabel label="Weight" />
                      <select
                        value={requirementFormValues.weight}
                        onChange={(event) => updateRequirementForm('weight', event.target.value as YarnWeight | '')}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      >
                        {yarnWeightOptions.map((option) => (
                          <option key={option.value || 'empty'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <FieldLabel label="Quantity needed" />
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={requirementFormValues.quantityNeeded}
                        onChange={(event) => updateRequirementForm('quantityNeeded', event.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                        placeholder="0"
                      />
                    </label>

                    <label className="space-y-2">
                      <FieldLabel label="Unit" />
                      <input
                        type="text"
                        value={requirementFormValues.unit}
                        onChange={(event) => updateRequirementForm('unit', event.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                        placeholder="skeins, pairs"
                      />
                    </label>

                    <label className="space-y-2">
                      <FieldLabel label="Size" />
                      <input
                        type="text"
                        value={requirementFormValues.size}
                        onChange={(event) => updateRequirementForm('size', event.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                        placeholder="5 mm, 12 mm"
                      />
                    </label>

                    <label className="space-y-2 md:col-span-2 xl:col-span-3">
                      <FieldLabel label="Notes" />
                      <input
                        type="text"
                        value={requirementFormValues.notes}
                        onChange={(event) => updateRequirementForm('notes', event.target.value)}
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                        placeholder="Optional extra details"
                      />
                    </label>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={addRequirement}
                      className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                    >
                      Add Requirement
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {pendingRequirements.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-5 text-sm leading-6 text-stone-600">
                      No requirements added yet.
                    </div>
                  ) : (
                    pendingRequirements.map((requirement) => (
                      <div
                        key={requirement.id}
                        className="flex flex-col gap-3 rounded-[1.5rem] border border-stone-200 bg-white px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="space-y-1">
                          <p className="font-medium text-stone-900">{requirement.name}</p>
                          <p className="text-sm leading-6 text-stone-600">
                            {[
                              requirement.category.charAt(0).toUpperCase() + requirement.category.slice(1),
                              requirement.weight ? requirement.weight.toUpperCase() : null,
                              requirement.quantityNeeded ? `${requirement.quantityNeeded} ${requirement.unit ?? 'items'}` : null,
                              requirement.size ?? null,
                              requirement.notes ?? null,
                            ]
                              .filter(Boolean)
                              .join(' • ')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRequirement(requirement.id)}
                          className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-rose-200 hover:text-stone-900"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="space-y-5">
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl text-stone-900">Instructions</h3>
                  <p className="text-sm text-stone-600">Enter the pattern exactly as you want to keep it, including line breaks and lists.</p>
                </div>

                <label className="space-y-2">
                  <FieldLabel label="Instructions" required />
                  <textarea
                    value={patternFormValues.instructions}
                    onChange={(event) => updatePatternForm('instructions', event.target.value)}
                    rows={12}
                    className="w-full rounded-[1.5rem] border border-stone-200 bg-white px-4 py-4 text-sm leading-7 text-stone-700 outline-none transition focus:border-rose-300"
                    placeholder={'Round 1: ...\n\nRound 2: ...'}
                  />
                  <FieldError message={patternFormErrors.instructions} />
                </label>
              </section>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePatternModal}
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-rose-200 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Add Pattern
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
