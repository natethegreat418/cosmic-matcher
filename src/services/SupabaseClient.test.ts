import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('SupabaseClient', () => {
  it('should have valid Supabase URL environment variable', () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    expect(url).toBeDefined();
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });

  it('should have valid Supabase anon key environment variable', () => {
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    expect(key).toBeDefined();
    expect(key.length).toBeGreaterThan(0);
  });

  it('should create a valid Supabase client', () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const client = createClient(url, key);
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it('should export supabase client from module', async () => {
    const { supabase } = await import('./SupabaseClient');
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });
});
