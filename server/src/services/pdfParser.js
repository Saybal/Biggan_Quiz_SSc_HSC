/**
 * server/src/services/pdfParser.js  (FREE version — Groq instead of OpenAI)
 *
 * Replaces the OpenAI version with Groq's free API.
 * Groq runs llama-3.1-70b-versatile — excellent at structured extraction,
 * completely free with generous rate limits, no card required.
 *
 * Get your free API key at: https://console.groq.com
 * (Sign up with Google, get key instantly, no billing needed)
 *
 * Pipeline:
 *   PDF buffer → pdf-parse (text) → Groq llama-3.1-70b → MCQ JSON array
 */
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

// Groq uses the same OpenAI-compatible REST API format
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = `
You are an expert MCQ question extractor. Given raw text from a PDF
(Bengali or English content), extract ALL multiple-choice questions.
Return ONLY a valid JSON array — no markdown, no explanation, no preamble.

Each object in the array must have exactly these fields:
{
  "q":           "full question text (preserve Bengali script exactly)",
  "opts":        ["option A", "option B", "option C", "option D"],
  "ans":         0,
  "marks":       1,
  "context":     "",
  "explanation": "",
  "tags":        []
}

Rules:
- opts must always have exactly 4 items. Pad with plausible distractors if fewer.
- ans is the zero-based index (0, 1, 2, or 3) of the correct option.
- If no MCQ questions exist in the text, return [].
- Return ONLY the JSON array. Nothing else.
`.trim()

/**
 * @param {Buffer} pdfBuffer
 * @returns {Promise<Array>} array of validated question objects
 */
export async function parsePdfToQuestions(pdfBuffer) {
  // ── Step 1: Extract text from PDF ────────────────────────────────────────
  const parsed  = await pdfParse(pdfBuffer)
  const rawText = parsed.text?.trim()

  if (!rawText || rawText.length < 30) {
    throw Object.assign(
      new Error('PDF has no extractable text. Use a text-based PDF, not a scanned image.'),
      { status: 422 }
    )
  }

  function splitIntoChunks(text, { chunkSize = 12000, overlap = 900 } = {}) {
    const clean = text.replace(/\r\n/g, '\n')
    const chunks = []
    let start = 0
    while (start < clean.length) {
      const end = Math.min(clean.length, start + chunkSize)
      chunks.push(clean.slice(start, end))
      start = end - overlap
      if (start < 0) start = 0
      if (end === clean.length) break
    }
    return chunks
  }

  function parseAIResponse(content) {
    try {
      const parsed2 = JSON.parse(content)
      // Model might return { questions: [...] } or just [...]
      return Array.isArray(parsed2)
        ? parsed2
        : (parsed2.questions || parsed2.data || parsed2.mcqs || Object.values(parsed2)[0] || [])
    } catch {
      return []
    }
  }

  function normalizeOptionList(opts) {
    const arr = Array.isArray(opts) ? opts.map(o => String(o).trim()).filter(Boolean) : []
    if (arr.length >= 4) return arr.slice(0, 4)
    // Pad to exactly 4 so the UI/backend always expects 4 options.
    const filler = ['(উত্তর)', '(ভুল)', '(ভুল_২)', '(ভুল_৩)']
    const next = arr.slice()
    while (next.length < 4) next.push(filler[next.length] || '...')
    return next
  }

  function parseAnswerIndex(ans) {
    if (ans === null || ans === undefined) return 0
    const n = typeof ans === 'number' ? ans : parseInt(String(ans).trim(), 10)
    if (!Number.isNaN(n)) return Math.min(3, Math.max(0, n))
    const s = String(ans).trim().toUpperCase()
    const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 }
    if (map[s] !== undefined) return map[s]
    return 0
  }

  // ── Step 2: Extract in chunks (no truncation) ─────────────────────────────
  const chunks = splitIntoChunks(rawText, { chunkSize: 12000, overlap: 900 })
  const allRaw = []

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i]

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens:  4096,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Extract ALL multiple-choice questions from this chunk of PDF text. Return ONLY a JSON array.\n\nCHUNK ${i + 1}/${chunks.length}:\n${chunkText}` },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw Object.assign(
        new Error(`Groq API error ${response.status}: ${errBody}`),
        { status: 502 }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '{}'
    allRaw.push(...parseAIResponse(content))
  }

  // ── Step 3: Validate + de-duplicate + normalize ────────────────────────────
  const normalized = []
  const seen = new Set()

  for (const item of allRaw) {
    if (!item?.q) continue
    if (!Array.isArray(item.opts)) continue
    if (item.ans === undefined) continue

    const q = String(item.q).replace(/\s+/g, ' ').trim()
    if (!q) continue

    const opts = normalizeOptionList(item.opts)
    const ans = parseAnswerIndex(item.ans)
    const marks = parseInt(item.marks, 10)

    const key = `${q}__${opts.join('|')}__${ans}`
    if (seen.has(key)) continue
    seen.add(key)

    normalized.push({
      q,
      opts,
      ans,
      marks: Number.isNaN(marks) ? 1 : Math.min(20, Math.max(1, marks)),
      context:     String(item.context     || '').trim(),
      explanation: String(item.explanation || '').trim(),
      tags:        Array.isArray(item.tags) ? item.tags.map(String) : [],
    })
  }

  if (normalized.length === 0) {
    throw Object.assign(
      new Error('No valid MCQ questions found in this PDF.'),
      { status: 422 }
    )
  }

  return normalized
}
