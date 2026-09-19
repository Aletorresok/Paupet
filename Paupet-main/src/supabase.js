import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://qelrwbavnrxdlxfckehz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHJ3YmF2bnJ4ZGx4ZmNrZWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDY0MzAsImV4cCI6MjA4NzcyMjQzMH0.6zwvLG4ngQsv-0b3W299FvPOvpyc5QwbYkHsx6pAQGc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
