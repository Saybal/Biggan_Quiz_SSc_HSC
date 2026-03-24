import nodemailer from 'nodemailer'
import Exam from '../models/Exam.js'
import User from '../models/User.js'
import ExamReminderLog from '../models/ExamReminderLog.js'

function toUTCDateKey(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return dt.toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
}

function utcStartOfDay(d) {
  const dt = d instanceof Date ? d : new Date(d)
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()))
}

export async function sendExamReminders(req, res, next) {
  try {
    const provided =
      req.headers['x-cron-secret'] ||
      req.query.secret ||
      req.body?.secret

    if (!provided || provided !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Invalid cron secret' })
    }

    // Send reminders 1 day before (publishDate-based) in UTC.
    const now = new Date()
    const tomorrowStart = utcStartOfDay(new Date(now.getTime() + 24 * 60 * 60 * 1000))
    const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000)
    const reminderDateKey = toUTCDateKey(tomorrowStart)

    const smtp = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    }

    if (!smtp.host || !smtp.auth.user || !smtp.auth.pass) {
      return res.status(500).json({ error: 'Email SMTP env vars are not configured' })
    }

    const transporter = nodemailer.createTransport(smtp)

    // Fetch exams scheduled for tomorrow.
    const exams = await Exam.find({
      publishDate: { $gte: tomorrowStart, $lt: tomorrowEnd },
    })
      .populate('subjectId', 'name emoji')
      .populate('levelId', 'name short')
      .lean()

    if (exams.length === 0) {
      return res.json({ message: 'No exams found for tomorrow', sent: 0 })
    }

    // Recipients: all known users in Mongo (best-effort mirror of Firebase Auth).
    const recipients = await User.find({})
      .select('email displayName role emailVerified')
      .lean()

    let sent = 0

    for (const exam of exams) {
      const already = await ExamReminderLog.findOne({
        examId: exam._id,
        reminderDateKey,
      }).lean()

      if (already) continue

      const subjectName = exam.subjectId?.name || ''
      const levelName = exam.levelId?.short || exam.levelId?.name || ''
      const subjectEmoji = exam.subjectId?.emoji || ''

      const mailSubject = `বিজ্ঞান কুইজ স্মরণবার্তা: ${exam.examName}`

      // Send the same reminder to all recipients (respecting emailVerified if available).
      for (const u of recipients) {
        if (!u.email) continue
        if (u.emailVerified === false) continue
        if (u.role && u.role !== 'user') continue

        const greetingName = u.displayName?.trim() || u.email.split('@')[0]
        const publishText = reminderDateKey // tomorrow date in UTC YYYY-MM-DD

        const text = [
          `প্রিয় ${greetingName},`,
          '',
          `আপনার জন্য আগামীকাল (${publishText}) অনুষ্ঠিত হবে:`,
          `• পরীক্ষা: ${exam.examName}`,
          `• বিষয়: ${subjectEmoji} ${subjectName}`,
          `• শ্রেণি: ${levelName}`,
          '',
          'পরীক্ষা শুরু হওয়ার আগে প্রস্তুত হয়ে নিন।',
          '',
          'শুভকামনা রইল,',
          'বিজ্ঞান কুইজ টিম',
        ].join('\n')

        // Simple HTML with the same content.
        const html = text
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('\n', '<br/>')

        await transporter.sendMail({
          from: process.env.SMTP_FROM || smtp.auth.user,
          to: u.email,
          subject: mailSubject,
          text,
          html,
        })
        sent++
      }

      await ExamReminderLog.create({
        examId: exam._id,
        reminderDateKey,
        sentAt: new Date(),
      })
    }

    res.json({ message: 'Reminders sent', sent })
  } catch (err) {
    next(err)
  }
}

