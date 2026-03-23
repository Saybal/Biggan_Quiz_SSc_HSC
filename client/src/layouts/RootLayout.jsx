import React from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { QuizProvider } from '../context/QuizContext.jsx'
import Toast  from '../components/shared/Toast.jsx'
import Navbar from '../components/shared/Navbar.jsx'

export default function RootLayout() {
  return (
    <QuizProvider>
      <ScrollRestoration />
      <Navbar />
      <Outlet />
      <Toast />
    </QuizProvider>
  )
}
