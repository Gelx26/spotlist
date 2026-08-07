import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { isSignedIn } from '@/lib/session'

export const runtime = 'nodejs'

const MAX_BYTES = 8 * 1024 * 1024

/**
 * Issues short-lived client upload tokens. Photos go straight from the browser
 * to blob storage rather than through a server action, which would cap them at
 * the 4.5 MB request-body limit — well under what a phone camera produces.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // The only gate on this endpoint — without it anyone could fill the store.
        if (!(await isSignedIn())) throw new Error('Not signed in')

        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {
        // Nothing to do: the URL is written to the listing when the form saves.
      },
    })

    return Response.json(result)
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    )
  }
}
