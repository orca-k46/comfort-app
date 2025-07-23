// api/latest-data.js

import { createClient } from '@supabase/supabase-js'

// 環境変数から Supabase クライアントを初期化
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  // GET メソッドのみ許可
  if (req.method !== 'GET') {
    return res.status(405).end()  // Method Not Allowed
  }

  // 最新レコードを取得
  const { data, error } = await supabase
    .from('comfort')
    .select('decibel, timestamp')
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    // テーブルが空のときの PGRST116（No rows found）は無視
    console.error('[latest-data] Supabase select error:', error)
    return res.status(500).json({ error: 'Database error' })
  }

  if (!data) {
    // テーブルが空ならデフォルト応答
    return res.status(200).json({ decibel: 0, timestamp: '' })
  }

  // 正常に取得できた最新データを返却
  res.status(200).json(data)
}
