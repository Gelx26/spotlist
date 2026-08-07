import Link from 'next/link'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { landlords, properties } from '@/db/schema'
import { createLandlord } from '@/lib/actions'
import { Disclosure } from '@/components/Disclosure'
import { EmptyState } from '@/components/EmptyState'

export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  const rows = await db
    .select({
      id: landlords.id,
      name: landlords.name,
      contactName: landlords.contact_name,
      contactEmail: landlords.contact_email,
      propertyCount: sql<number>`count(${properties.id})`,
    })
    .from(landlords)
    .leftJoin(properties, eq(properties.landlord_id, landlords.id))
    .groupBy(landlords.id)
    .orderBy(desc(landlords.created_at))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-normal">Landlords</h1>
        <p className="mt-1 text-sm text-muted">
          Each landlord has a contact person who receives availability requests.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No landlords yet"
          hint="Add your first landlord profile below to get started."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map((l) => (
            <li key={l.id}>
              <Link
                href={`/admin/landlords/${l.id}`}
                className="card block px-5 py-4 transition-shadow hover:shadow-sm"
              >
                <p className="font-semibold">{l.name}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {l.contactName} · {l.contactEmail}
                </p>
                <p className="mt-3 inline-flex rounded-sm border border-line px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brass-deep">
                  {Number(l.propertyCount)}{' '}
                  {Number(l.propertyCount) === 1 ? 'property' : 'properties'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Disclosure summary="Add landlord" open={rows.length === 0}>
        <form action={createLandlord} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">
              Landlord / company name
            </label>
            <input id="name" name="name" required className="field" placeholder="Riverside Holdings" />
          </div>
          <div>
            <label className="label" htmlFor="contact_name">
              Contact person
            </label>
            <input id="contact_name" name="contact_name" required className="field" placeholder="Ana Kovač" />
          </div>
          <div>
            <label className="label" htmlFor="contact_email">
              Contact email
            </label>
            <input
              id="contact_email"
              name="contact_email"
              type="email"
              required
              className="field"
              placeholder="ana@riverside.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="contact_phone">
              Contact phone (optional)
            </label>
            <input id="contact_phone" name="contact_phone" className="field" placeholder="+1 555 0100" />
          </div>
          <div>
            <label className="label" htmlFor="notes">
              Internal notes (optional)
            </label>
            <input id="notes" name="notes" className="field" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn">
              Create landlord
            </button>
          </div>
        </form>
      </Disclosure>
    </div>
  )
}
