import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { PatternForm, type PatternFormValues } from "../components/forms/PatternForm";
import { useAppData } from "../context/app-data";
import type { Pattern, PatternMatchStatus } from "../types/models";
import {
  patternMatchBadgeClasses,
  patternMatchLabels,
} from "../utils/patternMatching";

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

function TitleCase({ value }: { value: string }) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function FieldLabel({ label }: { label: string }) {
  return <span className="text-sm font-medium text-stone-700">{label}</span>;
}

function DifficultyBadge({ difficulty }: { difficulty?: Pattern["difficulty"] }) {
  if (!difficulty) {
    return (
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">
        Unknown
      </span>
    );
  }

  return (
    <span className={["rounded-full px-3 py-1 text-xs font-semibold", difficultyStyles[difficulty]].join(" ")}>
      <TitleCase value={difficulty} />
    </span>
  );
}

function RequirementBadge({ status }: { status?: PatternMatchStatus }) {
  if (!status) {
    return (
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">
        Unscored
      </span>
    );
  }

  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-semibold",
        patternMatchBadgeClasses[status],
      ].join(" ")}
    >
      {patternMatchLabels[status]}
    </span>
  );
}

function ActionButton({
  label,
  tone = "default",
  onClick,
  children,
}: {
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-white transition",
        tone === "danger"
          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
          : "border-stone-200 text-stone-600 hover:border-rose-200 hover:text-stone-900",
      ].join(" ")}
    >
      {children}
    </button>
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

        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-stone-200/70 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                <th className="px-5 py-4 text-left">Pattern</th>
                <th className="px-5 py-4 text-left">Category</th>
                <th className="px-5 py-4 text-left">Difficulty</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPatterns.map((pattern) => {
                const summary = patternMatchById.get(pattern.id);

                return (
                  <tr key={pattern.id} className="transition hover:bg-stone-50">
                    <td className="px-5 py-5 sm:px-6">
                      <Link
                        to={`/patterns/${pattern.id}`}
                        className="font-semibold text-stone-900 hover:underline"
                      >
                        {pattern.name}
                      </Link>
                      <p className="text-sm leading-6 text-stone-600">
                        {pattern.notes ?? "No notes yet for this pattern."}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-sm text-stone-700 sm:px-6">
                      {pattern.category ? <TitleCase value={pattern.category} /> : "Uncategorized"}
                    </td>
                    <td className="px-5 py-5 sm:px-6">
                      <DifficultyBadge difficulty={pattern.difficulty} />
                    </td>
                    <td className="px-5 py-5 sm:px-6">
                      <RequirementBadge status={summary?.status} />
                    </td>
                    <td className="px-5 py-5 sm:px-6">
                      <div className="flex gap-2">
                        <ActionButton label={`Edit ${pattern.name}`} onClick={() => setEditingPattern(pattern)}>
                          <Pencil size={16} />
                        </ActionButton>
                        <ActionButton
                          label={`Delete ${pattern.name}`}
                          tone="danger"
                          onClick={() => setPatternPendingDelete(pattern)}
                        >
                          <Trash2 size={16} />
                        </ActionButton>
                      </div>
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
