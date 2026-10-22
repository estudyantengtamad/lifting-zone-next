import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env.local')

let env = process.env
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (match) {
      let val = match[2] || ''
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
      env[match[1]] = val.trim()
    }
  })
}

const clientId = env.GMAIL_CLIENT_ID
const clientSecret = env.GMAIL_CLIENT_SECRET
const refreshToken = env.GMAIL_REFRESH_TOKEN

async function check() {
  if (!clientId || !clientSecret || !refreshToken) {
    console.error('Missing Gmail OAuth credentials in environment or .env.local')
    process.exit(1)
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    })
  })
  const d = await res.json()
  console.log('Token response:', { ok: !!d.access_token, scope: d.scope, error: d.error })

  if (d.access_token) {
    const infoRes = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + d.access_token)
    const info = await infoRes.json()
    console.log('Token info:', info)
  }
}

check()
