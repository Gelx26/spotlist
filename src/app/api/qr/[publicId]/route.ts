import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { getAppUrl, publicListingPath } from '@/lib/appUrl'
import { qrPng, qrSvg } from '@/lib/qr'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await params

  const [property] = await db
    .select({ name: properties.name })
    .from(properties)
    .where(eq(properties.public_id, publicId))
    .limit(1)

  if (!property) return new Response('Not found', { status: 404 })

  const target = `${await getAppUrl()}${publicListingPath(publicId)}`
  const slug = property.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'qr'
  const format = new URL(request.url).searchParams.get('format') === 'svg' ? 'svg' : 'png'

  if (format === 'svg') {
    return new Response(await qrSvg(target), {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="${slug}-qr.svg"`,
      },
    })
  }

  const png = await qrPng(target)
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${slug}-qr.png"`,
    },
  })
}
