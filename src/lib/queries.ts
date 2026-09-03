import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './supabase/database.types'
import type { FriendRequest } from './types'

/**
 * Pending requests addressed to `me`, newest shape already flattened.
 *
 * Runs on the server when the chat page renders and in the browser when a
 * realtime notification arrives, so it takes whichever client the caller
 * already holds rather than reaching for one itself.
 */
export async function fetchPendingRequests(
  supabase: SupabaseClient<Database>,
  me: string,
): Promise<FriendRequest[]> {
  const { data } = await supabase
    .from('friendships')
    .select('requester_id, profiles!friendships_requester_id_fkey(username)')
    .eq('addressee_id', me)
    .eq('status', 'pending')

  return (data ?? []).map((row) => ({
    requester_id: row.requester_id,
    username: row.profiles?.username ?? 'unknown',
  }))
}
