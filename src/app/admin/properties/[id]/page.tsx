import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { landlords, properties, listings, inquiries } from '@/db/schema'
import {
  updateProperty,
  deleteProperty,
  createListing,
  updateListing,
  deleteListing,
  toggleListingAvailability,
  updateInquiryStatus,
} from '@/lib/actions'
import { getAppUrl, publicListingPath } from '@/lib/appUrl'
import { qrSvg } from '@/lib/qr'
import { Disclosure } from '@/components/Disclosure'
import { EmptyState } from '@/components/EmptyState'
import { CopyLink } from '@/components/CopyLink'

export const dynamic = 'force-dynamic'

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [property] = await db
    .select({
      id: properties.id,
      kind: properties.kind,
      name: properties.name,
      address: properties.address,
      description: properties.description,
      imageUrl: properties.image_url,
      publicId: properties.public_id,
      landlordId: landlords.id,
      landlordName: landlords.name,
      contactName: landlords.contact_name,
      contactEmail: landlords.contact_email,
    })
    .from(properties)
    .innerJoin(landlords, eq(landlords.id, properties.landlord_id))
    .where(eq(properties.id, id))
    .limit(1)

  if (!property) notFound()

  const [units, requests, appUrl] = await Promise.all([
    db
      .select()
      .from(listings)
      .where(eq(listings.property_id, id))
      .orderBy(asc(listings.sort_order), asc(listings.created_at)),
    db
      .select()
      .from(inquiries)
      .where(eq(inquiries.property_id, id))
      .orderBy(desc(inquiries.created_at))
      .limit(25),
    getAppUrl(),
  ])

  const publicUrl = `${appUrl}${publicListingPath(property.publicId)}`
  const qr = await qrSvg(publicUrl)
  const unitWord = property.kind === 'parking' ? 'spot' : 'unit'

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/landlords/${property.landlordId}`}
          className="text-sm font-medium text-muted hover:text-ink"
        >
          ← {property.landlordName}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-normal">{property.name}</h1>
          <span className="rounded-sm border border-line bg-ivory px-2.5 py-1 text-xs font-semibold text-muted">
            {property.kind === 'parking' ? 'Parking' : 'Building'}
          </span>
        </div>
        {property.address && <p className="mt-1 text-sm text-muted">{property.address}</p>}
      </div>

      {/* ── QR code ─────────────────────────────────────────────────────── */}
      <section className="card flex flex-col gap-6 px-6 py-6 sm:flex-row sm:items-start">
        <div className="mx-auto w-40 shrink-0 border border-line bg-white p-3">
          <div
            className="[&>svg]:block [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="font-display text-xl font-normal">Public availability page</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Post this QR code at the {property.kind === 'parking' ? 'lot' : 'entrance'}. Scanning
              it opens the live list of available {unitWord}s and a request form that reaches{' '}
              {property.contactName}.
            </p>
          </div>
          <CopyLink url={publicUrl} />
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/properties/${property.id}/qr-sheet`} className="btn">
              Printable sheet
            </Link>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="btn-ghost">
              Open page
            </a>
            <a href={`/api/qr/${property.publicId}`} className="btn-ghost">
              PNG
            </a>
            <a href={`/api/qr/${property.publicId}?format=svg`} className="btn-ghost">
              SVG
            </a>
          </div>
        </div>
      </section>

      {/* ── Listings ────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-normal">
          Availability{' '}
          <span className="text-sm font-medium text-muted">
            ({units.filter((u) => u.available).length} of {units.length} available)
          </span>
        </h2>

        {units.length === 0 ? (
          <EmptyState
            title={`No ${unitWord}s listed yet`}
            hint={`Add the ${unitWord}s you want shown on the public page.`}
          />
        ) : (
          <ul className="space-y-3">
            {units.map((unit) => (
              <li key={unit.id} className="card overflow-hidden">
                <div className="flex items-start gap-4 px-5 py-4">
                  {unit.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={unit.image_url}
                      alt={unit.title}
                      className="h-16 w-16 shrink-0 rounded-sm border border-line object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{unit.title}</p>
                      <span
                        className={
                          unit.available
                            ? 'rounded-sm bg-open-soft px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-open'
                            : 'rounded-sm border border-line bg-ivory px-2.5 py-0.5 text-xs font-semibold text-muted'
                        }
                      >
                        {unit.available ? 'Available' : 'Taken'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {[unit.price, unit.available_from && `from ${unit.available_from}`]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                    {unit.description && (
                      <p className="mt-1 text-sm text-muted">{unit.description}</p>
                    )}
                  </div>
                  <form action={toggleListingAvailability} className="shrink-0">
                    <input type="hidden" name="id" value={unit.id} />
                    <input type="hidden" name="property_id" value={property.id} />
                    <button type="submit" className="btn-ghost">
                      Mark {unit.available ? 'taken' : 'available'}
                    </button>
                  </form>
                </div>

                <details className="border-t border-line">
                  <summary className="cursor-pointer list-none px-5 py-2.5 text-xs font-semibold text-muted marker:content-none hover:text-ink">
                    Edit
                  </summary>
                  <div className="border-t border-line px-5 py-5">
                    {/* Keyed on updated_at so the form remounts with fresh
                        defaults after any change to this listing — otherwise an
                        open panel keeps stale values (e.g. the availability
                        checkbox after "Mark taken") and saving reverts them. */}
                    <form
                      key={unit.updated_at.toISOString()}
                      action={updateListing}
                      className="grid gap-4 sm:grid-cols-2"
                    >
                      <input type="hidden" name="id" value={unit.id} />
                      <input type="hidden" name="property_id" value={property.id} />
                      <div className="sm:col-span-2">
                        <label className="label">Title</label>
                        <input name="title" required className="field" defaultValue={unit.title} />
                      </div>
                      <div>
                        <label className="label">Price</label>
                        <input name="price" className="field" defaultValue={unit.price ?? ''} />
                      </div>
                      <div>
                        <label className="label">Available from</label>
                        <input
                          name="available_from"
                          className="field"
                          defaultValue={unit.available_from ?? ''}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Description</label>
                        <textarea
                          name="description"
                          rows={2}
                          className="field"
                          defaultValue={unit.description ?? ''}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Photo URL</label>
                        <input
                          name="image_url"
                          inputMode="url"
                          className="field"
                          defaultValue={unit.image_url ?? ''}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
                        <input
                          type="checkbox"
                          name="available"
                          defaultChecked={unit.available}
                          className="h-4 w-4"
                        />
                        Show as available
                      </label>
                      <div className="sm:col-span-2">
                        <button type="submit" className="btn">
                          Save
                        </button>
                      </div>
                    </form>
                    <form action={deleteListing} className="mt-4 border-t border-line pt-4">
                      <input type="hidden" name="id" value={unit.id} />
                      <input type="hidden" name="property_id" value={property.id} />
                      <button type="submit" className="text-sm font-semibold text-red-600 hover:underline">
                        Delete {unitWord}
                      </button>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}

        <Disclosure summary={`Add ${unitWord}`} open={units.length === 0}>
          <form action={createListing} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="property_id" value={property.id} />
            <div className="sm:col-span-2">
              <label className="label" htmlFor="u-title">
                Title
              </label>
              <input
                id="u-title"
                name="title"
                required
                className="field"
                placeholder={property.kind === 'parking' ? 'Spot B12' : 'Apt 3B — 2 bedroom'}
              />
            </div>
            <div>
              <label className="label" htmlFor="u-price">
                Price (optional)
              </label>
              <input id="u-price" name="price" className="field" placeholder="$1,450 / mo" />
            </div>
            <div>
              <label className="label" htmlFor="u-from">
                Available from (optional)
              </label>
              <input id="u-from" name="available_from" className="field" placeholder="Sept 1" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="u-desc">
                Description (optional)
              </label>
              <textarea id="u-desc" name="description" rows={2} className="field" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="u-image">
                Photo URL (optional)
              </label>
              <input
                id="u-image"
                name="image_url"
                inputMode="url"
                className="field"
                placeholder="images.example.com/photo.jpg"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
              <input type="checkbox" name="available" defaultChecked className="h-4 w-4" />
              Show as available
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="btn">
                Add {unitWord}
              </button>
            </div>
          </form>
        </Disclosure>
      </section>

      {/* ── Requests ────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-normal">Recent requests</h2>
        {requests.length === 0 ? (
          <EmptyState
            title="No requests yet"
            hint={`They arrive here and by email to ${property.contactEmail}.`}
          />
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <InquiryRow key={r.id} inquiry={r} propertyId={property.id} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Settings ────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-display text-xl font-normal">Property settings</h2>
        <div className="card px-5 py-5">
          <form action={updateProperty} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={property.id} />
            <div>
              <label className="label">Type</label>
              <select name="kind" className="field" defaultValue={property.kind}>
                <option value="building">Building</option>
                <option value="parking">Parking lot</option>
              </select>
            </div>
            <div>
              <label className="label">Name</label>
              <input name="name" required className="field" defaultValue={property.name} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input name="address" className="field" defaultValue={property.address ?? ''} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea
                name="description"
                rows={2}
                className="field"
                defaultValue={property.description ?? ''}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Photo URL</label>
              <input
                name="image_url"
                inputMode="url"
                className="field"
                defaultValue={property.imageUrl ?? ''}
              />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn">
                Save changes
              </button>
            </div>
          </form>
          <form action={deleteProperty} className="mt-6 border-t border-line pt-4">
            <input type="hidden" name="id" value={property.id} />
            <button type="submit" className="text-sm font-semibold text-red-600 hover:underline">
              Delete this property
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

function InquiryRow({
  inquiry,
  propertyId,
}: {
  inquiry: typeof inquiries.$inferSelect
  propertyId: string
}) {
  return (
    <li className="card px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{inquiry.name}</p>
          <p className="text-sm text-muted">
            <a href={`mailto:${inquiry.email}`} className="hover:underline">
              {inquiry.email}
            </a>
            {inquiry.phone && ` · ${inquiry.phone}`}
          </p>
          {inquiry.message && <p className="mt-2 text-sm">{inquiry.message}</p>}
        </div>
        <form action={updateInquiryStatus} className="flex shrink-0 items-center gap-2">
          <input type="hidden" name="id" value={inquiry.id} />
          <input type="hidden" name="property_id" value={propertyId} />
          <select name="status" defaultValue={inquiry.status} className="field w-auto py-1.5">
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
        {inquiry.created_at.toLocaleString()}
        {inquiry.notified_at ? ' · emailed to contact' : ' · stored (no email provider configured)'}
      </p>
    </li>
  )
}
