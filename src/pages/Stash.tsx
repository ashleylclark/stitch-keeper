import { useState } from 'react'
import { Plus } from 'lucide-react'
import { mockStash } from '../data/mock-stash'
import type { ItemCategory, StashItem, StashStatus, YarnWeight } from '../types/models'

type FilterOption<T extends string> = {
  label: string
  value: T
}

type StashCardProps = {
  item: StashItem
}

const categoryOptions: FilterOption<ItemCategory | 'all'>[] = [
  { label: 'All categories', value: 'all' },
  { label: 'Yarn', value: 'yarn' },
  { label: 'Hooks', value: 'hook' },
  { label: 'Needles', value: 'needle' },
  { label: 'Safety eyes', value: 'eyes' },
  { label: 'Stuffing', value: 'stuffing' },
  { label: 'Other notions', value: 'other' },
]

const yarnWeightOptions: FilterOption<YarnWeight | 'all'>[] = [
  { label: 'All weights', value: 'all' },
  { label: 'Lace', value: 'lace' },
  { label: 'Fingering', value: 'fingering' },
  { label: 'Sport', value: 'sport' },
  { label: 'DK', value: 'dk' },
  { label: 'Worsted', value: 'worsted' },
  { label: 'Bulky', value: 'bulky' },
  { label: 'Super bulky', value: 'super-bulky' },
]

const statusStyles: Record<StashStatus, string> = {
  'in-stock': 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  'low-stock': 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  'out-of-stock': 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
  'not-replacing': 'bg-stone-200 text-stone-700 ring-1 ring-inset ring-stone-300',
}

const statusLabels: Record<StashStatus, string> = {
  'in-stock': 'In Stock',
  'low-stock': 'Low Stock',
  'out-of-stock': 'Out of Stock',
  'not-replacing': 'Not Replacing',
}

const categoryLabels: Record<ItemCategory, string> = {
  yarn: 'Yarn',
  hook: 'Hook',
  needle: 'Needle',
  eyes: 'Safety Eyes',
  stuffing: 'Stuffing',
  other: 'Other',
}

function DetailPill({ label }: { label: string }) {
  return <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">{label}</span>
}

function StatusBadge({ status = 'in-stock' }: { status?: StashStatus }) {
  return (
    <span
      className={[
        'inline-flex min-w-[5.75rem] justify-center rounded-full px-3 py-1 text-center text-xs font-semibold',
        status === 'in-stock' ? 'whitespace-nowrap' : 'whitespace-normal',
        statusStyles[status],
      ].join(' ')}
    >
      {statusLabels[status]}
    </span>
  )
}

function StashCard({ item }: StashCardProps) {
  const detailPills = [
    categoryLabels[item.category],
    item.weight ? item.weight.toUpperCase() : null,
    item.material ?? null,
    item.color ?? null,
    item.size ?? null,
    item.brand ?? null,
  ].filter(Boolean) as string[]

  return (
    <article className="rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-stone-900">{item.name}</h2>
            <p className="text-sm text-stone-500">
              {item.quantity} {item.unit ?? 'items'}
            </p>
          </div>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          {detailPills.map((detail) => (
            <DetailPill key={detail} label={detail} />
          ))}
        </div>

        <p className="text-sm leading-6 text-stone-600">
          {item.notes ?? 'No notes yet for this stash item.'}
        </p>
      </div>
    </article>
  )
}

export default function Stash() {
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all')
  const [selectedWeight, setSelectedWeight] = useState<YarnWeight | 'all'>('all')

  const showWeightFilter = selectedCategory === 'yarn'

  const filteredItems = mockStash.filter((item) => {
    const categoryMatches = selectedCategory === 'all' || item.category === selectedCategory
    const weightMatches =
      !showWeightFilter || selectedWeight === 'all' || (item.category === 'yarn' && item.weight === selectedWeight)

    return categoryMatches && weightMatches
  })

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">Stitch Keeper</p>
          <h1 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">Stash</h1>
          <p className="max-w-2xl text-base leading-7 text-stone-600">
            Browse yarn, tools, and notions in one place, with quick filters for the stash you need right now.
          </p>
        </div>

        <button
          type="button"
          aria-label="Add item"
          className="inline-flex self-start items-center justify-center rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 sm:gap-2 sm:px-5"
        >
          <Plus size={18} />
          <span className="hidden whitespace-nowrap md:inline">Add Item</span>
        </button>
      </div>

      <section className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700">Category</span>
            <select
              value={selectedCategory}
              onChange={(event) => {
                const nextCategory = event.target.value as ItemCategory | 'all'
                setSelectedCategory(nextCategory)
                if (nextCategory !== 'yarn') {
                  setSelectedWeight('all')
                }
              }}
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
            <span className="text-sm font-medium text-stone-700">Yarn weight</span>
            <select
              value={selectedWeight}
              onChange={(event) => setSelectedWeight(event.target.value as YarnWeight | 'all')}
              disabled={!showWeightFilter}
              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 focus:border-rose-300"
            >
              {yarnWeightOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-stone-600">
            Showing <span className="font-semibold text-stone-900">{filteredItems.length}</span> items
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {filteredItems.map((item) => (
          <StashCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}
