import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
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
  const { patternMatchById, patterns } = useAppData()
  const { patternId } = useParams()
  const pattern = patterns.find((item) => item.id === patternId)

  if (!pattern) {
    return <NotFoundState />
  }

  const patternSummary = patternMatchById.get(pattern.id)
  const requirementMatchesById = new Map(
    patternSummary?.requirementMatches.map((match) => [match.requirementId, match]) ?? [],
  )

  return (
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
              <h1 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">{pattern.name}</h1>
              <p className="max-w-3xl text-base leading-7 text-stone-600">
                {pattern.notes ?? 'No notes have been added for this pattern yet.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {pattern.category ? (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
                  {titleCase(pattern.category)}
                </span>
              ) : null}
              <DifficultyBadge difficulty={pattern.difficulty} />
              <RequirementBadge status={patternSummary?.status} />
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
              {pattern.requirements.map((requirement) => {
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
          <div className="whitespace-pre-wrap text-sm leading-7 text-stone-700">{pattern.instructions}</div>
        </div>
      </section>
    </section>
  )
}
