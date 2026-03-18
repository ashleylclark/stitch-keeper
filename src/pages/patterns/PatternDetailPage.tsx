import { useState } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PatternForm, type PatternFormValues } from './components/PatternForm';
import { useAppData } from '../../app/state/app-data';
import type {
  Pattern,
  PatternMatchStatus,
  RequirementMatch,
} from '../../types/models';
import {
  patternMatchBadgeClasses,
  patternMatchLabels,
  requirementMatchBadgeClasses,
  requirementMatchLabels,
} from './lib/patternMatching';

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

const difficultyStyles: Record<NonNullable<Pattern['difficulty']>, string> = {
  beginner: 'bg-lime-100 text-lime-700 ring-1 ring-inset ring-lime-200 dark:bg-lime-900/40 dark:text-lime-200 dark:ring-lime-800',
  intermediate: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800',
  advanced: 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:ring-orange-800',
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function DifficultyBadge({
  difficulty,
}: {
  difficulty?: Pattern['difficulty'];
}) {
  if (!difficulty) {
    return (
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
        Unknown
      </span>
    );
  }

  return (
    <span
      className={[
        'rounded-full px-3 py-1 text-xs font-semibold',
        difficultyStyles[difficulty],
      ].join(' ')}
    >
      {titleCase(difficulty)}
    </span>
  );
}

function RequirementBadge({ status }: { status?: PatternMatchStatus }) {
  if (!status) {
    return (
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
        Unscored
      </span>
    );
  }

  return (
    <span
      className={[
        'rounded-full px-3 py-1 text-xs font-semibold',
        patternMatchBadgeClasses[status],
      ].join(' ')}
    >
      {patternMatchLabels[status]}
    </span>
  );
}

function RequirementMatchBadge({ match }: { match?: RequirementMatch }) {
  if (!match) {
    return (
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
        Unmatched
      </span>
    );
  }

  return (
    <span
      className={[
        'rounded-full px-3 py-1 text-xs font-semibold',
        requirementMatchBadgeClasses[match.status],
      ].join(' ')}
    >
      {requirementMatchLabels[match.status]}
    </span>
  );
}

function ActionButton({
  label,
  tone = 'default',
  onClick,
  children,
}: {
  label: string;
  tone?: 'default' | 'danger';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        'inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-white transition dark:bg-stone-900',
        tone === 'danger'
          ? 'border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300 dark:hover:bg-rose-950/40'
          : 'border-stone-200 text-stone-600 hover:border-rose-200 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:border-rose-500/50 dark:hover:text-stone-50',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function NotFoundState() {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Link
        to="/patterns"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-50"
      >
        <ArrowLeft size={16} />
        Back to patterns
      </Link>
      <div className="rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800/80 dark:bg-stone-900/85 dark:shadow-[0_20px_60px_-35px_rgba(0,0,0,0.7)]">
        <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-50">
          Pattern not found
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300">
          This pattern does not exist in the current library.
        </p>
      </div>
    </section>
  );
}

export default function PatternDetail() {
  const navigate = useNavigate();
  const { patternMatchById, patterns, updatePattern, deletePattern } =
    useAppData();
  const { patternId } = useParams();
  const pattern = patterns.find((item) => item.id === patternId);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!pattern) {
    return <NotFoundState />;
  }

  const currentPattern = pattern;
  const patternSummary = patternMatchById.get(currentPattern.id);
  const requirementMatchesById = new Map(
    patternSummary?.requirementMatches.map((match) => [
      match.requirementId,
      match,
    ]) ?? [],
  );

  async function handleSubmit(values: PatternFormValues) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
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
      };

      await updatePattern(nextPattern);
      setIsEditOpen(false);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deletePattern(currentPattern.id);
      navigate('/patterns');
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Link
          to="/patterns"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-50"
        >
          <ArrowLeft size={16} />
          Back to patterns
        </Link>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800/80 dark:bg-stone-900/85 dark:shadow-[0_20px_60px_-35px_rgba(0,0,0,0.7)] sm:p-8">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500 dark:text-rose-300">
              Stitch Keeper
            </p>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <h1 className="font-serif text-4xl tracking-tight text-stone-900 dark:text-stone-50 sm:text-5xl">
                  {currentPattern.name}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-stone-600 dark:text-stone-300">
                  {currentPattern.notes ??
                    'No notes have been added for this pattern yet.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {currentPattern.category ? (
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 dark:bg-stone-800 dark:text-stone-200">
                    {titleCase(currentPattern.category)}
                  </span>
                ) : null}
                <DifficultyBadge difficulty={currentPattern.difficulty} />
                <RequirementBadge status={patternSummary?.status} />
                <ActionButton
                  label={`Edit ${currentPattern.name}`}
                  onClick={() => setIsEditOpen(true)}
                >
                  <Pencil size={16} />
                </ActionButton>
                <ActionButton
                  label={`Delete ${currentPattern.name}`}
                  tone="danger"
                  onClick={() => setIsDeleteOpen(true)}
                >
                  <Trash2 size={16} />
                </ActionButton>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800/80 dark:bg-stone-900/85 dark:shadow-[0_20px_60px_-35px_rgba(0,0,0,0.7)] sm:p-8">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-50">Requirements</h2>
            <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
              Everything listed for this pattern at a glance.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-stone-200/70 dark:border-stone-700">
            <table className="w-full table-auto">
              <thead className="bg-stone-50 dark:bg-stone-800/80">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">
                  <th className="px-4 py-4">Item</th>
                  <th className="px-4 py-4">Category</th>
                  <th className="px-4 py-4">Details</th>
                  <th className="px-4 py-4">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white dark:divide-stone-800 dark:bg-stone-900">
                {currentPattern.requirements.map((requirement) => {
                  const match = requirementMatchesById.get(requirement.id);

                  return (
                    <tr key={requirement.id}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-stone-900 dark:text-stone-100">
                          {requirement.name}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-stone-700 dark:text-stone-300">
                        {titleCase(requirement.category)}
                      </td>
                      <td className="px-4 py-4 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        {[
                          requirement.weight
                            ? titleCase(requirement.weight)
                            : null,
                          requirement.quantityNeeded
                            ? `${requirement.quantityNeeded} ${requirement.unit ?? 'items'}`
                            : null,
                          requirement.size ?? null,
                          requirement.notes ?? null,
                        ]
                          .filter(Boolean)
                          .join(' • ') || 'No extra details'}
                      </td>
                      <td className="px-4 py-4 text-sm leading-6 text-stone-600 dark:text-stone-300">
                        <div className="space-y-2">
                          <RequirementMatchBadge match={match} />
                          <p>{match?.reason ?? 'No match details yet.'}</p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800/80 dark:bg-stone-900/85 dark:shadow-[0_20px_60px_-35px_rgba(0,0,0,0.7)] sm:p-8">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-50">Instructions</h2>
            <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">
              Stored exactly as entered so line breaks and spacing are
              preserved.
            </p>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-rose-100 bg-rose-50/60 p-5 dark:border-rose-900/50 dark:bg-rose-950/20">
            <div className="whitespace-pre-wrap text-sm leading-7 text-stone-700 dark:text-stone-200">
              {currentPattern.instructions}
            </div>
          </div>
        </section>
      </section>

      <Modal
        title="Edit Pattern"
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSubmitError(null);
        }}
        maxWidthClassName="max-w-5xl"
      >
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
          onSubmit={(values) => {
            void handleSubmit(values);
          }}
          onCancel={() => {
            setIsEditOpen(false);
            setSubmitError(null);
          }}
          submitError={submitError}
          isSubmitting={isSubmitting}
        />
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Pattern"
        description={`Delete "${currentPattern.name}" and all of its requirements? This cannot be undone.`}
        confirmLabel="Delete Pattern"
        onConfirm={() => {
          void handleDelete();
        }}
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeleteError(null);
        }}
        error={deleteError}
        isConfirming={isDeleting}
      />
    </>
  );
}
