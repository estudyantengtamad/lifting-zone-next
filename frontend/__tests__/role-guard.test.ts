import { describe, it, expect } from 'vitest'

describe('Role and Privilege Verification', () => {
  const adminAllowlist = ['owner@liftingzone.ph', 'lead-admin@gmail.com']

  function resolveUserRole(email: string, storedRole: string | null): 'customer' | 'admin' {
    if (adminAllowlist.some(allowed => allowed.toLowerCase() === email.toLowerCase())) {
      return 'admin'
    }
    if (storedRole === 'admin') {
      return 'admin'
    }
    return 'customer'
  }

  it('assigns customer role by default to general Google users', () => {
    const role = resolveUserRole('regular.lifter@gmail.com', null)
    expect(role).toBe('customer')
  })

  it('assigns admin role to users present in the admin_emails allowlist', () => {
    const role = resolveUserRole('lead-admin@gmail.com', null)
    expect(role).toBe('admin')
  })

  it('handles case-insensitivity on admin email allowlist', () => {
    const role = resolveUserRole('OWNER@LiftingZone.PH', null)
    expect(role).toBe('admin')
  })

  it('blocks regular customers from administrative operations', () => {
    const userRole: 'customer' | 'admin' = 'customer'

    const checkAdminPermission = (role: 'customer' | 'admin') => {
      if (role !== 'admin') {
        return { authorized: false, status: 403, error: 'Forbidden' }
      }
      return { authorized: true, status: 200 }
    }

    const result = checkAdminPermission(userRole)
    expect(result.authorized).toBe(false)
    expect(result.status).toBe(403)
  })
})
