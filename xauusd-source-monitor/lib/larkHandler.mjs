/**
 * Shared adapter: Vercel serverless → lark-messenger-server handleRequest.
 * vendor-lark/ is synced from ../../lark-messenger-server by deploy-vercel.sh.
 */
import { handleRequest } from '../vendor-lark/server.mjs'

export default async function larkHandler(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
  if (url.pathname === '/api/lark-health') {
    req.url = '/health'
  }
  return handleRequest(req, res)
}
