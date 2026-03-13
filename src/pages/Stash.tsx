import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { mockStash } from '../data/mock-stash'
import type { ItemCategory, StashItem, StashStatus, YarnWeight } from '../types/models'

type FilterOption<T extends string> = {
  label: string
  value: T
}

type StashCardProps = {
  item: StashItem
}

type FormErrors = {
  name?: string
  quantity?: string
}

type StashFormValues = {
  category: ItemCategory
  name: string
  brand: string
  color: string
  weight: YarnWeight | ''
  quantity: string
  unit: string
  size: string
  material: string
  notes: string
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

const formCategoryOptions: FilterOption<ItemCategory>[] = [
  { label: 'Yarn', value: 'yarn' },
  { label: 'Hook', value: 'hook' },
  { label: 'Needle', value: 'needle' },
  { label: 'Safety Eyes', value: 'eyes' },
  { label: 'Stuffing', value: 'stuffing' },
  { label: 'Other', value: 'other' },
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

const formYarnWeightOptions: FilterOption<YarnWeight | ''>[] = [
  { label: 'Select weight', value: '' },
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

const defaultUnits: Record<ItemCategory, string> = {
  yarn: 'skeins',
  hook: 'hooks',
  needle: 'needles',
  eyes: 'pairs',
  stuffing: 'bags',
  other: 'items',
}

const initialFormValues: StashFormValues = {
  category: 'yarn',
  name: '',
  brand: '',
  color: '',
  weight: '',
  quantity: '',
  unit: defaultUnits.yarn,
  size: '',
  material: '',
  notes: '',
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

        <p className="text-sm leading-6 text-stone-600">{item.notes ?? 'No notes yet for this stash item.'}</p>
      </div>
    </article>
  )
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

export default function Stash() {
  const [stashItems, setStashItems] = useState<StashItem[]>(mockStash)
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all')
  const [selectedWeight, setSelectedWeight] = useState<YarnWeight | 'all'>('all')
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [formValues, setFormValues] = useState<StashFormValues>(initialFormValues)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const showWeightFilter = selectedCategory === 'yarn'
  const showYarnFields = formValues.category === 'yarn' || formValues.category === 'other'
  const showSizeField = ['hook', 'needle', 'eyes', 'other'].includes(formValues.category)
  const showMaterialField = ['hook', 'needle', 'eyes', 'stuffing', 'other'].includes(formValues.category)
  const showBrandField = ['yarn', 'hook', 'needle', 'eyes', 'other'].includes(formValues.category)
  const showColorField = ['yarn', 'other'].includes(formValues.category)
  const showUnitField = ['yarn', 'stuffing', 'other'].includes(formValues.category)
  const showNotesField = ['yarn', 'stuffing', 'other'].includes(formValues.category)

  const filteredItems = stashItems.filter((item) => {
    const categoryMatches = selectedCategory === 'all' || item.category === selectedCategory
    const weightMatches =
      !showWeightFilter || selectedWeight === 'all' || (item.category === 'yarn' && item.weight === selectedWeight)

    return categoryMatches && weightMatches
  })

  function resetForm() {
    setFormValues(initialFormValues)
    setFormErrors({})
  }

  function closeModal() {
    setIsAddItemOpen(false)
    resetForm()
  }

  function updateFormValue<Key extends keyof StashFormValues>(field: Key, value: StashFormValues[Key]) {
    setFormValues((current) => {
      const nextValues = { ...current, [field]: value }

      if (field === 'category') {
        nextValues.unit = defaultUnits[value as ItemCategory]
        if (value !== 'yarn' && value !== 'other') {
          nextValues.weight = ''
        }
        if (!['yarn', 'other'].includes(value as ItemCategory)) {
          nextValues.color = ''
        }
        if (!['yarn', 'hook', 'needle', 'eyes', 'other'].includes(value as ItemCategory)) {
          nextValues.brand = ''
        }
        if (!['hook', 'needle', 'eyes', 'other'].includes(value as ItemCategory)) {
          nextValues.size = ''
        }
        if (!['hook', 'needle', 'eyes', 'stuffing', 'other'].includes(value as ItemCategory)) {
          nextValues.material = ''
        }
        if (!['yarn', 'stuffing', 'other'].includes(value as ItemCategory)) {
          nextValues.notes = ''
        }
      }

      return nextValues
    })

    setFormErrors((current) => ({ ...current, [field]: undefined }))
  }

  function validateForm(values: StashFormValues) {
    const errors: FormErrors = {}

    if (!values.name.trim()) {
      errors.name = 'Name is required.'
    }

    if (!values.quantity.trim()) {
      errors.quantity = 'Quantity is required.'
    } else if (Number.isNaN(Number(values.quantity)) || Number(values.quantity) < 0) {
      errors.quantity = 'Quantity must be a valid number.'
    }

    return errors
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateForm(formValues)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const nextItem: StashItem = {
      id: `stash-${Date.now()}`,
      category: formValues.category,
      name: formValues.name.trim(),
      quantity: Number(formValues.quantity),
      status: 'in-stock',
      brand: formValues.brand.trim() || undefined,
      color: formValues.color.trim() || undefined,
      weight: formValues.weight || undefined,
      unit: formValues.unit.trim() || undefined,
      size: formValues.size.trim() || undefined,
      material: formValues.material.trim() || undefined,
      notes: formValues.notes.trim() || undefined,
    }

    setStashItems((current) => [nextItem, ...current])
    closeModal()
  }

  return (
    <>
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
            onClick={() => setIsAddItemOpen(true)}
            className="inline-flex self-start items-center justify-center rounded-2xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 sm:gap-2 sm:px-5"
          >
            <Plus size={18} />
            <span className="hidden whitespace-nowrap md:inline">Add Item</span>
          </button>
        </div>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
            <label className="space-y-2">
              <FieldLabel label="Category" />
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
              <FieldLabel label="Yarn weight" />
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

      {isAddItemOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 px-4 py-6 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/80 bg-[#fffaf7] shadow-[0_30px_80px_-40px_rgba(41,37,36,0.45)]">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200/70 px-6 py-5 sm:px-8">
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">Add To Stash</p>
                <h2 className="font-serif text-3xl text-stone-900">New Stash Item</h2>
                <p className="max-w-2xl text-sm leading-6 text-stone-600">
                  Fill in the fields that apply to this item. Name and quantity are required.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close add item form"
                onClick={closeModal}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 transition hover:border-rose-200 hover:text-stone-900"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 sm:px-8 sm:py-8">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <FieldLabel label="Category" />
                  <select
                    value={formValues.category}
                    onChange={(event) => updateFormValue('category', event.target.value as ItemCategory)}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                  >
                    {formCategoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <FieldLabel label="Name" required />
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(event) => updateFormValue('name', event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                    placeholder="Item name"
                  />
                  <FieldError message={formErrors.name} />
                </label>

                <label className="space-y-2">
                  <FieldLabel label="Quantity" required />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formValues.quantity}
                    onChange={(event) => updateFormValue('quantity', event.target.value)}
                    className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                    placeholder="0"
                  />
                  <FieldError message={formErrors.quantity} />
                </label>

                {showBrandField ? (
                  <label className="space-y-2">
                    <FieldLabel label="Brand" />
                    <input
                      type="text"
                      value={formValues.brand}
                      onChange={(event) => updateFormValue('brand', event.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      placeholder="Brand name"
                    />
                  </label>
                ) : null}

                {showColorField ? (
                  <label className="space-y-2">
                    <FieldLabel label="Color" />
                    <input
                      type="text"
                      value={formValues.color}
                      onChange={(event) => updateFormValue('color', event.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      placeholder="Color name"
                    />
                  </label>
                ) : null}

                {showYarnFields ? (
                  <label className="space-y-2">
                    <FieldLabel label="Yarn weight" />
                    <select
                      value={formValues.weight}
                      onChange={(event) => updateFormValue('weight', event.target.value as YarnWeight | '')}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                    >
                      {formYarnWeightOptions.map((option) => (
                        <option key={option.value || 'empty'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {showUnitField ? (
                  <label className="space-y-2">
                    <FieldLabel label="Unit" />
                    <input
                      type="text"
                      value={formValues.unit}
                      onChange={(event) => updateFormValue('unit', event.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      placeholder="skeins, bag, items"
                    />
                  </label>
                ) : null}

                {showSizeField ? (
                  <label className="space-y-2">
                    <FieldLabel label="Size" />
                    <input
                      type="text"
                      value={formValues.size}
                      onChange={(event) => updateFormValue('size', event.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      placeholder="8 mm, 12 mm"
                    />
                  </label>
                ) : null}

                {showMaterialField ? (
                  <label className="space-y-2">
                    <FieldLabel label="Material" />
                    <input
                      type="text"
                      value={formValues.material}
                      onChange={(event) => updateFormValue('material', event.target.value)}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      placeholder="Aluminum, cotton, plastic"
                    />
                  </label>
                ) : null}

                {showNotesField ? (
                  <label className="space-y-2 md:col-span-2">
                    <FieldLabel label="Notes" />
                    <textarea
                      value={formValues.notes}
                      onChange={(event) => updateFormValue('notes', event.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-rose-300"
                      placeholder="Any extra details to remember"
                    />
                  </label>
                ) : null}
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-2xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:border-rose-200 hover:text-stone-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
