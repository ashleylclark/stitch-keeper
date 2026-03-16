import { useState } from 'react'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Modal } from '../components/Modal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PatternForm, type PatternFormValues } from '../components/forms/PatternForm'
import { useAppData } from '../context/app-data'
import type { Pattern, PatternMatchStatus, RequirementMatch } from '../types/models'
import {
  patternMatchBadgeClasses,
  patternMatchLabels,
  requirementMatchBadgeClasses,
  requirementMatchLabels,
} from '../utils/patternMatching'

const difficultyStyles: Record<NonNullable<Pattern['difficulty']>, string> = {
  beginner: 'bg-lime-100 text-lime-700 ring-1 ring-inset ring-lime-200',
  intermediate: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  advanced: 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200',
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
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

function RequirementBadge({ status }: { status?: PatternMatchStatus }) {
  if (!status) {
    return <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">Unscored</span>
  }

  return (
    <span className={['rounded-full px-3 py-1 text-xs font-semibold', patternMatchBadgeClasses[status]].join(' ')}>
      {patternMatchLabels[status]}
    </span>
  )
}

function RequirementMatchBadge({ match }: { match?: RequirementMatch }) {
  if (!match) {
    return <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">Unmatched</span>
  }

  return (
    <span className={['rounded-full px-3 py-1 text-xs font-semibold', requirementMatchBadgeClasses[match.status]].join(' ')}>
      {requirementMatchLabels[match.status]}
    </span>
  )
}

function ActionButton({
  label,
  tone = 'default',
  onClick,
  children,
}: {
  label: string
  tone?: 'default' | 'danger'
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        'inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-white transition',
        tone === 'danger'
          ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
          : 'border-stone-200 text-stone-600 hover:border-rose-200 hover:text-stone-900',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function NotFoundState() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link to="/patterns" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900">
        <ArrowLeft size={16} />
        Back to patterns
      </Link>
      <div className="rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
        <h1 className="font-serif text-3xl text-stone-900">Pattern not found</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          This pattern does not exist in the current library.
        </p>
      </div>
    </section>
  )
}

export default function PatternDetail() {
  const navigate = useNavigate()
  const { patternMatchById, patterns, updatePattern, deletePattern } = useAppData()
  const { patternId } = useParams()
  const pattern = patterns.find((item) => item.id === patternId)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  if (!pattern) {
    return <NotFoundState />
  }

  const currentPattern = pattern
  const patternSummary = patternMatchById.get(currentPattern.id)
  const requirementMatchesById = new Map(
    patternSummary?.requirementMatches.map((match) => [match.requirementId, match]) ?? [],
  )

  async function handleSubmit(values: PatternFormValues) {
    const nextPattern: Pattern = {
      ...currentPattern,
      name: values.name.trim(),
      source: values.source.trim() || undefined,
      sourceUrl: values.sourceUrl.trim() || undefined,
      category: values.category || undefined,
      difficulty: values.difficulty || undefined,
      notes: values.notes.trim() || undefined,
      instructions: values.instructions,
      requirements: values.requirements,
    }

    await updatePattern(nextPattern)
    setIsEditOpen(false)
  }

  async function handleDelete() {
    await deletePattern(currentPattern.id)
    navigate('/patterns')
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Link to="/patterns" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900">
          <ArrowLeft size={16} />
          Back to patterns
        </Link>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur sm:p-8">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">Stitch Keeper</p>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <h1 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">{currentPattern.name}</h1>
                <p className="max-w-3xl text-base leading-7 text-stone-600">
                  {currentPattern.notes ?? 'No notes have been added for this pattern yet.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {currentPattern.category ? (
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                    {titleCase(currentPattern.category)}
                  </span>
                ) : null}
                <DifficultyBadge difficulty={currentPattern.difficulty} />
                <RequirementBadge status={patternSummary?.status} />
                <ActionButton label={`Edit ${currentPattern.name}`} onClick={() => setIsEditOpen(true)}>
                  <Pencil size={16} />
                </ActionButton>
                <ActionButton label={`Delete ${currentPattern.name}`} tone="danger" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 size={16} />
                </ActionButton>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur sm:p-8">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-stone-900">Requirements</h2>
            <p className="text-sm leading-6 text-stone-600">Everything listed for this pattern at a glance.</p>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-200/70">
            <table className="w-full table-auto">
              <thead className="bg-stone-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  <th className="px-4 py-4">Item</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Details</th>
                  <th className="px-4 py-4">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {currentPattern.requirements.map((requirement) => {
                  const match = requirementMatchesById.get(requirement.id)

                  return (
                    <tr key={requirement.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-stone-900">{requirement.name}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-stone-700">{titleCase(requirement.category)}</td>
                      <td className="px-4 py-4 text-sm leading-6 text-stone-600">
                        {[
                          requirement.weight ? titleCase(requirement.weight) : null,
                          requirement.quantityNeeded ? `${requirement.quantityNeeded} ${requirement.unit ?? 'items'}` : null,
                          requirement.size ?? null,
                          requirement.notes ?? null,
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'No extra details'}
                      </td>
                      <td className="px-4 py-4 text-sm leading-6 text-stone-600">
                        <div className="space-y-2">
                          <RequirementMatchBadge match={match} />
                          <p>{match?.reason ?? 'No match details yet.'}</p>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur sm:p-8">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-stone-900">Instructions</h2>
            <p className="text-sm leading-6 text-stone-600">Stored exactly as entered so line breaks and spacing are preserved.</p>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-rose-100 bg-rose-50/60 p-5">
            <div className="whitespace-pre-wrap text-sm leading-7 text-stone-700">{currentPattern.instructions}</div>
          </div>
        </section>
      </section>

      <Modal title="Edit Pattern" isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} maxWidthClassName="max-w-5xl">
        <PatternForm
          initialValues={{
            name: currentPattern.name,
            source: currentPattern.source ?? '',
            sourceUrl: currentPattern.sourceUrl ?? '',
            category: currentPattern.category ?? '',
            difficulty: currentPattern.difficulty ?? '',
            notes: currentPattern.notes ?? '',
            instructions: currentPattern.instructions,
            requirements: currentPattern.requirements,
          }}
          submitLabel="Save Changes"
          onSubmit={(values) => { void handleSubmit(values) }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Pattern"
        description={`Delete "${currentPattern.name}" and all of its requirements? This cannot be undone.`}
        confirmLabel="Delete Pattern"
        onConfirm={() => { void handleDelete() }}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  )
}
