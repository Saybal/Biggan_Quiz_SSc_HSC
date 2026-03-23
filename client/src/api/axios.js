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

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,  // 60s — PDF parsing can be slow
})

// ── Attach fresh Firebase ID token to every request ───────────────────────────
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    // getIdToken(false) returns cached token if still valid, refreshes if expired
    const token = await user.getIdToken(false)
    config.headers.Authorization = `Bearer ${token}`
  }
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
