import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BookMarked,
  HouseHeart,
  LogIn,
  LogOut,
  Menu,
  PackageOpen,
  Settings,
  Spool,
  UserRound,
  UserPlus,
  X,
} from 'lucide-react';
import { useAppData } from '../state/app-data';

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
  {
    label: 'Settings',
    to: '/settings',
    icon: <Settings color="currentColor" size={20} />,
  },
];

function Sidebar({
  mobile = false,
  onNavigate,
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 px-4 py-7">
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

function AuthPanel() {
  const { authSettings, login, register } = useAppData();
  const shouldSkipOidcRedirect =
    new URLSearchParams(window.location.search).get('loggedOut') === 'true';
  const [mode, setMode] = useState<'login' | 'register'>(
    authSettings.registrationEnabled ? 'register' : 'login',
  );
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegistering = mode === 'register';

  useEffect(() => {
    if (authSettings.oidcEnabled && !shouldSkipOidcRedirect) {
      window.location.assign('/auth/oidc/login');
    }
  }, [authSettings.oidcEnabled, shouldSkipOidcRedirect]);

  if (authSettings.oidcEnabled && !shouldSkipOidcRedirect) {
    return (
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500 dark:text-rose-300">
          Welcome
        </p>
        <h1 className="font-serif text-3xl text-stone-900 dark:text-stone-100">
          Redirecting to sign in...
        </h1>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (isRegistering) {
        await register({ email, displayName, password });
      } else {
        await login({ email, password });
      }
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'Authentication failed.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="login"
      className="mx-auto flex w-full max-w-5xl flex-col gap-6"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500 dark:text-rose-300">
          Welcome
        </p>
        <h1 className="mt-3 font-serif text-3xl text-stone-900 dark:text-stone-100">
          {isRegistering ? 'Create your workspace' : 'Log in to your workspace'}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-4"
      >
        {isRegistering ? (
          <label className="flex flex-col gap-2 text-sm font-medium text-stone-700 dark:text-stone-200">
            Name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-12 rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-rose-500 dark:focus:ring-rose-950/60"
              autoComplete="name"
              required
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-700 dark:text-stone-200">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-rose-500 dark:focus:ring-rose-950/60"
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-700 dark:text-stone-200">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 rounded-2xl border border-stone-200 bg-white px-4 text-base text-stone-900 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-rose-500 dark:focus:ring-rose-950/60"
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            minLength={isRegistering ? 12 : undefined}
            required
          />
        </label>

        {formError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-100">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-rose-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-700 dark:hover:bg-rose-600"
          >
            {isRegistering ? (
              <UserPlus color="currentColor" size={18} />
            ) : (
              <LogIn color="currentColor" size={18} />
            )}
            <span>{isRegistering ? 'Create account' : 'Log in'}</span>
          </button>
          {authSettings.registrationEnabled ? (
            <button
              type="button"
              onClick={() =>
                setMode((current) =>
                  current === 'login' ? 'register' : 'login',
                )
              }
              className="inline-flex h-12 items-center rounded-2xl border border-stone-200 bg-white px-5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-rose-200 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-rose-400 dark:hover:text-stone-50"
            >
              {isRegistering ? 'Log in instead' : 'Create account'}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

export function AppShell() {
  const { authStatus, session, isLoading, error, logout } = useAppData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf7_0%,#f7f1eb_100%)] text-stone-900 dark:bg-[linear-gradient(180deg,#1c1917_0%,#292524_100%)] dark:text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:max-w-[1500px] lg:px-8">
        <aside className="hidden w-80 shrink-0 overflow-hidden rounded-[2rem] border border-white/70 bg-rose-50/95 shadow-[0_30px_80px_-40px_rgba(41,37,36,0.4)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/95 dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.65)] lg:block">
          <Sidebar />
        </aside>

        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[2rem] border border-white/70 bg-white/55 shadow-[0_30px_80px_-40px_rgba(41,37,36,0.35)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/70 dark:shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)]">
          <header className="flex items-center justify-between gap-4 border-b border-stone-200/70 px-5 py-4 dark:border-stone-800 sm:px-8 lg:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rose-500 dark:text-rose-300 sm:text-sm sm:tracking-[0.35em]">
              Stitch Keeper
            </p>
            <div className="flex items-center gap-3">
              {authStatus === 'authenticated' && session ? (
                <div className="hidden items-center gap-3 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 shadow-sm dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 sm:flex">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-stone-800 dark:text-rose-300">
                    <UserRound color="currentColor" size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-stone-900 dark:text-stone-100">
                      {session.user.displayName}
                    </span>
                    <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                      {session.activeHousehold.name}
                    </span>
                  </span>
                </div>
              ) : null}
              {authStatus === 'unauthenticated' ? (
                <a
                  href="#login"
                  className="inline-flex h-11 items-center gap-2 rounded-2xl border border-rose-200 bg-rose-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 dark:border-rose-700 dark:bg-rose-700 dark:hover:bg-rose-600"
                >
                  <LogIn color="currentColor" size={18} />
                  <span>Log in</span>
                </a>
              ) : null}
              {authStatus === 'authenticated' ? (
                <button
                  type="button"
                  aria-label="Log out"
                  onClick={async () => {
                    await logout();
                    window.history.replaceState(null, '', '/?loggedOut=true');
                  }}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-rose-200 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-rose-400 dark:hover:text-stone-50"
                >
                  <LogOut color="currentColor" size={20} />
                </button>
              ) : null}
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
            {authStatus === 'unauthenticated' ? (
              <AuthPanel />
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
