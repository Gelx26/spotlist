/**
 * listings.available (boolean) → listings.status (enum).
 *
 * Written by hand rather than left to `drizzle-kit push` so the existing rows
 * are backfilled before the old column goes away. Idempotent: safe to re-run.
 *
 *   node --env-file=.env.local scripts/migrate-listing-status.mjs
 */
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const columns = await sql`
  select column_name from information_schema.columns
  where table_name = 'listings' and column_name in ('available', 'status')
`
const names = columns.map((c) => c.column_name)

if (!names.includes('status')) {
  await sql`
    do $$ begin
      create type listing_status as enum ('available', 'coming_soon', 'taken');
    exception when duplicate_object then null;
    end $$
  `
  await sql`
    alter table listings
    add column status listing_status not null default 'available'
  `
  console.log('added listings.status')
} else {
  console.log('listings.status already present')
}

if (names.includes('available')) {
  const updated = await sql`
    update listings
    set status = case when available then 'available'::listing_status else 'taken'::listing_status end
  `
  console.log('backfilled status from available', updated)

  await sql`alter table listings drop column available`
  console.log('dropped listings.available')
} else {
  console.log('listings.available already removed')
}

const counts = await sql`select status, count(*)::int as n from listings group by status order by status`
console.log('current distribution:', counts)
