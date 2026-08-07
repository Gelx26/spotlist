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
      <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-semibold text-brand marker:content-none">
        <span className="inline-flex items-center gap-2">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-soft text-brand transition-transform group-open:rotate-45">
            +
          </span>
          {summary}
        </span>
      </summary>
      <div className="border-t border-line px-5 py-5">{children}</div>
    </details>
  )
}
