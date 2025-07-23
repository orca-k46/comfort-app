// api/provide-data.js

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()  // Method Not Allowed
  }

  // ─── ボディの手動パース ───
  let raw = ''
  for await (const chunk of req) {
    raw += chunk.toString()
  }

  let payload
  try {
    payload = JSON.parse(raw)
  } catch (err) {
    console.error('[provide-data] JSON parse error:', err)
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const decibel = Number(payload.decibel)
  if (!Number.isFinite(decibel)) {
    console.error('[provide-data] Invalid decibel:', payload.decibel)
    return res.status(400).json({ error: 'Invalid decibel' })
  }

  // Supabase に挿入
  const { data, error } = await supabase
    .from('comfort')
    .insert([{ decibel, timestamp: new Date().toISOString() }])
    .select('decibel, timestamp')
    .single()

  if (error) {
    console.error('[provide-data] Supabase insert error:', error)
    return res.status(500).json({ error: 'Database error' })
  }

  // 成功したらそのまま返却
  res.status(200).json(data)
}
