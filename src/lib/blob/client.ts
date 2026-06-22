import { put, del } from '@vercel/blob'

export async function uploadFile(
  file: File,
  options: { userId: string; folder?: string; access?: 'public' | 'private' }
): Promise<string> {
  const MAX_SIZE = 5 * 1024 * 1024
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

  if (file.size > MAX_SIZE) throw new Error(`File too large (max 5MB). Got ${(file.size / 1024 / 1024).toFixed(1)}MB.`)
  if (!ALLOWED.includes(file.type)) throw new Error(`Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, PDF.`)

  const ext = file.name.split('.').pop()
  const folder = options.folder ?? 'uploads'
  const key = `${folder}/${options.userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`

  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not configured. Uploads will fail.')

  const { url } = await put(key, file, {
    access: options.access ?? 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  return url
}

export async function deleteFile(url: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error('BLOB_READ_WRITE_TOKEN is not configured.')
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN })
}
