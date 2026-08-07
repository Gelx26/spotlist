/**
 * Collapsible section built on <details> so "add new" forms stay out of the
 * way without needing client-side state.
 */
export function Disclosure({
  summary,
  children,
  open = false,
}: {
  summary: string
  children: React.ReactNode
  open?: boolean
}) {
  return (
    <details open={open} className="card group overflow-hidden">
      <summary className="cursor-pointer list-none px-6 py-4 text-sm font-semibold text-forest marker:content-none">
        <span className="inline-flex items-center gap-2.5">
          <span className="grid h-5 w-5 place-items-center rounded-sm border border-brass/50 text-brass-deep transition-transform group-open:rotate-45">
            +
          </span>
          {summary}
        </span>
      </summary>
      <div className="border-t border-line px-6 py-6">{children}</div>
    </details>
  )
}
