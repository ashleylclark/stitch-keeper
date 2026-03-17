import { useState } from "react";
import { Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PatternForm, type PatternFormValues } from "../components/forms/PatternForm";
import { useAppData } from "../context/app-data";
import type { Pattern, PatternMatchStatus } from "../types/models";

type DifficultyFilter = NonNullable<Pattern["difficulty"]> | "all";
type CategoryFilter = NonNullable<Pattern["category"]> | "all";
type RequirementFilter = "all" | "ready" | "review" | "missing";

const categoryOptions: { label: string; value: CategoryFilter }[] = [
  { label: "All categories", value: "all" },
  { label: "Accessory", value: "accessory" },
  { label: "Bag", value: "bag" },
  { label: "Blanket", value: "blanket" },
  { label: "Garment", value: "garment" },
  { label: "Home", value: "home" },
];

const difficultyOptions: { label: string; value: DifficultyFilter }[] = [
  { label: "All difficulties", value: "all" },
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

const requirementOptions: { label: string; value: RequirementFilter }[] = [
  { label: "All stash matches", value: "all" },
  { label: "Meets all requirements", value: "ready" },
  { label: "Needs review", value: "review" },
  { label: "Missing supplies", value: "missing" },
];

const difficultyStyles: Record<NonNullable<Pattern["difficulty"]>, string> = {
  beginner: "bg-lime-100 text-lime-700 ring-1 ring-inset ring-lime-200",
  intermediate: "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200",
  advanced: "bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200",
};

const compactDifficultyLabels: Record<NonNullable<Pattern["difficulty"]>, string> = {
  beginner: "Beg",
  intermediate: "Int",
  advanced: "Adv",
};

const compactStatusLabels: Record<PatternMatchStatus, string> = {
  "ready-to-start": "Ready",
  "review-supplies": "Review",
  "need-supplies": "Missing",
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function FieldLabel({ label }: { label: string }) {
  return <span className="text-sm font-medium text-stone-700">{label}</span>;
}

function TableDifficultyToken({ difficulty }: { difficulty?: Pattern["difficulty"] }) {
  if (!difficulty) {
    return (
      <span className="inline-flex w-fit items-center rounded-full bg-stone-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
        N/A
      </span>
    );
  }

  return (
    <span
      className={[
        "inline-flex w-fit items-center rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        difficultyStyles[difficulty],
      ].join(" ")}
      title={titleCase(difficulty)}
    >
      {compactDifficultyLabels[difficulty]}
    </span>
  );
}

function TableStatusIndicator({ status }: { status?: PatternMatchStatus }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-medium text-stone-500">
        <span className="h-2.5 w-2.5 rounded-full bg-stone-300" aria-hidden="true" />
        Unscored
      </span>
    );
  }

  const dotClasses: Record<PatternMatchStatus, string> = {
    "ready-to-start": "bg-emerald-500",
    "review-supplies": "bg-amber-500",
    "need-supplies": "bg-rose-500",
  };

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-stone-700">
      <span className={["h-2.5 w-2.5 rounded-full", dotClasses[status]].join(" ")} aria-hidden="true" />
      {compactStatusLabels[status]}
    </span>
  );
}

