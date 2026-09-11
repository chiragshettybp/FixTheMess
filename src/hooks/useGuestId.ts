import { useCallback } from 'react';

const GUEST_ID_KEY = 'fix-the-mess-guest-id';

const generateGuestId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useGuestId = () => {
  const getGuestId = useCallback((): string => {
    let guestId = localStorage.getItem(GUEST_ID_KEY);
    if (!guestId) {
      guestId = generateGuestId();
      localStorage.setItem(GUEST_ID_KEY, guestId);
    }
    return guestId;
  }, []);

  const clearGuestId = useCallback(() => {
    localStorage.removeItem(GUEST_ID_KEY);
  }, []);

  return { getGuestId, clearGuestId };
};