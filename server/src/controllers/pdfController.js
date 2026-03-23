import { parsePdfToQuestions } from '../services/pdfParser.js'

/**
 * POST /api/admin/pdf/parse
 *
 * Multipart form-data:
 *   - file: the PDF file (field name "pdf")
 *
 * Returns: { questions: [...], count: N }
 * The admin then reviews and calls /api/admin/questions/bulk to save.
 */
export async function parsePdf(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded. Use field name "pdf".' })
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(415).json({ error: 'Only PDF files are accepted.' })
    }

    const questions = await parsePdfToQuestions(req.file.buffer)
    res.json({ questions, count: questions.length })
  } catch (err) { next(err) }
}
