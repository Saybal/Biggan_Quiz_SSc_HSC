/**
 * client/src/hooks/useDeviceFingerprint.js
 *
 * Generates a stable browser fingerprint without any paid library.
 * Uses: screen size, timezone, language, canvas, platform, color depth.
 * Hashed with a simple SHA-256 via Web Crypto API.
 *
 * The fingerprint is cached in localStorage so it survives page refreshes.
 * It is sent with every protected API request via the X-Device-Fingerprint header.
 */
import { useState, useEffect } from 'react'

async function sha256(str) {
  const buf    = new TextEncoder().encode(str)
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2,'0')).join('')
}

function collectRawFingerprint() {
  const parts = [
    navigator.language        || '',
    navigator.platform        || '',
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    navigator.hardwareConcurrency || '',
    navigator.maxTouchPoints  || '',
  ]

  // Canvas fingerprint — renders text and reads pixel data
  try {
    const canvas  = document.createElement('canvas')
    const ctx     = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font      = '14px Arial'
    ctx.fillText('বিজ্ঞান কুইজ 🧮', 2, 2)
    parts.push(canvas.toDataURL().slice(-50))
  } catch {}

  return parts.join('|')
}

export function useDeviceFingerprint() {
  const [fingerprint, setFingerprint] = useState(
    () => localStorage.getItem('device_fp') || ''
  )

  useEffect(() => {
    if (fingerprint) return   // already computed
    collectRawFingerprint()
    const raw = collectRawFingerprint()
    sha256(raw).then(hash => {
      localStorage.setItem('device_fp', hash)
      setFingerprint(hash)
    })
  }, []) // eslint-disable-line

  return fingerprint
}
