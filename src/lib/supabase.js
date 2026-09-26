import { createClient } from '@supabase/supabase-js'
import { crearSupabaseDemo } from './demo/fakeSupabase'

const SUPABASE_URL = 'https://qelrwbavnrxdlxfckehz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHJ3YmF2bnJ4ZGx4ZmNrZWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDY0MzAsImV4cCI6MjA4NzcyMjQzMH0.6zwvLG4ngQsv-0b3W299FvPOvpyc5QwbYkHsx6pAQGc'

// Modo demo (`npm run demo`): datos ficticios en el navegador, sin conectarse a la base real.
// Se decide al compilar, así que un build normal (Vercel) nunca puede entrar en modo demo.
export const MODO_DEMO = import.meta.env.VITE_DEMO === '1'

export const supabase = MODO_DEMO ? crearSupabaseDemo() : createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
