import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side only (API routes) — uses service role to bypass RLS for reads
export function createServiceClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY!);
}
