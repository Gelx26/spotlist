import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { landlords, properties } from '@/db/schema'
import { getAppUrl, publicListingPath } from '@/lib/appUrl'
import { qrSvg } from '@/lib/qr'
import { PrintButton } from './PrintButton'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'QR sheet' }

export default async function QrSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [property] = await db
    .select({
      id: properties.id,
      kind: properties.kind,
      name: properties.name,
      address: properties.address,
      publicId: properties.public_id,
      landlordName: landlords.name,
      contactName: landlords.contact_name,
      contactPhone: landlords.contact_phone,
    })
    .from(properties)
    .innerJoin(landlords, eq(landlords.id, properties.landlord_id))
    .where(eq(properties.id, id))
    .limit(1)

  if (!property) notFound()

  const appUrl = await getAppUrl()
  const publicUrl = `${appUrl}${publicListingPath(property.publicId)}`
  // Printed under the code so someone without a working camera can still type it.
  const typedUrl = publicUrl.replace(/^https?:\/\//, '')
  const qr = await qrSvg(publicUrl)
  const unitWord = property.kind === 'parking' ? 'spots' : 'units'

  return (
    <>
      {/* Screen-only toolbar; hidden from the printed sheet. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/properties/${property.id}`} className="text-sm font-medium text-muted hover:text-ink">
          ← {property.name}
        </Link>
        <PrintButton />
      </div>

      <div className="sheet mx-auto max-w-xl border border-line bg-card print:max-w-none print:border-0">
        <div className="rule-brass bg-forest px-10 pt-12 pb-9 text-center text-ivory print:pt-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ivory/60">
            {property.landlordName}
          </p>
          <h1 className="mt-3 font-display text-[2.1rem] leading-tight font-normal">
            {property.name}
          </h1>
          {property.address && <p className="mt-2 text-sm text-ivory/70">{property.address}</p>}
        </div>

        <div className="px-10 py-10 text-center">
          <p className="font-display text-xl italic">Scan for current availability</p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
            See which {unitWord} are free right now and ask about them in under a minute.
          </p>

          <div className="mx-auto mt-8 w-64 border border-line bg-white p-5 [&>svg]:block [&>svg]:h-full [&>svg]:w-full">
            <div dangerouslySetInnerHTML={{ __html: qr }} />
          </div>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            or visit
          </p>
          <p className="mt-1 font-display text-base break-all">{typedUrl}</p>

          <div className="mx-auto mt-9 max-w-xs border-t border-line pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Enquiries</p>
            <p className="mt-1.5 text-sm font-semibold">{property.contactName}</p>
            {property.contactPhone && (
              <p className="text-sm text-muted tabular-nums">{property.contactPhone}</p>
            )}
          </div>
        </div>
      </div>

      <p className="mx-auto mt-4 max-w-xl text-center text-xs text-muted print:hidden">
        Prints to a single page. Set your printer to colour for the brass rule, or greyscale — the
        code scans either way.
      </p>
    </>
  )
}
