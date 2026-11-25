import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchMultiAssetBoard } from '../lark/_lib/multiAssetMarket.js'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
  try {
    const board = await fetchMultiAssetBoard()
    return res.status(200).json({ ok: true, board })
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    })
  }
}
