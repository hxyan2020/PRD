/**
 * Shared auth for Lark cron / desk force endpoints.
 *
 * Vercel Cron hits the *deployment* hostname (not the production alias).
 * That host must NOT be covered by Vercel Authentication SSO, or every
 * scheduled fire gets a 302 to vercel.com/sso-api and never reaches us.
 * Prefer project SSO = preview-only (or off). Custom-domain traffic stays public.
 *
 * Also set Cache-Control: no-store — Vercel Cron treats cached GET responses
 * as successful deliveries without invoking the function (no runtime logs).
 */
import { timingSafeEqual } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (aa.length === 0 || aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}

/** True when Vercel Cron (or a trusted caller) sets x-vercel-cron: 1. */
export function isVercelCron(req: VercelRequest): boolean {
  return String(req.headers['x-vercel-cron'] || '') === '1'
}

/**
 * Desk token and/or CRON_SECRET bearer.
 * When CRON_SECRET is set, Vercel Cron also sends Authorization: Bearer <secret>.
 */
export function authorizeDeskOrCronSecret(req: VercelRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || ''
  const auth = String(req.headers.authorization || '')
  if (cronSecret && auth === `Bearer ${cronSecret}`) return true
  const expected = process.env.DESK_GATEWAY_TOKEN || ''
  if (!expected) return true
  const provided = String(req.headers['x-desk-token'] || '')
  return safeEqual(expected, provided)
}

/** Allow Vercel Cron header OR desk / CRON_SECRET bearer. */
export function allowCronOrDesk(req: VercelRequest): boolean {
  return isVercelCron(req) || authorizeDeskOrCronSecret(req)
}

/** CORS + no-store so cron GETs are never served from CDN cache. */
export function setCronRouteHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Desk-Token, Authorization')
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate')
  res.setHeader('CDN-Cache-Control', 'no-store')
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store')
}
