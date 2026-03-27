/**
 * client/src/api/axios.js  (Firebase version)
 *
 * Replaces the old version that read a static token from localStorage.
 *
 * Now the request interceptor calls Firebase's getIdToken() each time,
 * which automatically refreshes the token when it's near expiry (1-hour TTL).
 * This means the token is always fresh — no manual refresh logic needed.
 */
import axios from 'axios'
import { auth } from '../config/firebase.js'

function normalizeApiBase(rawBase) {
  const base = String(rawBase || '').trim().replace(/\/$/, '')
  if (!base) return '/api'
  // Server routes are mounted under `/api` in Express.
  return base.endsWith('/api') ? base : `${base}/api`
}

const api = axios.create({
  baseURL: normalizeApiBase(import.meta.env.VITE_API_URL),
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,  // 60s — PDF parsing can be slow
})

// ── Attach fresh Firebase ID token to every request ───────────────────────────
// api.interceptors.request.use(async (config) => {
//   const user = auth.currentUser
//   if (user) {
//     // getIdToken(false) returns cached token if still valid, refreshes if expired
//     const token = await user.getIdToken(false)
//     config.headers.Authorization = `Bearer ${token}`
//   }
//   return config
// })

// In the request interceptor, after setting the Authorization header, add:
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken(false)
    config.headers.Authorization = `Bearer ${token}`
  }
  // Always attach device fingerprint if available
  const fp = localStorage.getItem('device_fp')
  if (fp) config.headers['X-Device-Fingerprint'] = fp
  return config
})

// ── Handle 401 globally ───────────────────────────────────────────────────────
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      if (
        window.location.pathname.startsWith('/admin') &&
        window.location.pathname !== '/admin/login'
      ) {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
