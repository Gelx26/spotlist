import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-brand">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-sm text-white">
              S
            </span>
            SpotList
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link href="/admin" className="rounded-lg px-3 py-1.5 text-muted hover:bg-canvas hover:text-ink">
              Landlords
            </Link>
            <Link
              href="/admin/inquiries"
              className="rounded-lg px-3 py-1.5 text-muted hover:bg-canvas hover:text-ink"
            >
              Requests
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  )
}
