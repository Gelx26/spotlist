'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitInquiry, type InquiryResult } from '@/lib/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn mt-1 w-full py-3 disabled:opacity-60">
      {pending ? 'Sending…' : 'Send request'}
    </button>
  )
}

export function RequestForm({
  publicId,
  units,
  contactName,
}: {
  publicId: string
  units: Array<{ id: string; title: string }>
  contactName: string
}) {
  const [state, formAction] = useActionState<InquiryResult | null, FormData>(submitInquiry, null)

  if (state?.ok) {
    return (
      <div className="card px-6 py-10 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-brass/60 text-lg text-brass-deep">
          ✓
        </div>
        <p className="mt-4 font-display text-lg">Request sent</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {contactName} will get back to you at the email you provided.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="card space-y-4 px-6 py-6">
      <div>
        <h2 className="font-display text-lg font-normal">Request availability</h2>
        <p className="mt-1 text-sm text-muted">Goes straight to {contactName}.</p>
      </div>

      <input type="hidden" name="public_id" value={publicId} />
      {/* Honeypot — hidden from people, tempting to bots. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {units.length > 0 && (
        <div>
          <label className="label" htmlFor="listing_id">
            Interested in
          </label>
          <select id="listing_id" name="listing_id" className="field" defaultValue="">
            <option value="">Any available</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label" htmlFor="name">
          Your name
        </label>
        <input id="name" name="name" required className="field" autoComplete="name" />
      </div>

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="field" autoComplete="email" />
      </div>

      <div>
        <label className="label" htmlFor="phone">
          Phone (optional)
        </label>
        <input id="phone" name="phone" type="tel" className="field" autoComplete="tel" />
      </div>

      <div>
        <label className="label" htmlFor="message">
          Message (optional)
        </label>
        <textarea id="message" name="message" rows={3} className="field" />
      </div>

      {state?.error && (
        <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  )
}
