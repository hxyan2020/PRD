#!/usr/bin/env node
/** Local preview for vex-llm-gateway (also used before publish-app). */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 8791)

// Local-only: load this folder's .env. Never pull secrets from sibling apps.
try {
  const envPath = path.join(__dirname, '.env')
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m || process.env[m[1]]) continue
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
} catch {
  /* ignore */
}

const chat = await import(pathToFileURL(path.join(__dirname, 'api/chat.js')).href)

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`)
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method || 'GET')
      ? undefined
      : await new Promise((resolve) => {
          const chunks = []
          req.on('data', (c) => chunks.push(c))
          req.on('end', () => resolve(Buffer.concat(chunks)))
        }),
  })

  let response
  if (url.pathname === '/api/chat' || url.pathname === '/api/chat/') {
    if (req.method === 'OPTIONS') response = await chat.OPTIONS(request)
    else if (req.method === 'POST') response = await chat.POST(request)
    else if (req.method === 'GET') response = await chat.GET(request)
    else response = new Response('method', { status: 405 })
  } else if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'))
    response = new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  } else if (url.pathname === '/health') {
    response = await chat.GET(request)
  } else {
    response = new Response('not found', { status: 404 })
  }

  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`vex-llm-gateway http://127.0.0.1:${PORT}`)
  console.log(
    `openai=${Boolean(process.env.OPENAI_API_KEY)} deskToken=${Boolean(process.env.DESK_GATEWAY_TOKEN)} budget=${process.env.DAILY_BUDGET_USD || 10}`,
  )
})
