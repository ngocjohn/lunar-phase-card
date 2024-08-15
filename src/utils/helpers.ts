export function formatMoonTime(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today ${timeString}`;
  } else if (isYesterday) {
    return `Yesterday ${timeString}`;
  } else {
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

export function formatRelativeTime(dateString: string): { key: string; value?: string } {
  const date = new Date(dateString);
  const now = new Date();

  const timeDifference = date.getTime() - now.getTime();
  const hoursDifference = Math.round(timeDifference / (1000 * 60 * 60)); // Convert milliseconds to hours
  const daysDifference = Math.round(timeDifference / (1000 * 60 * 60 * 36)); // Convert milliseconds to days

  if (Math.abs(daysDifference) < 1) {
    if (hoursDifference === 0) {
      const minutesDifference = Math.round(timeDifference / (1000 * 60));
      if (minutesDifference === 0) {
        return { key: 'card.relativeTime.justNow' };
      } else if (minutesDifference > 0) {
        return { key: 'card.relativeTime.inMinutes', value: minutesDifference.toString() };
      } else {
        return { key: 'card.relativeTime.minutesAgo', value: Math.abs(minutesDifference).toString() };
      }
    } else if (hoursDifference > 0) {
      return { key: 'card.relativeTime.inHours', value: hoursDifference.toString() };
    } else {
      return { key: 'card.relativeTime.hoursAgo', value: Math.abs(hoursDifference).toString() };
    }
  } else {
    // Handle longer timespans if necessary, otherwise return an empty key
    return { key: '' };
  }
}

export function formatTimeToHHMM(dateString: string, lang: string, timeFormat: boolean): string {
  if (!dateString || dateString === '') {
    return '';
  }
  const date = new Date(dateString);
  return date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', hour12: timeFormat });
}

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
