/**
 * Vercel Serverless — POST /api/chat
 * Env (optional if client sends apiKey): OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

type Msg = { role: string; content: string }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })

  try {
    const body = req.body as {
      provider?: string
      model?: string
      messages?: Msg[]
      apiKey?: string
    }
    const provider = body.provider || 'gemini'
    const model = body.model || ''
    const messages = body.messages || []
    if (!messages.length) return res.status(400).json({ error: 'messages required' })

    const key =
      body.apiKey ||
      (provider === 'openai'
        ? process.env.OPENAI_API_KEY
        : provider === 'anthropic'
          ? process.env.ANTHROPIC_API_KEY
          : provider === 'openrouter'
            ? process.env.OPENROUTER_API_KEY
            : process.env.GEMINI_API_KEY) ||
      ''

    if (!key) return res.status(400).json({ error: `No API key for ${provider}` })

    let text = ''
    if (provider === 'openai' || provider === 'openrouter') {
      const base =
        provider === 'openrouter'
          ? 'https://openrouter.ai/api/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions'
      const r = await fetch(base, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          ...(provider === 'openrouter'
            ? { 'HTTP-Referer': 'https://hxyan2020.github.io', 'X-Title': 'V Exchange Risk Copilot' }
            : {}),
        },
        body: JSON.stringify({
          model: model || (provider === 'openrouter' ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'),
          messages,
          temperature: 0.2,
        }),
      })
      const data = (await r.json()) as {
        choices?: { message?: { content?: string } }[]
        error?: { message?: string }
      }
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'upstream' })
      text = data.choices?.[0]?.message?.content || ''
    } else if (provider === 'anthropic') {
      const system = messages.find((m) => m.role === 'system')?.content || ''
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-sonnet-4-5',
          max_tokens: 4096,
          system,
          messages: messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = (await r.json()) as {
        content?: { type: string; text?: string }[]
        error?: { message?: string }
      }
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'upstream' })
      text = data.content?.filter((c) => c.type === 'text').map((c) => c.text || '').join('') || ''
    } else {
      const system = messages.find((m) => m.role === 'system')?.content || ''
      const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }))
      const m = model || 'gemini-2.0-flash'
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent?key=${encodeURIComponent(key)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents,
            generationConfig: { temperature: 0.2 },
          }),
        },
      )
      const data = (await r.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[]
        error?: { message?: string }
      }
      if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'upstream' })
      text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
    }

    if (!text) return res.status(502).json({ error: 'empty model response' })
    return res.status(200).json({ text })
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'server error' })
  }
}
