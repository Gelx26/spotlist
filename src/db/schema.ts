import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'

// ─── Enums ─────────────────────────────────────────────────────────────────

/** A landlord's rentable unit group: an apartment building or a parking lot. */
export const propertyKindEnum = pgEnum('property_kind', ['building', 'parking'])
export const inquiryStatusEnum = pgEnum('inquiry_status', ['new', 'contacted', 'closed'])

/**
 * Every listing stays on the public board whatever its state — a full board
 * still tells a visitor what the place is like and is worth asking about.
 */
export const listingStatusEnum = pgEnum('listing_status', ['available', 'coming_soon', 'taken'])

// ─── Landlords ─────────────────────────────────────────────────────────────

export const landlords = pgTable('landlords', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // The person availability requests get routed to.
  contact_name: text('contact_name').notNull(),
  contact_email: text('contact_email').notNull(),
  contact_phone: text('contact_phone'),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─── Properties (buildings & parking lots) ─────────────────────────────────

export const properties = pgTable('properties', {
  id: uuid('id').primaryKey().defaultRandom(),
  landlord_id: uuid('landlord_id')
    .notNull()
    .references(() => landlords.id, { onDelete: 'cascade' }),
  kind: propertyKindEnum('kind').notNull().default('building'),
  name: text('name').notNull(),
  address: text('address'),
  description: text('description'),
  image_url: text('image_url'),
  // Short unguessable id used in the public URL that the QR code points at.
  public_id: text('public_id').notNull().unique(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_properties_landlord_id').on(t.landlord_id),
])

// ─── Listings (individual units / spots) ───────────────────────────────────

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().defaultRandom(),
  property_id: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  image_url: text('image_url'),
  // Free text so landlords can write "$450/mo", "€200 + utilities", etc.
  price: text('price'),
  status: listingStatusEnum('status').notNull().default('available'),
  // Free text so landlords can write "Sept 1" or "early October". Doubles as
  // the expected date for a coming_soon listing.
  available_from: text('available_from'),
  sort_order: integer('sort_order').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_listings_property_id').on(t.property_id),
])

// ─── Availability requests from the public page ────────────────────────────

export const inquiries = pgTable('inquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  property_id: uuid('property_id')
    .notNull()
    .references(() => properties.id, { onDelete: 'cascade' }),
  // Set when the visitor asked about one specific unit rather than the property.
  listing_id: uuid('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  message: text('message'),
  status: inquiryStatusEnum('status').notNull().default('new'),
  // Null when no email provider is configured — the request is still stored.
  notified_at: timestamp('notified_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_inquiries_property_id').on(t.property_id),
  index('idx_inquiries_created_at').on(t.created_at),
])

export type Landlord = typeof landlords.$inferSelect
export type Property = typeof properties.$inferSelect
export type Listing = typeof listings.$inferSelect
export type Inquiry = typeof inquiries.$inferSelect
