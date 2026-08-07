'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  SESSION_COOKIE,
  adminAuthConfigured,
  createSessionToken,
  sessionMaxAgeSeconds,
  verifyCredentials,
} from './auth'

export type LoginResult = { error?: string }

export async function login(_prev: LoginResult | null, fd: FormData): Promise<LoginResult> {
  const username = typeof fd.get('username') === 'string' ? (fd.get('username') as string) : ''
  const password = typeof fd.get('password') === 'string' ? (fd.get('password') as string) : ''

  if (!adminAuthConfigured()) {
    return { error: 'Admin sign-in is not configured on this deployment.' }
  }

  // Deliberately vague: naming which half was wrong tells an attacker whether
  // the username exists.
  if (!verifyCredentials(username, password)) {
    return { error: 'Those details did not match. Check the username and password.' }
  }

  const store = await cookies()
  store.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: sessionMaxAgeSeconds(),
  })

  redirect('/admin')
}

export async function logout() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect('/login')
}
