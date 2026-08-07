import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-sm bg-forest font-display text-sm text-ivory">
              S
            </span>
            <span className="font-display text-lg text-forest">SpotList</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link
              href="/admin"
              className="rounded-sm px-3 py-1.5 text-muted transition-colors hover:bg-ivory hover:text-ink"
            >
              Landlords
            </Link>
            <Link
              href="/admin/inquiries"
              className="rounded-sm px-3 py-1.5 text-muted transition-colors hover:bg-ivory hover:text-ink"
            >
              Requests
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10 print:max-w-none print:p-0">{children}</main>
    </div>
  )
}
