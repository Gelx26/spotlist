import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { inquiries, properties, listings, landlords } from '@/db/schema'
import { updateInquiryStatus } from '@/lib/actions'
import { EmptyState } from '@/components/EmptyState'

export const dynamic = 'force-dynamic'

export default async function InquiriesPage() {
  const rows = await db
    .select({
      id: inquiries.id,
      name: inquiries.name,
      email: inquiries.email,
      phone: inquiries.phone,
      message: inquiries.message,
      status: inquiries.status,
      notifiedAt: inquiries.notified_at,
      createdAt: inquiries.created_at,
      propertyId: properties.id,
      propertyName: properties.name,
      landlordName: landlords.name,
      listingTitle: listings.title,
    })
    .from(inquiries)
    .innerJoin(properties, eq(properties.id, inquiries.property_id))
    .innerJoin(landlords, eq(landlords.id, properties.landlord_id))
    .leftJoin(listings, eq(listings.id, inquiries.listing_id))
    .orderBy(desc(inquiries.created_at))
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Availability requests</h1>
        <p className="mt-1 text-sm text-muted">Everything submitted from the public QR pages.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No requests yet"
          hint="Requests appear here as soon as someone submits the form on a public page."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="card px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-sm text-muted">
                    <a href={`mailto:${r.email}`} className="hover:underline">
                      {r.email}
                    </a>
                    {r.phone && ` · ${r.phone}`}
                  </p>
                  <p className="mt-2 text-sm">
                    <Link href={`/admin/properties/${r.propertyId}`} className="font-medium text-brand hover:underline">
                      {r.propertyName}
                    </Link>
                    <span className="text-muted">
                      {' '}
                      · {r.landlordName} · {r.listingTitle ?? 'any available'}
                    </span>
                  </p>
                  {r.message && <p className="mt-2 text-sm">{r.message}</p>}
                </div>
                <form action={updateInquiryStatus} className="flex shrink-0 items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="property_id" value={r.propertyId} />
                  <select name="status" defaultValue={r.status} className="field w-auto py-1.5">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button type="submit" className="btn-ghost py-1.5">
                    Update
                  </button>
                </form>
              </div>
              <p className="mt-3 text-xs text-muted">
                {r.createdAt.toLocaleString()}
                {r.notifiedAt ? ' · emailed to contact' : ' · stored (no email provider configured)'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
