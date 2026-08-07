import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-lg font-bold text-white">
        S
      </span>
      <h1 className="mt-6 text-4xl font-bold">SpotList</h1>
      <p className="mt-3 text-lg text-muted">
        Publish live availability for your buildings and parking lots. Every property gets a QR code
        that opens its public availability page — requests go straight to your contact person.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/admin" className="btn">
          Open admin
        </Link>
      </div>
    </main>
  )
}
