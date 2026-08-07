import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <span className="grid h-12 w-12 place-items-center rounded-sm bg-forest font-display text-lg text-ivory">
        S
      </span>
      <h1 className="mt-7 font-display text-5xl font-normal">SpotList</h1>
      <div className="mt-5 w-16 border-b-[3px] border-double border-brass" />
      <p className="mt-6 text-lg leading-relaxed text-muted">
        Publish live availability for your buildings and parking lots. Every property gets a QR code
        that opens its public availability page — requests go straight to your contact person.
      </p>
      <div className="mt-9">
        <Link href="/admin" className="btn">
          Open admin
        </Link>
      </div>
    </main>
  )
}
