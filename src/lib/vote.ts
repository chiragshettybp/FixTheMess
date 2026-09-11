import { supabase } from '@/integrations/supabase/client';

const isAuthBlocked = (error: any): boolean => {
  if (!error) return false;
  const code = error.code || '';
  const status = error.status;
  const message = (error.message || '') as string;
  return (
    code === '42501' ||
    code === '22P02' ||
    status === 401 ||
    status === 403 ||
    /row-level security|permission denied|jwt|invalid.*token|expired/i.test(message)
  );
};

export interface ToggleVoteResult {
  error: any;
  role: 'authenticated' | 'guest';
}

export const toggleVote = async (
  reportId: string,
  viewedVoted: boolean,
  user: { id: string } | null,
  getGuestId: () => string
): Promise<ToggleVoteResult> => {
  if (user) {
    const remove = () =>
      supabase.from('votes').delete().eq('report_id', reportId).eq('user_id', user.id);
    const add = () =>
      supabase.from('votes').insert({ report_id: reportId, user_id: user.id });

    const { error } = viewedVoted ? await remove() : await add();
    if (!error) return { error: null, role: 'authenticated' };

    if (!isAuthBlocked(error)) return { error, role: 'authenticated' };

    console.warn('Authenticated vote rejected by RLS/auth, falling back to guest vote:', error);
  }

  const guestId = getGuestId();
  const guestRemove = () =>
    supabase.from('votes').delete().eq('report_id', reportId).eq('anon_id', guestId);
  const guestAdd = () =>
    supabase.from('votes').insert({ report_id: reportId, anon_id: guestId });

  const { error } = viewedVoted ? await guestRemove() : await guestAdd();
  return { error: error || null, role: 'guest' };
};