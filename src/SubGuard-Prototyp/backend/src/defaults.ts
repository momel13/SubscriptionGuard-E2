import type { SupabaseRequestClient } from './supabase.js';

export const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Streaming', icon: '🎬', color: '#a855f7' },
  { id: 2, name: 'Musik', icon: '🎧', color: '#22d3ee' },
  { id: 3, name: 'Software', icon: '💻', color: '#6366f1' },
  { id: 4, name: 'Cloud', icon: '☁️', color: '#0ea5e9' },
  { id: 5, name: 'Fitness', icon: '💪', color: '#10b981' },
  { id: 6, name: 'Gaming', icon: '🎮', color: '#ef4444' },
  { id: 7, name: 'News', icon: '📰', color: '#f59e0b' },
];

export async function ensureDefaultCategories(db: SupabaseRequestClient) {
  const current = await db
    .from('categories')
    .select('*')
    .order('id', { ascending: true });

  if (current.error) {
    return current;
  }

  if (current.data && current.data.length > 0) {
    return current;
  }

  return db
    .from('categories')
    .upsert(DEFAULT_CATEGORIES.map(({ name, icon, color }) => ({ name, icon, color })), { onConflict: 'name' })
    .select('*')
    .order('id', { ascending: true });
}
