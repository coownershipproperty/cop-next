import { optimisePhoto } from "@/lib/optimise-photo";
import formidable from 'formidable'
import fs from 'fs'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth'

export const config = { api: { bodyParser: false } }

const serviceSupabase = createSupabaseAdminClient()

export default async function handler(req, res) {
  setCrmCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const admin = await requireCrmAdmin(req, res)
  if (!admin) return

  const form = formidable({ maxFileSize: 20 * 1024 * 1024 })
  const [fields, files] = await form.parse(req)

  const slug = fields.slug?.[0]
  if (!slug) return res.status(400).json({ error: 'Missing slug' })

  // target = 'extras' (default, for brochure screenshots) or 'photos' (for full gallery)
  const target = fields.target?.[0] === 'photos' ? 'photos' : 'extras'
  const filePrefix = target === 'photos' ? 'photo' : 'extra'

  const uploadedUrls = []
  const timestamp = Date.now()
  const fileList = Array.isArray(files.files) ? files.files : [files.files].filter(Boolean)

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]
    let photo
    try {
      photo = await optimisePhoto(fs.readFileSync(file.filepath))
    } catch {
      return res.status(400).json({ error: 'Could not process this image. Please use a JPG, PNG or WebP photo.', urls: uploadedUrls })
    } finally {
      for (const pendingFile of fileList.slice(i)) {
        if (pendingFile === file || !photo) {
          try { fs.unlinkSync(pendingFile.filepath) } catch {}
        }
      }
    }
    const { buffer, ext, contentType } = photo
    const path = `${slug}/${filePrefix}-${timestamp}-${i}.${ext}`

    const { error } = await serviceSupabase.storage
      .from('property-photos')
      .upload(path, buffer, { contentType, cacheControl: '31536000', upsert: true })

    if (!error) {
      const { data: { publicUrl } } = serviceSupabase.storage
        .from('property-photos')
        .getPublicUrl(path)
      uploadedUrls.push(publicUrl)
    }

  }

  return res.status(200).json({ urls: uploadedUrls })
}
