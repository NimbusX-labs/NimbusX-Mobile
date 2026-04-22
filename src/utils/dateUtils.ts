import { format, isToday, isYesterday } from 'date-fns';

export const formatMessageTime = (timestamp: number) => {
  return format(new Date(timestamp), 'HH:mm');
};

export const formatChatTimestamp = (timestamp?: number) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);

  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'dd/MM/yy');
  }
};
