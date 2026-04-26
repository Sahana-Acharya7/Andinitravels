const fs = require('node:fs')
const path = require('node:path')
const { initializeApp, cert, getApps } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

function readServiceAccount() {
  const relativePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json'
  const resolvedPath = path.resolve(process.cwd(), relativePath)

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `Service account file not found at ${resolvedPath}. Set FIREBASE_SERVICE_ACCOUNT_PATH or place the JSON there.`,
    )
  }

  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'))
}

async function main() {
  const uid = process.argv[2] || process.env.FIREBASE_TARGET_UID

  if (!uid) {
    throw new Error('Pass the Firebase UID as the first argument, for example: npm run set:supabase-role -- your-uid')
  }

  const serviceAccount = readServiceAccount()

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
    })
  }

  const auth = getAuth()
  const user = await auth.getUser(uid)
  const nextClaims = {
    ...(user.customClaims || {}),
    role: 'authenticated',
  }

  await auth.setCustomUserClaims(uid, nextClaims)
  console.log(`Set role=authenticated for ${user.email || uid}`)
  console.log('Sign out and sign back in to refresh the ID token.')
}

main().catch(error => {
  console.error(error.message || error)
  process.exit(1)
})
