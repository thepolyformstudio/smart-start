import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mfehhqgctkgeuzlokhlt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mZWhocWdjdGtnZXV6bG9raGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NDc1MDksImV4cCI6MjA5NzAyMzUwOX0.xexqTcuMtmzdlVQTIQQC_UIPkXMoUMz_vuoDPlYq6JU'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase
    .from('mistakes')
    .select('id, mistake, subjects(name), review_date')
    .eq('review_date', '2026-06-16')
    .eq('is_corrected', false)

  console.log("Error:", error)
  console.log("Data:", JSON.stringify(data, null, 2))
}

test()
