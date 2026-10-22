import { describe, it, expect } from 'vitest'

// Verification of MIME header sanitization and HTML escaping logic
function sanitizeHeader(val: string): string {
  return val.replace(/[\r\n]/g, '').trim()
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

describe('MIME Header Injection & HTML Sanitization', () => {
  it('strips CR and LF characters to prevent header injection', () => {
    const maliciousRecipient = 'victim@example.com\r\nBcc: attacker@evil.com\r\nSubject: Injected'
    const cleanRecipient = sanitizeHeader(maliciousRecipient)

    expect(cleanRecipient).not.toContain('\r')
    expect(cleanRecipient).not.toContain('\n')
    expect(cleanRecipient).toBe('victim@example.comBcc: attacker@evil.comSubject: Injected')
  })

  it('sanitizes malicious script and HTML tags in order content', () => {
    const untrustedName = '<script>alert("hacked")</script>'
    const escaped = escapeHtml(untrustedName)

    expect(escaped).toBe('&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;')
    expect(escaped).not.toContain('<script>')
  })

  it('correctly escapes quotes and ampersands', () => {
    const payload = 'Hammer & "Smith" Machine\'s Heavy Iron'
    const escaped = escapeHtml(payload)

    expect(escaped).toBe('Hammer &amp; &quot;Smith&quot; Machine&#39;s Heavy Iron')
  })
})
