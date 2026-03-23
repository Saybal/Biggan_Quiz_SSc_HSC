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

  // Truncate to safe token limit for llama-3.1-70b (context: 131k tokens)
  const truncated = rawText.slice(0, 15000)

  // ── Step 2: Call Groq API ─────────────────────────────────────────────────
  const response = await fetch(GROQ_API_URL, {
    method:  'POST',
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
        { role: 'user',   content: `Extract all MCQ questions from this text:\n\n${truncated}` },
      ],
      // Groq supports response_format for JSON mode
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

  const data    = await response.json()
  const content = data.choices?.[0]?.message?.content || '{}'

  // ── Step 3: Parse and validate ────────────────────────────────────────────
  let raw
  try {
    const parsed2 = JSON.parse(content)
    // Model might return { questions: [...] } or just [...]
    raw = Array.isArray(parsed2)
      ? parsed2
      : (parsed2.questions || parsed2.data || parsed2.mcqs || Object.values(parsed2)[0] || [])
  } catch {
    throw Object.assign(
      new Error('AI returned invalid JSON. Please try again.'),
      { status: 500 }
    )
  }

  if (!Array.isArray(raw)) raw = []

  const questions = raw
    .filter(item =>
      item.q &&
      Array.isArray(item.opts) &&
      item.opts.length >= 2 &&
      item.ans !== undefined
    )
    .map(item => ({
      q:           String(item.q).trim(),
      opts:        item.opts.slice(0, 4).map(o => String(o).trim()),
      ans:         Math.min(3, Math.max(0, parseInt(item.ans) || 0)),
      marks:       parseInt(item.marks) || 1,
      context:     String(item.context     || '').trim(),
      explanation: String(item.explanation || '').trim(),
      tags:        Array.isArray(item.tags) ? item.tags.map(String) : [],
    }))

  if (questions.length === 0) {
    throw Object.assign(
      new Error('No valid MCQ questions found in this PDF.'),
      { status: 422 }
    )
  }

  return questions
}
