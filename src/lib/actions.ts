'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { landlords, properties, listings, inquiries } from '@/db/schema'
import { del } from '@vercel/blob'
import { generatePublicId } from './ids'
import { getAppUrl } from './appUrl'
import { sendInquiryEmail } from './notify'
import { requireAdmin } from './session'

// ─── Form helpers ──────────────────────────────────────────────────────────

function text(fd: FormData, key: string): string {
  const v = fd.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

function optional(fd: FormData, key: string): string | null {
  return text(fd, key) || null
}

function required(fd: FormData, key: string, label: string): string {
  const v = text(fd, key)
  if (!v) throw new Error(`${label} is required`)
  return v
}

/**
 * Photo URLs are typed/pasted by hand, so a missing scheme is the norm rather
 * than the exception ("images.example.com/a.jpg"). Assume https:// when none is
 * given. These inputs are deliberately plain text — an <input type="url"> lets
 * the browser silently block the whole form, which reads as "save is broken".
 */
function optionalUrl(fd: FormData, key: string): string | null {
  const raw = text(fd, key)
  if (!raw) return null

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null
  } catch {
    return null
  }
}

type ListingStatus = 'available' | 'coming_soon' | 'taken'

function listingStatus(fd: FormData): ListingStatus {
  const raw = text(fd, 'status')
  return raw === 'coming_soon' || raw === 'taken' ? raw : 'available'
}


/**
 * Removes a photo from blob storage once nothing points at it any more.
 *
 * Only touches our own blob host — early listings used pasted external URLs and
 * those must never be "deleted". Failures are swallowed: an orphaned blob is a
 * far better outcome than a save that appears to fail.
 */
async function discardPhoto(url: string | null | undefined) {
  if (!url) return
  try {
    if (!new URL(url).hostname.endsWith('.public.blob.vercel-storage.com')) return
    await del(url)
  } catch (err) {
    console.error('[blob] could not delete', url, err)
  }
}

async function listingPhoto(id: string) {
  const [row] = await db
    .select({ url: listings.image_url })
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1)
  return row?.url ?? null
}

// ─── Landlords ─────────────────────────────────────────────────────────────

export async function createLandlord(fd: FormData) {
  await requireAdmin()
  const [row] = await db
    .insert(landlords)
    .values({
      name: required(fd, 'name', 'Landlord name'),
      contact_name: required(fd, 'contact_name', 'Contact name'),
      contact_email: required(fd, 'contact_email', 'Contact email'),
      contact_phone: optional(fd, 'contact_phone'),
      notes: optional(fd, 'notes'),
    })
    .returning({ id: landlords.id })

  revalidatePath('/admin')
  redirect(`/admin/landlords/${row.id}`)
}

export async function updateLandlord(fd: FormData) {
  await requireAdmin()
  const id = required(fd, 'id', 'Landlord id')
  await db
    .update(landlords)
    .set({
      name: required(fd, 'name', 'Landlord name'),
      contact_name: required(fd, 'contact_name', 'Contact name'),
      contact_email: required(fd, 'contact_email', 'Contact email'),
      contact_phone: optional(fd, 'contact_phone'),
      notes: optional(fd, 'notes'),
      updated_at: new Date(),
    })
    .where(eq(landlords.id, id))

  revalidatePath('/admin')
  revalidatePath(`/admin/landlords/${id}`)
}

export async function deleteLandlord(fd: FormData) {
  await requireAdmin()
  const id = required(fd, 'id', 'Landlord id')
  await db.delete(landlords).where(eq(landlords.id, id))
  revalidatePath('/admin')
  redirect('/admin')
}

// ─── Properties ────────────────────────────────────────────────────────────

