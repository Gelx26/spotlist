export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card px-5 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  )
}
