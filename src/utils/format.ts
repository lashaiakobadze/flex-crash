export const truncateNickname = (nickname: string, maxLength: number = 12): string => {
  if (!nickname) return "";
  return nickname.length > maxLength ? `${nickname.slice(0, maxLength)}...` : nickname;
};