export async function createProperty(fd: FormData) {
  await requireAdmin()
  const landlordId = required(fd, 'landlord_id', 'Landlord')
  const kind = text(fd, 'kind') === 'parking' ? 'parking' : 'building'

  const [row] = await db
    .insert(properties)
    .values({
      landlord_id: landlordId,
      kind,
      name: required(fd, 'name', 'Name'),
      address: optional(fd, 'address'),
      description: optional(fd, 'description'),
      image_url: optionalUrl(fd, 'image_url'),
      public_id: generatePublicId(),
    })
    .returning({ id: properties.id })

  revalidatePath(`/admin/landlords/${landlordId}`)
  redirect(`/admin/properties/${row.id}`)
}

export async function updateProperty(fd: FormData) {
  await requireAdmin()
  const id = required(fd, 'id', 'Property id')
  const kind = text(fd, 'kind') === 'parking' ? 'parking' : 'building'

  const [before] = await db
    .select({ url: properties.image_url })
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1)
  const nextImage = optionalUrl(fd, 'image_url')

  const [row] = await db
    .update(properties)
    .set({
      kind,
      name: required(fd, 'name', 'Name'),
      address: optional(fd, 'address'),
      description: optional(fd, 'description'),
      image_url: nextImage,
      updated_at: new Date(),
    })
    .where(eq(properties.id, id))
    .returning({ publicId: properties.public_id, landlordId: properties.landlord_id })

  if (before?.url && before.url !== nextImage) await discardPhoto(before.url)

  revalidatePath(`/admin/properties/${id}`)
  if (row) {
    revalidatePath(`/admin/landlords/${row.landlordId}`)
    revalidatePath(`/p/${row.publicId}`)
  }
}

export async function deleteProperty(fd: FormData) {
  await requireAdmin()
  const id = required(fd, 'id', 'Property id')
  const [row] = await db
    .delete(properties)
    .where(eq(properties.id, id))
    .returning({ landlordId: properties.landlord_id })

  const landlordId = row?.landlordId
  revalidatePath('/admin')
  if (landlordId) {
    revalidatePath(`/admin/landlords/${landlordId}`)
    redirect(`/admin/landlords/${landlordId}`)
  }
  redirect('/admin')
}

// ─── Listings ──────────────────────────────────────────────────────────────

async function revalidateProperty(propertyId: string) {
  const [row] = await db
    .select({ publicId: properties.public_id })
    .from(properties)
    .where(eq(properties.id, propertyId))
    .limit(1)

  revalidatePath(`/admin/properties/${propertyId}`)
  if (row) revalidatePath(`/p/${row.publicId}`)
}

export async function createListing(fd: FormData) {
  await requireAdmin()
  const propertyId = required(fd, 'property_id', 'Property')

  // Append to the end of the current order rather than jumping to the top.
  const [{ next }] = await db
    .select({ next: sql<number>`coalesce(max(${listings.sort_order}), -1) + 1` })
    .from(listings)
    .where(eq(listings.property_id, propertyId))

  await db.insert(listings).values({
    property_id: propertyId,
    title: required(fd, 'title', 'Title'),
    description: optional(fd, 'description'),
    image_url: optionalUrl(fd, 'image_url'),
    price: optional(fd, 'price'),
    available_from: optional(fd, 'available_from'),
    status: listingStatus(fd),
    sort_order: Number(next) || 0,
  })

  await revalidateProperty(propertyId)
}

export async function updateListing(fd: FormData) {
  await requireAdmin()
  const id = required(fd, 'id', 'Listing id')
  const propertyId = required(fd, 'property_id', 'Property')

  const previousPhoto = await listingPhoto(id)
  const nextImage = optionalUrl(fd, 'image_url')

  await db
    .update(listings)
    .set({
      title: required(fd, 'title', 'Title'),
      description: optional(fd, 'description'),
      image_url: nextImage,
      price: optional(fd, 'price'),
      available_from: optional(fd, 'available_from'),
      status: listingStatus(fd),
      updated_at: new Date(),
    })
    .where(eq(listings.id, id))

  if (previousPhoto && previousPhoto !== nextImage) await discardPhoto(previousPhoto)
  await revalidateProperty(propertyId)
}

