import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(initialSeconds, onExpire) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds)
  const intervalRef = useRef(null)
  const expiredRef  = useRef(false)

  const start = useCallback(() => {
    expiredRef.current = false
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          if (!expiredRef.current) { expiredRef.current = true; onExpire?.() }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [onExpire])

  const stop  = useCallback(() => clearInterval(intervalRef.current), [])
  const reset = useCallback((s) => { stop(); setTimeLeft(s); expiredRef.current = false }, [stop])

  useEffect(() => () => clearInterval(intervalRef.current), [])

  const warn = timeLeft > 0 && timeLeft <= 300
  const fmt = () => {
    const m = Math.floor(timeLeft / 60)
    const s = timeLeft % 60
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  return { timeLeft, warn, fmt, start, stop, reset }
}
