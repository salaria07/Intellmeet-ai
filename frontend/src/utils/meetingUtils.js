/**
 * Generates canonical meeting invite URL using the environment's configured frontend base URL
 */
export const getMeetingInviteUrl = (meetingCode) => {
  if (!meetingCode) return '';
  const baseUrl =
    import.meta.env.VITE_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${baseUrl}/meetings/join/${meetingCode}`;
};