function RowActions({
  patternName,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
}: {
  patternName: string;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        aria-label={`Open actions for ${patternName}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={(event) => {
          if (event.key === "Escape" && isOpen) {
            event.preventDefault();
            onToggle();
          }
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-600 transition hover:border-rose-200 hover:text-stone-900"
      >
        <Ellipsis size={16} />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 top-12 z-10 min-w-36 rounded-2xl border border-stone-200 bg-white p-2 shadow-[0_18px_40px_-24px_rgba(41,37,36,0.45)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={onEdit}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            <Pencil size={15} />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onDelete}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 size={15} />
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Patterns() {
  const { patterns, addPattern, updatePattern, deletePattern, patternMatchById } = useAppData();
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>("all");
  const [selectedRequirement, setSelectedRequirement] = useState<RequirementFilter>("all");
  const [isAddPatternOpen, setIsAddPatternOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<Pattern | null>(null);
  const [patternPendingDelete, setPatternPendingDelete] = useState<Pattern | null>(null);
  const [openRowActionId, setOpenRowActionId] = useState<string | null>(null);

  const filteredPatterns = patterns.filter((pattern) => {
    const summary = patternMatchById.get(pattern.id);
    const categoryMatches = selectedCategory === "all" || pattern.category === selectedCategory;
    const difficultyMatches =
      selectedDifficulty === "all" || pattern.difficulty === selectedDifficulty;
    const requirementMatches =
      selectedRequirement === "all" ||
      (selectedRequirement === "ready" && summary?.status === "ready-to-start") ||
      (selectedRequirement === "review" && summary?.status === "review-supplies") ||
      (selectedRequirement === "missing" && summary?.status === "need-supplies");

    return categoryMatches && difficultyMatches && requirementMatches;
  });

  function closePatternModal() {
    setIsAddPatternOpen(false);
    setEditingPattern(null);
  }

  async function handlePatternSubmit(values: PatternFormValues) {
    const nextPattern: Pattern = {
      id: editingPattern?.id ?? `pattern-${Date.now()}`,
      name: values.name.trim(),
      addedAt: editingPattern?.addedAt ?? new Date().toISOString().slice(0, 10),
      isPlanned: editingPattern?.isPlanned ?? false,
      category: values.category || undefined,
      difficulty: values.difficulty || undefined,
      source: values.source.trim() || undefined,
      sourceUrl: values.sourceUrl.trim() || undefined,
      notes: values.notes.trim() || undefined,
      instructions: values.instructions,
      requirements: values.requirements,
    };

    if (editingPattern) {
      await updatePattern(nextPattern);
    } else {
      await addPattern(nextPattern);
    }

    closePatternModal();
  }

  async function handleDeleteConfirm() {
    if (!patternPendingDelete) {
      return;
    }

    await deletePattern(patternPendingDelete.id);
    setPatternPendingDelete(null);
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">
              Stitch Keeper
            </p>
            <h1 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
              Patterns
            </h1>
            <p className="max-w-2xl text-base leading-7 text-stone-600">
              Browse your pattern library and narrow it down by category, difficulty, and stash
              readiness.
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
                onChange={(event) =>
                  setSelectedRequirement(event.target.value as RequirementFilter)
                }
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
              Showing <span className="font-semibold text-stone-900">{filteredPatterns.length}</span>{" "}
              patterns
            </div>
          </div>
        </section>

        <section className="overflow-scroll rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-stone-200/70 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                <th className="w-[50%] px-4 py-4 text-left sm:px-5 md:w-[36%]">Pattern</th>
                <th className="hidden w-[18%] px-4 py-4 text-left md:table-cell xl:w-[16%] xl:px-5">Category</th>
                <th className="hidden w-[20%] px-4 py-4 text-left md:table-cell sm:px-5">Difficulty</th>
                <th className="w-[20%] px-4 py-4 text-left sm:w-[10%] sm:px-5">Status</th>
                <th className="w-16 px-3 py-4 text-right sm:px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPatterns.map((pattern) => {
                const summary = patternMatchById.get(pattern.id);

                return (
                  <tr key={pattern.id} className="transition hover:bg-stone-50">
                    <td className="px-4 py-5 align-center sm:px-5">
                      <Link
                        to={`/patterns/${pattern.id}`}
                        className="block text-sm font-semibold leading-6 text-stone-900 hover:underline sm:text-base"
                      >
                        {pattern.name}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                        <TableDifficultyToken difficulty={pattern.difficulty} />
                      </div>
                      <p className="mt-1 hidden text-sm leading-6 text-stone-600 xl:block">
                        {pattern.notes ?? "No notes yet for this pattern."}
                      </p>
                    </td>
                    <td className="hidden px-4 py-5 align-center text-sm text-stone-700 md:table-cell xl:px-5">
                      {pattern.category ? titleCase(pattern.category) : "Uncategorized"}
                    </td>
                    <td className="hidden px-4 py-5 align-center md:table-cell sm:px-5">
                      <TableDifficultyToken difficulty={pattern.difficulty} />
                    </td>
                    <td className="px-4 py-5 align-center sm:px-5">
                      <TableStatusIndicator status={summary?.status} />
                    </td>
                    <td className="px-3 py-5 align-center sm:px-4">
                      <RowActions
                        patternName={pattern.name}
                        isOpen={openRowActionId === pattern.id}
                        onToggle={() =>
                          setOpenRowActionId((currentId) =>
                            currentId === pattern.id ? null : pattern.id,
                          )
                        }
                        onEdit={() => {
                          setOpenRowActionId(null);
                          setEditingPattern(pattern);
                        }}
                        onDelete={() => {
                          setOpenRowActionId(null);
                          setPatternPendingDelete(pattern);
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </section>

      <Modal
        title={editingPattern ? "Edit Pattern" : "Add Pattern"}
        isOpen={isAddPatternOpen || Boolean(editingPattern)}
        onClose={closePatternModal}
        maxWidthClassName="max-w-5xl"
      >
        <PatternForm
          initialValues={
            editingPattern
              ? {
                  name: editingPattern.name,
                  source: editingPattern.source ?? "",
                  sourceUrl: editingPattern.sourceUrl ?? "",
                  category: editingPattern.category ?? "",
                  difficulty: editingPattern.difficulty ?? "",
                  notes: editingPattern.notes ?? "",
                  instructions: editingPattern.instructions,
                  requirements: editingPattern.requirements,
                }
              : undefined
          }
          submitLabel={editingPattern ? "Save Changes" : "Save Pattern"}
          onSubmit={(values) => { void handlePatternSubmit(values) }}
          onCancel={closePatternModal}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(patternPendingDelete)}
        title="Delete Pattern"
        description={
          patternPendingDelete
            ? `Delete "${patternPendingDelete.name}" and all of its requirements? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete Pattern"
        onConfirm={() => { void handleDeleteConfirm() }}
        onCancel={() => setPatternPendingDelete(null)}
      />
    </>
  );
}
