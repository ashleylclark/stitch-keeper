import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { HouseHeart, PackageOpen, BookMarked, Spool } from 'lucide-react'

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

type PageProps = {
  title: string
  description: string
}

function Page({ title, description }: PageProps) {
  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-rose-500">Stitch Keeper</p>
        <h1 className="font-serif text-4xl tracking-tight text-stone-900 sm:text-5xl">{title}</h1>
        <p className="max-w-2xl text-base leading-7 text-stone-600">{description}</p>
      </div>
      <div className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_20px_70px_-35px_rgba(41,37,36,0.45)] backdrop-blur">
        <div className="rounded-[1.5rem] border border-dashed border-rose-200 bg-rose-50/60 px-6 py-10 text-stone-600">
          Content for this section will live here.
        </div>
      </div>
    </section>
  )
}

function Sidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Stitch Keeper</p>
        <h1 className="mt-3 font-serif text-2xl text-stone-900">Crochet HQ</h1>
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf7_0%,#f7f1eb_100%)] text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-80 shrink-0 overflow-hidden rounded-[2rem] border border-white/70 bg-rose-50/95 shadow-[0_30px_80px_-40px_rgba(41,37,36,0.4)] backdrop-blur lg:block">
          <Sidebar />
        </aside>

        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col rounded-[2rem] border border-white/70 bg-white/55 shadow-[0_30px_80px_-40px_rgba(41,37,36,0.35)] backdrop-blur">
          <header className="flex items-center justify-between border-b border-stone-200/70 px-5 py-4 sm:px-8 lg:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Workspace</p>
              <p className="mt-1 text-sm text-stone-600">Organize your crochet world.</p>
            </div>
            <button
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm transition hover:border-rose-200 hover:text-stone-900 lg:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            </button>
          </header>

          <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <Outlet />
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                  <path d="M6 6l12 12" />
                  <path d="M18 6 6 18" />
                </svg>
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
        element: (
          <Page
            title="Home"
            description="Start here with a clean overview of your yarn stash, saved patterns, and current crochet projects."
          />
        ),
      },
      {
        path: 'stash',
        element: (
          <Page
            title="Stash"
            description="Track yarn details, colors, fiber content, and quantities so your stash is easy to browse and use."
          />
        ),
      },
      {
        path: 'patterns',
        element: (
          <Page
            title="Patterns"
            description="Keep your pattern library organized with one place for saved ideas, purchased files, and future makes."
          />
        ),
      },
      {
        path: 'projects',
        element: (
          <Page
            title="Projects"
            description="Manage works in progress and planned makes with room for notes, linked yarn, and next steps."
          />
        ),
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
