import { put, del } from '@vercel/blob'

export async function uploadFile(
  file: File,
  options: { userId: string; folder?: string }
): Promise<string> {
  const MAX_SIZE = 5 * 1024 * 1024
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

  if (file.size > MAX_SIZE) throw new Error('File too large (max 5MB)')
  if (!ALLOWED.includes(file.type)) throw new Error('Invalid file type')

  const ext = file.name.split('.').pop()
  const folder = options.folder ?? 'uploads'
  const key = `${folder}/${options.userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`

  const { url } = await put(key, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  })

  return url
}

export async function deleteFile(url: string) {
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN })
}
