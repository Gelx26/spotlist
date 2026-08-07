type InquiryEmail = {
  to: string
  contactName: string
  propertyName: string
  propertyKind: 'building' | 'parking'
  listingTitle?: string | null
  from: { name: string; email: string; phone?: string | null; message?: string | null }
  adminUrl: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Emails the landlord's contact person about a new availability request.
 *
 * Returns false (without throwing) when no email provider is configured — the
 * request is always persisted, so an unconfigured provider degrades to
 * "read it in the admin inbox" rather than losing the lead.
 */
export async function sendInquiryEmail(input: InquiryEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return false

  const sender = process.env.INQUIRY_FROM_EMAIL ?? 'onboarding@resend.dev'
  const what = input.listingTitle
    ? `${input.listingTitle} at ${input.propertyName}`
    : input.propertyName
  const subject = `New availability request — ${what}`

  const rows: Array<[string, string]> = [
    ['Name', input.from.name],
    ['Email', input.from.email],
    ['Phone', input.from.phone || '—'],
    [input.propertyKind === 'parking' ? 'Parking lot' : 'Building', input.propertyName],
    ['Unit', input.listingTitle || 'Any available'],
    ['Message', input.from.message || '—'],
  ]

  const html = `
    <div style="font-family:ui-sans-serif,-apple-system,Segoe UI,sans-serif;color:#111827;max-width:560px">
      <h2 style="margin:0 0 4px">New availability request</h2>
      <p style="margin:0 0 20px;color:#64748b">Hi ${escapeHtml(input.contactName)}, someone scanned the QR code for ${escapeHtml(input.propertyName)}.</p>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:8px 12px 8px 0;color:#64748b;font-size:13px;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:8px 0;font-size:14px">${escapeHtml(v)}</td></tr>`,
          )
          .join('')}
      </table>
      <p style="margin:24px 0 0">
        <a href="${input.adminUrl}" style="background:#0b3b5c;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Open in SpotList</a>
      </p>
    </div>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: sender,
        to: [input.to],
        reply_to: input.from.email,
        subject,
        html,
      }),
    })
    if (!res.ok) {
      console.error('[notify] resend failed', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('[notify] resend threw', err)
    return false
  }
}
