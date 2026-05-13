import { createClient } from '@supabase/supabase-js'
import formidable from 'formidable'
import fs from 'fs'

export const config = { api: { bodyParser: false } }

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  // Verify user is authenticated
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorised' })

  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const { data: { user } } = await anonSupabase.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorised' })

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
    const ext = (file.originalFilename || 'photo.jpg').split('.').pop()
    const path = `${slug}/${filePrefix}-${timestamp}-${i}.${ext}`
    const buffer = fs.readFileSync(file.filepath)

    const { error } = await serviceSupabase.storage
      .from('property-photos')
      .upload(path, buffer, { contentType: file.mimetype || 'image/jpeg', upsert: true })

    if (!error) {
      const { data: { publicUrl } } = serviceSupabase.storage
        .from('property-photos')
        .getPublicUrl(path)
      uploadedUrls.push(publicUrl)
    }

    fs.unlinkSync(file.filepath)
  }

  return res.status(200).json({ urls: uploadedUrls })
}
