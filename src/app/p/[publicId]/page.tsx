import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { landlords, properties, listings } from '@/db/schema'
import { RequestForm } from './RequestForm'

export const dynamic = 'force-dynamic'

async function getProperty(publicId: string) {
  const [row] = await db
    .select({
      id: properties.id,
      kind: properties.kind,
      name: properties.name,
      address: properties.address,
      description: properties.description,
      imageUrl: properties.image_url,
      landlordName: landlords.name,
      contactName: landlords.contact_name,
    })
    .from(properties)
    .innerJoin(landlords, eq(landlords.id, properties.landlord_id))
    .where(eq(properties.public_id, publicId))
    .limit(1)
  return row
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>
}): Promise<Metadata> {
  const { publicId } = await params
  const property = await getProperty(publicId)
  if (!property) return { title: 'Not found' }
  return {
    title: `${property.name} — availability`,
    description: property.description ?? `Current availability at ${property.name}.`,
  }
}

export default async function PublicPropertyPage({
  params,
}: {
  params: Promise<{ publicId: string }>
}) {
  const { publicId } = await params
  const property = await getProperty(publicId)
  if (!property) notFound()

  const units = await db
    .select()
    .from(listings)
    .where(eq(listings.property_id, property.id))
    .orderBy(asc(listings.sort_order), asc(listings.created_at))

  const available = units.filter((u) => u.available)
  const unitWord = property.kind === 'parking' ? 'spot' : 'unit'

  return (
    <div className="min-h-screen">
      {/* The plaque itself: engraved forest ground, brass rule beneath. */}
      <header className="rule-brass bg-forest text-ivory">
        <div className="mx-auto max-w-2xl px-6 pt-12 pb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ivory/60">
            {property.landlordName}
          </p>
          <h1 className="mt-3 font-display text-[2rem] leading-[1.12] font-normal">
            {property.name}
          </h1>
          {property.address && <p className="mt-2 text-sm text-ivory/70">{property.address}</p>}

          <p className="mt-7 border-y border-brass/45 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-brass">
            {available.length > 0
              ? `${available.length} ${unitWord}${available.length === 1 ? '' : 's'} available`
              : 'Currently full'}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-7 px-6 py-9">
        {property.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.imageUrl}
            alt={property.name}
            className="h-56 w-full rounded-sm border border-line object-cover"
          />
        )}

        {property.description && (
          <p className="leading-relaxed text-muted">{property.description}</p>
        )}

        <section className="space-y-4">
          <h2 className="font-display text-lg font-normal italic">Available now</h2>

          {available.length === 0 ? (
            <div className="card px-6 py-10 text-center">
              <p className="font-display text-lg">Nothing available right now</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                Send a request below and {property.contactName} will let you know when something
                opens up.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {available.map((unit) => (
                <li key={unit.id} className="card flex items-start gap-5 px-6 py-5">
                  {unit.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={unit.image_url}
                      alt={unit.title}
                      className="h-20 w-20 shrink-0 rounded-sm border border-line object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold">{unit.title}</p>
                    {(unit.price || unit.available_from) && (
                      <p className="mt-1 font-display text-base italic text-brass-deep tabular-nums">
                        {[unit.price, unit.available_from && `from ${unit.available_from}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    {unit.description && (
                      <p className="mt-2 text-sm leading-relaxed text-muted">{unit.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <RequestForm
          publicId={publicId}
          units={available.map((u) => ({ id: u.id, title: u.title }))}
          contactName={property.contactName}
        />

        <p className="pb-8 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/70">
          Powered by SpotList
        </p>
      </div>
    </div>
  )
}
