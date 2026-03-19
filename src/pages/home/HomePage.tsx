import { Link } from 'react-router-dom';
import { useAppData } from '../../app/state/app-data';
import type { PatternMatchStatus, ProjectStatus } from '../../types/models';
import { patternMatchLabels } from '../patterns/lib/patternMatching';

type HomeStat = {
  label: string;
  value: number;
  helperText: string;
};

type StatusTone = 'rose' | 'amber' | 'emerald' | 'sky';

type DashboardItem = {
  id: string;
  name: string;
  detail: string;
  status: string;
  tone: StatusTone;
  href: string;
};

const HOME_SECTION_LIMIT = 3;

const activeProjectStatusPriority: Record<ProjectStatus, number> = {
  'in-progress': 0,
  'need-supplies': 1,
  planned: 2,
  completed: 3,
  paused: 4,
};

const badgeClasses: Record<StatusTone, string> = {
  rose: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:ring-rose-800',
  amber:
    'bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-800',
  emerald:
    'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900',
  sky: 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-900',
};

const projectStatusConfig: Record<
  ProjectStatus,
  { label: string; tone: StatusTone }
> = {
  planned: { label: 'Planned', tone: 'sky' },
  'in-progress': { label: 'In Progress', tone: 'rose' },
  completed: { label: 'Completed', tone: 'emerald' },
  paused: { label: 'Paused', tone: 'amber' },
  'need-supplies': { label: 'Need More Supplies', tone: 'amber' },
};

const patternStatusConfig: Record<
  PatternMatchStatus,
  { label: string; tone: StatusTone }
> = {
  'ready-to-start': { label: 'Ready To Start', tone: 'emerald' },
  'review-supplies': { label: 'Review Supplies', tone: 'amber' },
  'need-supplies': { label: 'Need More Supplies', tone: 'amber' },
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

function StatCard({ label, value, helperText }: HomeStat) {
  return (
    <article className="rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/85 dark:shadow-[0_20px_60px_-35px_rgba(0,0,0,0.7)]">
      <p className="text-sm font-medium text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <div className="mt-4 flex items-end gap-2">
        <span className="font-serif text-4xl leading-none text-stone-900 dark:text-stone-100">
          {value}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-stone-600 dark:text-stone-400">
        {helperText}
      </p>
    </article>
  );
}

function StatusBadge({ status, tone }: Pick<DashboardItem, 'status' | 'tone'>) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold text-center justify-center',
        badgeClasses[tone],
      ].join(' ')}
    >
      {status}
    </span>
  );
}

