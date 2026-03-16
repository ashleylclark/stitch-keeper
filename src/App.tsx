import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { HouseHeart, PackageOpen, BookMarked, Spool, Menu, X } from 'lucide-react'
import { AppDataProvider } from './context/AppDataContext'
import { useAppData } from './context/app-data'
import Home from './pages/Home'
import Stash from './pages/Stash'
import Patterns from './pages/Patterns'
import PatternDetail from './pages/PatternDetail'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'

type NavItem = {
  label: string
  to: string
  icon: ReactNode
}

const navItems: NavItem[] = [
  {
    label: 'Home',
    to: '/',
    icon: (
      <HouseHeart color="currentColor" size={20} />
    ),
  },
  {
    label: 'Stash',
    to: '/stash',
    icon: (
      <Spool color="currentColor" size={20} />
    ),
  },
  {
    label: 'Patterns',
    to: '/patterns',
    icon: (
      <BookMarked color="currentColor" size={20} />
    ),
  },
  {
    label: 'Projects',
    to: '/projects',
    icon: (
      <PackageOpen color="currentColor" size={20} />
    ),
  },
]

function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Stitch Keeper</p>
        <h1 className="mt-3 font-serif text-2xl text-stone-900">Fiber Arts HQ</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Keep yarn, patterns, and works in progress in one place.
        </p>
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
                      ? 'bg-rose-200 text-white shadow-lg shadow-stone-900/10'
                      : 'text-stone-600 hover:bg-rose-50 hover:text-stone-900',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={[
                        'flex h-10 w-10 items-center justify-center rounded-xl transition',
                        isActive ? 'bg-white/15' : mobile ? 'bg-white/70' : 'bg-white/90',
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
  )
}

function AppShell() {
  const { isLoading, error } = useAppData()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf7_0%,#f7f1eb_100%)] text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl lg:max-w-[1500px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-80 shrink-0 overflow-hidden rounded-[2rem] border border-white/70 bg-rose-50/95 shadow-[0_30px_80px_-40px_rgba(41,37,36,0.4)] backdrop-blur lg:block">
          <Sidebar />
        </aside>

        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[2rem] border border-white/70 bg-white/55 shadow-[0_30px_80px_-40px_rgba(41,37,36,0.35)] backdrop-blur">
          <header className="flex items-center justify-between border-b border-stone-200/70 px-5 py-4 sm:px-8 lg:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Workspace</p>
              <p className="mt-1 text-sm text-stone-600">Organize your fiber arts world.</p>
            </div>
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-rose-200 hover:text-stone-900 lg:hidden"
            >
              <Menu color="currentColor" size={20} />
            </button>
          </header>

          <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            {isLoading ? (
              <section className="mx-auto flex w-full max-w-5xl flex-col gap-4">
                <h1 className="font-serif text-3xl text-stone-900">Loading your fiber data...</h1>
                <p className="text-base text-stone-600">Reading stash, patterns, and projects from the API.</p>
              </section>
            ) : error ? (
              <section className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-[2rem] border border-rose-200 bg-rose-50 p-6">
                <h1 className="font-serif text-3xl text-stone-900">Could not load app data</h1>
                <p className="text-base text-stone-700">{error}</p>
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
            className="flex-1 bg-stone-950/30 backdrop-blur-[2px]"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="h-full w-[18.5rem] max-w-[85vw] border-l border-white/70 bg-[#f6ede6] shadow-2xl">
            <div className="flex items-center justify-end px-4 py-4">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-rose-200 hover:text-stone-900"
              >
                <X color="currentColor" size={20} />
              </button>
            </div>
            <Sidebar mobile onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'stash',
        element: <Stash />,
      },
      {
        path: 'patterns',
        element: <Patterns />,
      },
      {
        path: 'patterns/:patternId',
        element: <PatternDetail />,
      },
      {
        path: 'projects',
        element: <Projects />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectDetail />,
      },
    ],
  },
])

function App() {
  return (
    <AppDataProvider>
      <RouterProvider router={router} />
    </AppDataProvider>
  )
}

export default App
