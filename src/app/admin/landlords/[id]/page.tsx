import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { landlords, properties, listings } from '@/db/schema'
import { updateLandlord, deleteLandlord, createProperty } from '@/lib/actions'
import { Disclosure } from '@/components/Disclosure'
import { EmptyState } from '@/components/EmptyState'
import { ImageUpload } from '@/components/ImageUpload'

export const dynamic = 'force-dynamic'

export default async function LandlordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [landlord] = await db.select().from(landlords).where(eq(landlords.id, id)).limit(1)
  if (!landlord) notFound()

  const props = await db
    .select({
      id: properties.id,
      kind: properties.kind,
      name: properties.name,
      address: properties.address,
      publicId: properties.public_id,
      total: sql<number>`count(${listings.id})`,
      open: sql<number>`count(${listings.id}) filter (where ${listings.status} = 'available')`,
      soon: sql<number>`count(${listings.id}) filter (where ${listings.status} = 'coming_soon')`,
    })
    .from(properties)
    .leftJoin(listings, eq(listings.property_id, properties.id))
    .where(eq(properties.landlord_id, id))
    .groupBy(properties.id)
    .orderBy(asc(properties.created_at))

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm font-medium text-muted hover:text-ink">
          ← All landlords
        </Link>
        <h1 className="mt-2 font-display text-3xl font-normal">{landlord.name}</h1>
        <p className="mt-1 text-sm text-muted">
          Requests go to {landlord.contact_name} ({landlord.contact_email})
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-normal">Buildings &amp; parking</h2>

        {props.length === 0 ? (
          <EmptyState
            title="Nothing added yet"
            hint="Add a building or a parking lot to generate its QR code."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {props.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/properties/${p.id}`}
                  className="card block px-5 py-4 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      {p.address && <p className="mt-0.5 text-sm text-muted">{p.address}</p>}
                    </div>
                    <span className="shrink-0 rounded-sm border border-line bg-ivory px-2.5 py-1 text-xs font-semibold text-muted">
                      {p.kind === 'parking' ? 'Parking' : 'Building'}
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-brass-deep">
                    {Number(p.open)} of {Number(p.total)} available
                    {Number(p.soon) > 0 && ` · ${Number(p.soon)} coming soon`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Disclosure summary="Add building or parking lot" open={props.length === 0}>
          <form action={createProperty} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="landlord_id" value={landlord.id} />
            <div>
              <label className="label" htmlFor="kind">
                Type
              </label>
              <select id="kind" name="kind" className="field" defaultValue="building">
                <option value="building">Building</option>
                <option value="parking">Parking lot</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-name">
                Name
              </label>
              <input id="p-name" name="name" required className="field" placeholder="Maple Court" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="p-address">
                Address (optional)
              </label>
              <input id="p-address" name="address" className="field" placeholder="12 Maple St" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="p-description">
                Description (optional)
              </label>
              <textarea id="p-description" name="description" rows={2} className="field" />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload name="image_url" label="Photo (optional)" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn">
                Add
              </button>
            </div>
          </form>
        </Disclosure>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-normal">Profile &amp; contact</h2>
        <div className="card px-5 py-5">
          <form action={updateLandlord} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="id" value={landlord.id} />
            <div className="sm:col-span-2">
              <label className="label" htmlFor="l-name">
                Landlord / company name
              </label>
              <input id="l-name" name="name" required className="field" defaultValue={landlord.name} />
            </div>
            <div>
              <label className="label" htmlFor="l-contact">
                Contact person
              </label>
              <input
                id="l-contact"
                name="contact_name"
                required
                className="field"
                defaultValue={landlord.contact_name}
              />
            </div>
            <div>
              <label className="label" htmlFor="l-email">
                Contact email
              </label>
              <input
                id="l-email"
                name="contact_email"
                type="email"
                required
                className="field"
                defaultValue={landlord.contact_email}
              />
            </div>
            <div>
              <label className="label" htmlFor="l-phone">
                Contact phone
              </label>
              <input
                id="l-phone"
                name="contact_phone"
                className="field"
                defaultValue={landlord.contact_phone ?? ''}
              />
            </div>
            <div>
              <label className="label" htmlFor="l-notes">
                Internal notes
              </label>
              <input id="l-notes" name="notes" className="field" defaultValue={landlord.notes ?? ''} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn">
                Save changes
              </button>
            </div>
          </form>

          <form action={deleteLandlord} className="mt-6 border-t border-line pt-4">
            <input type="hidden" name="id" value={landlord.id} />
            <button
              type="submit"
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              Delete landlord and everything under it
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
