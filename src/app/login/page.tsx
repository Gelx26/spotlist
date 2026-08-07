import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { isSignedIn } from '@/lib/session'
import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
}

export default async function LoginPage() {
  if (await isSignedIn()) redirect('/admin')

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <div className="mb-8">
        <span className="grid h-11 w-11 place-items-center rounded-sm bg-forest font-display text-base text-ivory">
          S
        </span>
        <h1 className="mt-6 font-display text-3xl font-normal">Sign in</h1>
        <div className="mt-4 w-12 border-b-[3px] border-double border-brass" />
        <p className="mt-5 text-sm leading-relaxed text-muted">
          The availability boards stay public. This is the side that manages them.
        </p>
      </div>
      <LoginForm />
    </main>
  )
}
