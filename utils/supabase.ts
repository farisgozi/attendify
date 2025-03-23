import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://waswfhyjdxsbsunwsiey.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indhc3dmaHlqZHhzYnN1bndzaWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3MzY5NDQsImV4cCI6MjA1ODMxMjk0NH0.rrpMzBXfCXAuC14TUo2fC8CgYpd3q1LmlRQ2RHhZEUE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})