/** Quick status change from the listing row, without opening the edit panel. */
export async function setListingStatus(fd: FormData) {
  await requireAdmin()
  const id = required(fd, 'id', 'Listing id')
  const propertyId = required(fd, 'property_id', 'Property')

  await db
    .update(listings)
    .set({ status: listingStatus(fd), updated_at: new Date() })
    .where(eq(listings.id, id))

  await revalidateProperty(propertyId)
}

export async function deleteListing(fd: FormData) {
  await requireAdmin()
  const id = required(fd, 'id', 'Listing id')
  const propertyId = required(fd, 'property_id', 'Property')

  const photo = await listingPhoto(id)
  await db.delete(listings).where(eq(listings.id, id))
  await discardPhoto(photo)
  await revalidateProperty(propertyId)
}

// ─── Availability requests (public) ────────────────────────────────────────

export type InquiryResult = { ok: boolean; error?: string }

export async function submitInquiry(
  _prev: InquiryResult | null,
  fd: FormData,
): Promise<InquiryResult> {
  const publicId = text(fd, 'public_id')
  const name = text(fd, 'name')
  const email = text(fd, 'email')

  if (!publicId) return { ok: false, error: 'Something went wrong. Please rescan the QR code.' }
  if (!name) return { ok: false, error: 'Please enter your name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' }
  }

  // Honeypot: real visitors never fill a hidden field. Pretend it worked so
  // bots do not learn they were filtered.
  if (text(fd, 'company')) return { ok: true }

  const [property] = await db
    .select({
      id: properties.id,
      name: properties.name,
      kind: properties.kind,
      contactName: landlords.contact_name,
      contactEmail: landlords.contact_email,
    })
    .from(properties)
    .innerJoin(landlords, eq(landlords.id, properties.landlord_id))
    .where(eq(properties.public_id, publicId))
    .limit(1)

  if (!property) return { ok: false, error: 'This listing is no longer available.' }

  const rawListingId = text(fd, 'listing_id')
  let listingId: string | null = null
  let listingTitle: string | null = null
  if (rawListingId) {
    const [listing] = await db
      .select({ id: listings.id, title: listings.title })
      .from(listings)
      .where(eq(listings.id, rawListingId))
      .limit(1)
    // Ignore a listing that is not part of this property.
    if (listing) {
      listingId = listing.id
      listingTitle = listing.title
    }
  }

  const [row] = await db
    .insert(inquiries)
    .values({
      property_id: property.id,
      listing_id: listingId,
      name,
      email,
      phone: optional(fd, 'phone'),
      message: optional(fd, 'message'),
    })
    .returning({ id: inquiries.id })

  const appUrl = await getAppUrl()
  const sent = await sendInquiryEmail({
    to: property.contactEmail,
    contactName: property.contactName,
    propertyName: property.name,
    propertyKind: property.kind,
    listingTitle,
    from: { name, email, phone: optional(fd, 'phone'), message: optional(fd, 'message') },
    adminUrl: `${appUrl}/admin/properties/${property.id}`,
  })

  if (sent) {
    await db.update(inquiries).set({ notified_at: new Date() }).where(eq(inquiries.id, row.id))
  }

  revalidatePath('/admin/inquiries')
  revalidatePath(`/admin/properties/${property.id}`)
  return { ok: true }
}

export async function updateInquiryStatus(fd: FormData) {
  await requireAdmin()
  const id = required(fd, 'id', 'Inquiry id')
  const raw = text(fd, 'status')
  const status = raw === 'contacted' || raw === 'closed' ? raw : 'new'

  await db.update(inquiries).set({ status }).where(eq(inquiries.id, id))

  revalidatePath('/admin/inquiries')
  const propertyId = text(fd, 'property_id')
  if (propertyId) revalidatePath(`/admin/properties/${propertyId}`)
}
