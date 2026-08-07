export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-display text-lg">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{hint}</p>}
    </div>
  )
}
