import { createClient } from '@supabase/supabase-js'
import { auth } from './firebase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabaseClient = null

export const DRIVER_UPLOAD_BUCKET =
  import.meta.env.VITE_SUPABASE_DRIVER_BUCKET || 'driver-documents'

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before uploading driver files.')
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => {
        const currentUser = auth.currentUser
        return currentUser ? currentUser.getIdToken() : null
      },
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  }

  return supabaseClient
}