function DashboardList({
  title,
  description,
  items,
  viewAllHref,
}: {
  title: string;
  description: string;
  items: DashboardItem[];
  viewAllHref: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_-35px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/85 dark:shadow-[0_20px_60px_-35px_rgba(0,0,0,0.7)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-100">
            {title}
          </h2>
          <p className="text-sm leading-6 text-stone-600 dark:text-stone-400">
            {description}
          </p>
        </div>
        <Link
          to={viewAllHref}
          className="inline-flex shrink-0 items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-rose-200 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 dark:hover:border-rose-400 dark:hover:text-stone-50"
        >
          View All
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.5rem] border border-stone-100 bg-stone-50/80 px-4 py-4 transition hover:border-rose-100 hover:bg-rose-50/50 dark:border-stone-800 dark:bg-stone-950/70 dark:hover:border-rose-900/70 dark:hover:bg-stone-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <Link
                  to={item.href}
                  className="block flex-1 space-y-1 transition hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 dark:hover:text-stone-100 dark:focus-visible:ring-rose-400"
                >
                  <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                    {item.name}
                  </h3>
                  <p className="text-sm leading-6 text-stone-600 dark:text-stone-400">
                    {item.detail}
                  </p>
                </Link>
                <StatusBadge status={item.status} tone={item.tone} />
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-4 py-5 text-sm leading-6 text-stone-600 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-300">
            Nothing to show here yet.
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const { patterns, patternMatchById, projects } = useAppData();

  const activeProjectCount = projects.filter(
    (project) =>
      project.status === 'in-progress' ||
      project.status === 'need-supplies' ||
      project.status === 'planned',
  ).length;

  const activeProjects = [...projects]
    .filter(
      (project) =>
        project.status === 'in-progress' ||
        project.status === 'need-supplies' ||
        project.status === 'planned',
    )
    .sort((left, right) => {
      const statusDifference =
        activeProjectStatusPriority[left.status] -
        activeProjectStatusPriority[right.status];

      if (statusDifference !== 0) {
        return statusDifference;
      }

      return (
        new Date(right.startDate ?? '').getTime() -
        new Date(left.startDate ?? '').getTime()
      );
    })
    .slice(0, HOME_SECTION_LIMIT)
    .map<DashboardItem>((project) => ({
      id: project.id,
      name: project.name,
      detail: project.notes ?? 'No project notes yet.',
      status: projectStatusConfig[project.status].label,
      tone: projectStatusConfig[project.status].tone,
      href: `/projects/${project.id}`,
    }));

  const readyPatternCount = patterns.filter(
    (pattern) => patternMatchById.get(pattern.id)?.status === 'ready-to-start',
  ).length;

  const readyPatterns = [...patterns]
    .filter(
      (pattern) =>
        patternMatchById.get(pattern.id)?.status === 'ready-to-start',
    )
    .sort(
      (left, right) =>
        new Date(right.addedAt ?? '').getTime() -
        new Date(left.addedAt ?? '').getTime(),
    )
    .slice(0, HOME_SECTION_LIMIT)
    .map<DashboardItem>((pattern) => {
      const summary = patternMatchById.get(pattern.id);
      const status = summary?.status ?? 'review-supplies';

      return {
        id: pattern.id,
        name: pattern.name,
        detail:
          summary?.detail ?? 'Review the requirements against your stash.',
        status: patternStatusConfig[status].label,
        tone: patternStatusConfig[status].tone,
        href: `/patterns/${pattern.id}`,
      };
    });

  const recentPatterns = [...patterns]
    .filter((pattern) => pattern.addedAt)
    .sort(
      (left, right) =>
        new Date(right.addedAt ?? '').getTime() -
        new Date(left.addedAt ?? '').getTime(),
    )
    .slice(0, 3)
    .map<DashboardItem>((pattern) => {
      const summary = patternMatchById.get(pattern.id);

      return {
        id: pattern.id,
        name: pattern.name,
        detail: pattern.addedAt
          ? `Added ${formatDate(pattern.addedAt)}`
          : 'Recently added',
        status: summary ? patternMatchLabels[summary.status] : 'New',
        tone: summary ? patternStatusConfig[summary.status].tone : 'rose',
        href: `/patterns/${pattern.id}`,
      };
    });

  const homeStats: HomeStat[] = [
    {
      label: 'Active Projects',
      value: activeProjectCount,
      helperText:
        'Projects currently in progress, planned, or waiting on supplies.',
    },
    {
      label: 'Ready Patterns',
      value: readyPatternCount,
      helperText: 'Patterns you can start now with what you already have.',
    },
    {
      label: 'Recent Patterns',
      value: recentPatterns.length,
      helperText: 'Newly added patterns surfaced on the dashboard.',
    },
    {
      label: 'Finished Makes',
      value: projects.filter((project) => project.status === 'completed')
        .length,
      helperText: 'Projects marked complete in your project history.',
    },
  ];

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500 dark:text-rose-300">
          Stitch Keeper
        </p>
        <h1 className="font-serif text-4xl tracking-tight text-stone-900 dark:text-stone-100 sm:text-5xl">
          Home
        </h1>
        <p className="max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-400">
          A quick snapshot of the parts of your crochet stash you will check
          most often.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {homeStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <DashboardList
          title="Active Projects"
          description="Projects that are underway or lined up next."
          items={activeProjects}
          viewAllHref="/projects"
        />
        <DashboardList
          title="Patterns You Can Make Now"
          description="Patterns matched to yarn and tools you already have."
          items={readyPatterns}
          viewAllHref="/patterns"
        />
      </div>

      <div className="grid gap-5">
        <DashboardList
          title="Recently Added Patterns"
          description="Fresh additions to your library that may be worth queuing up soon."
          items={recentPatterns}
          viewAllHref="/patterns"
        />
      </div>
    </section>
  );
}
