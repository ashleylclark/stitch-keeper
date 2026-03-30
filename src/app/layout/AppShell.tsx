import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BookMarked,
  HouseHeart,
  LogOut,
  Menu,
  MoonStar,
  PackageOpen,
  Spool,
  SunMedium,
  X,
} from 'lucide-react';
import { useAuth } from '../state/auth';
import { useAppData } from '../state/app-data';
import { useTheme } from '../theme/theme-context';

type NavItem = {
  label: string;
  to: string;
  icon: ReactNode;
};

const navItems: NavItem[] = [
  {
    label: 'Home',
    to: '/',
    icon: <HouseHeart color="currentColor" size={20} />,
  },
  {
    label: 'Stash',
    to: '/stash',
    icon: <Spool color="currentColor" size={20} />,
  },
  {
    label: 'Patterns',
    to: '/patterns',
    icon: <BookMarked color="currentColor" size={20} />,
  },
  {
    label: 'Projects',
    to: '/projects',
    icon: <PackageOpen color="currentColor" size={20} />,
  },
];

function Sidebar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500 dark:text-rose-300">
              Stitch Keeper
            </p>
            <h1 className="mt-3 font-serif text-2xl text-stone-900 dark:text-stone-100">
              Fiber Arts HQ
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
              Keep yarn, patterns, and works in progress in one place.
            </p>
          </div>
          {mobile ? (
            <button
              type="button"
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 transition hover:border-rose-200 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-rose-400 dark:hover:text-stone-50"
            >
              {theme === 'dark' ? (
                <SunMedium color="currentColor" size={18} />
              ) : (
                <MoonStar color="currentColor" size={18} />
              )}
            </button>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-rose-200 text-white shadow-lg shadow-stone-900/10 dark:bg-rose-800 dark:text-stone-950 dark:shadow-black/20'
                      : 'text-stone-600 hover:bg-rose-50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'flex h-10 w-10 items-center justify-center rounded-xl transition',
                        isActive
                          ? 'bg-white/15 dark:bg-stone-950/20'
                          : mobile
                            ? 'bg-white/70 dark:bg-stone-900/80'
                            : 'bg-white/90 dark:bg-stone-900/90',
                      ].join(' ')}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function AppShell() {
  const { isLoading, error } = useAppData();
  const {
    currentUser,
    error: authError,
    isLoading: isAuthLoading,
    login,
    logout,
  } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!isAuthLoading && !currentUser && !authError) {
      login();
    }
  }, [authError, currentUser, isAuthLoading, login]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf7_0%,#f7f1eb_100%)] text-stone-900 dark:bg-[linear-gradient(180deg,#1c1917_0%,#292524_100%)] dark:text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:max-w-[1500px] lg:px-8">
        <aside className="hidden w-80 shrink-0 overflow-hidden rounded-[2rem] border border-white/70 bg-rose-50/95 shadow-[0_30px_80px_-40px_rgba(41,37,36,0.4)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/95 dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.65)] lg:block">
          <Sidebar />
        </aside>

        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[2rem] border border-white/70 bg-white/55 shadow-[0_30px_80px_-40px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/70 dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)]">
          <header className="flex items-center justify-between border-b border-stone-200/70 px-5 py-4 dark:border-stone-800 sm:px-8 lg:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500 dark:text-rose-300">
                Workspace
              </p>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {currentUser
                  ? `Signed in as ${currentUser.name ?? currentUser.email ?? 'maker'}`
                  : 'Organize your fiber arts world.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentUser ? (
                <button
                  type="button"
                  aria-label="Log out"
                  onClick={logout}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 shadow-sm transition hover:border-rose-200 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-rose-400 dark:hover:text-stone-50"
                >
                  <LogOut color="currentColor" size={18} />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Toggle dark mode"
                onClick={toggleTheme}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-rose-200 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-rose-400 dark:hover:text-stone-50"
              >
                {theme === 'dark' ? (
                  <SunMedium color="currentColor" size={20} />
                ) : (
                  <MoonStar color="currentColor" size={20} />
                )}
              </button>
              <button
                type="button"
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-rose-200 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-rose-400 dark:hover:text-stone-50 lg:hidden"
              >
                <Menu color="currentColor" size={20} />
              </button>
            </div>
          </header>

          <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {isAuthLoading ? (
              <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
                <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-100">
                  Checking your sign-in...
                </h1>
                <p className="text-base text-stone-600 dark:text-stone-400">
                  Looking for an active Authentik session.
                </p>
              </section>
            ) : authError ? (
              <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[2rem] border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/60 dark:bg-rose-950/40">
                <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-100">
                  Could not load authentication
                </h1>
                <p className="text-base text-stone-700 dark:text-rose-100">
                  {authError}
                </p>
              </section>
            ) : !currentUser ? (
              <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[2rem] border border-stone-200/70 bg-white/80 p-6 dark:border-stone-800 dark:bg-stone-950/60">
                <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-100">
                  Redirecting to sign in...
                </h1>
                <p className="text-base text-stone-600 dark:text-stone-400">
                  Stitch Keeper uses Authentik for authentication in this
                  deployment.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={login}
                    className="inline-flex rounded-2xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 dark:bg-rose-400 dark:text-stone-950 dark:hover:bg-rose-300"
                  >
                    Sign in
                  </button>
                </div>
              </section>
            ) : isLoading ? (
              <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
                <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-100">
                  Loading your fiber data...
                </h1>
                <p className="text-base text-stone-600 dark:text-stone-400">
                  Reading stash, patterns, and projects from the API.
                </p>
              </section>
            ) : error ? (
              <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[2rem] border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/60 dark:bg-rose-950/40">
                <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-100">
                  Could not load app data
                </h1>
                <p className="text-base text-stone-700 dark:text-rose-100">
                  {error}
                </p>
              </section>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="flex-1 bg-stone-950/50 backdrop-blur-[2px]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="h-full w-[18.5rem] max-w-[85vw] border-l border-white/70 bg-[#f6ede6] shadow-2xl dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-end px-4 py-4">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-rose-200 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 dark:hover:border-rose-400 dark:hover:text-stone-50"
              >
                <X color="currentColor" size={20} />
              </button>
            </div>
            <Sidebar mobile onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
