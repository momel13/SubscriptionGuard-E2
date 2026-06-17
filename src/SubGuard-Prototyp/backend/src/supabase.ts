import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase');
}

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  clientOptions
);

export function createSupabaseForAccessToken(accessToken: string) {
  return createClient(supabaseUrl!, supabaseKey!, {
    ...clientOptions,
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export type SupabaseRequestClient = ReturnType<typeof createSupabaseForAccessToken>;
