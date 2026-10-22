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

const clientId = env.GMAIL_CLIENT_ID || 'your-gmail-client-id'
const clientSecret = env.GMAIL_CLIENT_SECRET || 'your-gmail-client-secret'

const code = process.argv[2]

if (!code) {
  console.log(`
=============================================================================
  GMAIL API REFRESH TOKEN GENERATOR
=============================================================================

Option A: Google OAuth 2.0 Playground (Fastest)
1. In Google Cloud Console (Credentials > your OAuth Client):
   Add this Authorized Redirect URI:
   👉 https://developers.google.com/oauthplayground

2. Open https://developers.google.com/oauthplayground
   - Click the gear icon ⚙️ (top right)
   - Check "Use your own OAuth credentials"
   - Paste Client ID: ${clientId}
   - Paste Client Secret: ${clientSecret}
   - Close the gear menu.

3. Under Step 1 (left pane):
   - In "Input your own scopes" paste: https://www.googleapis.com/auth/gmail.send
   - Click "Authorize APIs" and sign in with the store Gmail.

4. Under Step 2:
   - Click "Exchange authorization code for tokens"
   - Copy the "Refresh token" and paste it into .env.local (GMAIL_REFRESH_TOKEN)
   OR run: node scripts/get-refresh-token.mjs <PASTE_REFRESH_TOKEN_OR_AUTH_CODE>
=============================================================================
`)
  process.exit(0)
}

async function exchangeOrSave() {
  if (code.startsWith('1//') || code.length > 50 && !code.startsWith('4/')) {
    // Looks like a refresh token already
    console.log('Detected refresh token! Saving to .env.local...')
    saveRefreshToken(code)
    return
  }

  // Otherwise try exchanging auth code
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: 'https://developers.google.com/oauthplayground'
      })
    })

    const data = await res.json()
    if (data.refresh_token) {
      console.log('Successfully acquired refresh token:', data.refresh_token)
      saveRefreshToken(data.refresh_token)
    } else {
      console.error('Exchange failed:', data)
    }
  } catch (err) {
    console.error('Error exchanging code:', err)
  }
}

function saveRefreshToken(token) {
  if (!fs.existsSync(envPath)) return
  let content = fs.readFileSync(envPath, 'utf8')
  content = content.replace(/GMAIL_REFRESH_TOKEN=.*/, `GMAIL_REFRESH_TOKEN=${token.trim()}`)
  fs.writeFileSync(envPath, content, 'utf8')
  console.log('✅ GMAIL_REFRESH_TOKEN updated in frontend/.env.local!')
}

exchangeOrSave()
