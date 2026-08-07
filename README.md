# SpotList

Availability boards for landlords. Each landlord profile holds buildings and
parking lots; each of those gets a QR code that opens a public page showing
which units/spots are free, plus a request form that reaches the landlord's
contact person.

## Model

```
landlord ──< property (building | parking) ──< listing (unit / spot)
                    │
                    └──< inquiry (availability request)
```

A property's public page lives at `/p/<public_id>` — an unguessable 10-char id,
so the URL is the QR code's payload and the only way in.

## Routes

| Route | What it is |
| --- | --- |
| `/admin` | Landlord profiles |
| `/admin/landlords/[id]` | Contact person + that landlord's properties |
| `/admin/properties/[id]` | QR code, availability listings, requests |
| `/admin/inquiries` | Every request across all properties |
| `/p/[publicId]` | Public availability page + request form (QR target) |
| `/api/qr/[publicId]` | QR download — PNG, or `?format=svg` |

Admin is **not authenticated yet** — see below.

## Local development

```bash
npm install
npm run db:push   # sync Drizzle schema to Postgres
npm run dev       # http://localhost:3005
```

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon Postgres; set automatically by the Vercel Neon integration |
| `RESEND_API_KEY` | no | Without it, requests are still stored — they just aren't emailed |
| `INQUIRY_FROM_EMAIL` | no | Verified Resend sender; defaults to `onboarding@resend.dev` |
| `NEXT_PUBLIC_APP_URL` | no | Overrides the origin baked into QR codes; falls back to the Vercel URL |

## Not done yet

- **Admin auth.** `/admin` is open to anyone with the URL. Clerk is the intended
  fix (same setup as the ServiceArc project).
- **Image uploads.** Photos are external URLs for now; Vercel Blob is the
  natural next step.
