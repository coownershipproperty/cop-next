import { createClient } from '@supabase/supabase-js';

// Fallback values ensure cop-crm builds succeed without env vars configured.
// These are NEXT_PUBLIC_ (anon) keys — safe to embed in source; they are
// already shipped to the browser and carry no elevated privileges.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdHp6b3h5Y2tweWF0enFjamJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDE5OTEsImV4cCI6MjA5MjA3Nzk5MX0.6B_iQk8bqwFLkeB8Nl1qpiZRdXfRLPzw1Pea4Uxyrwo';

export const supabase = createClient(supabaseUrl, supabaseKey);
