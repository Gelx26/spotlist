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
      <header className="bg-brand text-white">
        <div className="mx-auto max-w-2xl px-5 pt-10 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
            {property.landlordName}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{property.name}</h1>
          {property.address && <p className="mt-1 text-white/70">{property.address}</p>}
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold">
            <span
              className={`h-2 w-2 rounded-full ${available.length > 0 ? 'bg-emerald-400' : 'bg-white/40'}`}
            />
            {available.length > 0
              ? `${available.length} ${unitWord}${available.length === 1 ? '' : 's'} available`
              : 'Currently full'}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-6 px-5 py-8">
        {property.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.imageUrl}
            alt={property.name}
            className="h-52 w-full rounded-xl object-cover"
          />
        )}

        {property.description && <p className="text-muted">{property.description}</p>}

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Available now</h2>
          {available.length === 0 ? (
            <div className="card px-5 py-8 text-center">
              <p className="font-semibold">Nothing available right now</p>
              <p className="mt-1 text-sm text-muted">
                Send a request below and {property.contactName} will let you know when something
                opens up.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {available.map((unit) => (
                <li key={unit.id} className="card flex items-start gap-4 px-5 py-4">
                  {unit.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={unit.image_url}
                      alt={unit.title}
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold">{unit.title}</p>
                    {(unit.price || unit.available_from) && (
                      <p className="mt-0.5 text-sm font-medium text-brand">
                        {[unit.price, unit.available_from && `from ${unit.available_from}`]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                    {unit.description && (
                      <p className="mt-1 text-sm text-muted">{unit.description}</p>
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

        <p className="pb-6 text-center text-xs text-muted">Powered by SpotList</p>
      </div>
    </div>
  )
}
