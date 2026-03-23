/**
 * client/src/hooks/useFirebaseAuth.js
 *
 * Centralises all Firebase Auth operations.
 * Components and context import from this hook — they never
 * touch the Firebase SDK directly.
 *
 * Returns:
 *   user         — current Firebase user (null if not signed in)
 *   loading      — true while Firebase is resolving initial auth state
 *   role         — 'admin' | 'user' | null  (from ID token custom claim)
 *   register     — (email, password, displayName) → Promise
 *   login        — (email, password) → Promise
 *   loginGoogle  — () → Promise  (Google OAuth popup)
 *   logout       — () → Promise
 *   getIdToken   — () → Promise<string>  (fresh token for API calls)
 */
import { useState, useEffect, useCallback } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../config/firebase.js'

const googleProvider = new GoogleAuthProvider()

export function useFirebaseAuth() {
  const [user,    setUser]    = useState(null)
  const [role,    setRole]    = useState(null)   // from custom claim
  const [loading, setLoading] = useState(true)   // resolving initial state

  // ── Listen to auth state changes ──────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Force-refresh token to get latest custom claims
        const tokenResult = await firebaseUser.getIdTokenResult(true)
        setRole(tokenResult.claims.role || 'user')
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })
    return unsubscribe  // cleanup on unmount
  }, [])

  // ── Register with email + password ────────────────────────────────────────
  const register = useCallback(async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }
    return cred.user
  }, [])

  // ── Login with email + password ───────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }, [])

  // ── Login with Google popup ───────────────────────────────────────────────
  const loginGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider)
    return cred.user
  }, [])

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  // ── Get fresh ID token for API Authorization header ───────────────────────
  // Firebase tokens expire after 1 hour. getIdToken(true) forces a refresh.
  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) throw new Error('Not signed in')
    return auth.currentUser.getIdToken(true)
  }, [])

  return { user, role, loading, register, login, loginGoogle, logout, getIdToken }
}
