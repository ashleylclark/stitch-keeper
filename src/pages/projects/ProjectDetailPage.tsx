import { useState } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ProjectForm, type ProjectFormValues } from './components/ProjectForm';
import { useAppData } from '../../app/state/app-data';
import type { Pattern, Project, ProjectStatus } from '../../types/models';

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; badgeClassName: string }
> = {
  planned: {
    label: 'Planned',
    badgeClassName: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200',
  },
  'in-progress': {
    label: 'In Progress',
    badgeClassName:
      'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  },
  'need-supplies': {
    label: 'Need Supplies',
    badgeClassName:
      'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  },
  paused: {
    label: 'Paused',
    badgeClassName:
      'bg-stone-200 text-stone-700 ring-1 ring-inset ring-stone-300',
  },
  completed: {
    label: 'Completed',
    badgeClassName: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200',
  },
};

const difficultyStyles: Record<NonNullable<Pattern['difficulty']>, string> = {
  beginner: 'bg-lime-100 text-lime-700 ring-1 ring-inset ring-lime-200',
  intermediate: 'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200',
  advanced: 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-200',
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={[
        'rounded-full px-3 py-1 text-xs font-semibold',
        statusConfig[status].badgeClassName,
      ].join(' ')}
    >
      {statusConfig[status].label}
    </span>
  );
}

function DifficultyBadge({
  difficulty,
}: {
  difficulty?: Pattern['difficulty'];
}) {
  if (!difficulty) {
    return (
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs font-semibold text-stone-600">
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
        'inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-white transition',
        tone === 'danger'
          ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
          : 'border-stone-200 text-stone-600 hover:border-rose-200 hover:text-stone-900',
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
        to="/projects"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900"
      >
        <ArrowLeft size={16} />
        Back to projects
      </Link>
      <div className="rounded-[2rem] border border-white/80 bg-white/85 p-8 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur">
        <h1 className="font-serif text-3xl text-stone-900">
          Project not found
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          This project does not exist in the current project list.
        </p>
      </div>
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] bg-stone-50 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-sm text-stone-800">{value}</p>
    </div>
  );
}

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { stashItems, patterns, projects, updateProject, deleteProject } =
    useAppData();
  const { projectId } = useParams();
  const project = projects.find((item) => item.id === projectId);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!project) {
    return <NotFoundState />;
  }

  const currentProject = project;
  const linkedPattern = currentProject.patternId
    ? patterns.find((pattern) => pattern.id === currentProject.patternId)
    : undefined;
  const linkedStashItems = stashItems.filter((item) =>
    currentProject.stashItemIds.includes(item.id),
  );

  async function handleSubmit(values: ProjectFormValues) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const nextProject: Project = {
        ...currentProject,
        name: values.name.trim(),
        patternId: values.patternId,
        stashItemIds: values.stashItemIds,
        stashUsages: values.stashUsages,
        status: values.status,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        notes: values.notes.trim() || undefined,
      };

      await updateProject(nextProject);
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
      await deleteProject(currentProject.id);
      navigate('/projects');
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
          to="/projects"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-900"
        >
          <ArrowLeft size={16} />
          Back to projects
        </Link>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">
                Stitch Keeper
              </p>
              <h1 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">
                {currentProject.name}
              </h1>
              <p className="max-w-3xl text-base leading-7 text-stone-600">
                {currentProject.notes ??
                  'No notes have been added for this project yet.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={currentProject.status} />
              <ActionButton
                label={`Edit ${currentProject.name}`}
                onClick={() => setIsEditOpen(true)}
              >
                <Pencil size={16} />
              </ActionButton>
              <ActionButton
                label={`Delete ${currentProject.name}`}
                tone="danger"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 size={16} />
              </ActionButton>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {currentProject.startDate ? (
              <DetailRow
                label="Started"
                value={formatDate(currentProject.startDate)}
              />
            ) : null}
            {currentProject.endDate ? (
              <DetailRow
                label="Completed"
                value={formatDate(currentProject.endDate)}
              />
            ) : null}
            <DetailRow
              label="Stash Items Linked"
              value={String(currentProject.stashItemIds.length)}
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur sm:p-8">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-stone-900">
              Linked Stash Items
            </h2>
            <p className="text-sm leading-6 text-stone-600">
              Supplies currently connected to this project.
            </p>
          </div>

          {linkedStashItems.length > 0 ? (
            <div className="mt-6 grid gap-3">
              {linkedStashItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.5rem] border border-stone-200 bg-stone-50/80 px-5 py-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-stone-900">
                        {item.name}
                      </p>
                      <p className="text-sm text-stone-600">
                        {item.quantity} {item.unit ?? 'items'}
                      </p>
                    </div>
                    <div className="text-sm text-stone-500">
                      {item.category.charAt(0).toUpperCase() +
                        item.category.slice(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-5 text-sm leading-6 text-stone-600">
              No stash items are linked to this project yet.
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur sm:p-8">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl text-stone-900">
              Linked Pattern
            </h2>
            <p className="text-sm leading-6 text-stone-600">
              The pattern this project is based on.
            </p>
          </div>

          {linkedPattern ? (
            <Link
              to={`/patterns/${linkedPattern.id}`}
              className="mt-6 block rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-5 transition hover:border-rose-200 hover:bg-rose-50/60"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-stone-900">
                    {linkedPattern.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {linkedPattern.category ? (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700 ring-1 ring-inset ring-stone-200">
                        {titleCase(linkedPattern.category)}
                      </span>
                    ) : null}
                    <DifficultyBadge difficulty={linkedPattern.difficulty} />
                  </div>
                  <p className="text-sm leading-6 text-stone-600">
                    {linkedPattern.notes ??
                      'No notes have been added for this pattern yet.'}
                  </p>
                </div>
                <span className="text-sm font-medium text-rose-600">
                  View pattern
                </span>
              </div>
            </Link>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-5 text-sm leading-6 text-stone-600">
              No linked pattern could be found for this project.
            </div>
          )}
        </section>
      </section>

      <Modal
        title="Edit Project"
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSubmitError(null);
        }}
        maxWidthClassName="max-w-3xl"
      >
        <ProjectForm
          patternOptions={patterns.map((pattern) => ({
            id: pattern.id,
            name: pattern.name,
          }))}
          stashItemOptions={stashItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
          }))}
          initialValues={{
            name: currentProject.name,
            patternId: currentProject.patternId ?? '',
            stashItemIds: currentProject.stashItemIds,
            stashUsages: currentProject.stashUsages,
            status: currentProject.status,
            startDate: currentProject.startDate ?? '',
            endDate: currentProject.endDate ?? '',
            notes: currentProject.notes ?? '',
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
        title="Delete Project"
        description={`Delete "${currentProject.name}"? This cannot be undone.`}
        confirmLabel="Delete Project"
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
