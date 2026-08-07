'use client'

import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'

const MAX_EDGE = 1600
const JPEG_QUALITY = 0.82
const SKIP_RESIZE_UNDER = 400 * 1024

/**
 * Shrinks a photo in the browser before it is uploaded. A phone camera produces
 * 4–8 MB images for something that is displayed at most a few hundred pixels
 * wide, and the public page is read on mobile data at a gate — so the saving
 * lands exactly where it matters.
 *
 * `imageOrientation: 'from-image'` applies the EXIF rotation, otherwise photos
 * taken in portrait come out sideways once re-encoded.
 */
async function downscale(file: File): Promise<Blob> {
  if (file.size < SKIP_RESIZE_UNDER) return file

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)

    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    )
    // Only keep the re-encode if it actually helped.
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

export function ImageUpload({
  name,
  defaultValue,
  label = 'Photo',
}: {
  name: string
  defaultValue?: string | null
  label?: string
}) {
  const [url, setUrl] = useState(defaultValue ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setBusy(true)
    setError(null)
    try {
      const body = await downscale(file)
      // Name the object after what it actually is — downscaling re-encodes to
      // JPEG, so keeping the original ".png" would be a lie on disk.
      const type = body.type || file.type
      const ext = type === 'image/jpeg' ? 'jpg' : type.split('/')[1] || 'jpg'
      const stem = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-') || 'photo'
      const result = await upload(`photos/${stem}.${ext}`, body, {
        access: 'public',
        handleUploadUrl: '/api/blob/upload',
        contentType: type,
      })
      setUrl(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      {/* What the server action reads — the file input itself is never submitted. */}
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-4">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="h-16 w-16 shrink-0 rounded-sm border border-line object-cover"
          />
        ) : (
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-sm border border-dashed border-line text-[10px] font-semibold uppercase tracking-wide text-muted">
            None
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-ghost"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? 'Uploading…' : url ? 'Replace' : 'Choose photo'}
          </button>
          {url && !busy && (
            <button
              type="button"
              className="text-sm font-semibold text-muted hover:text-ink"
              onClick={() => setUrl('')}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />

      {error && <p className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </div>
  )
}
