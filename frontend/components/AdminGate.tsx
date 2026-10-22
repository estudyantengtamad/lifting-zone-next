'use client'

import React from 'react'
import { useAuthStore } from '../lib/authStore'

interface AdminGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function AdminGate({ children, fallback = null }: AdminGateProps) {
  const { role, initialized } = useAuthStore()

  if (!initialized || role !== 'admin') {
    return <>{fallback}</>
  }

  return <>{children}</>
}
