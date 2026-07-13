export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - value.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return formatDate(value);
}

export function formatShortDateTime(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const time = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);

  if (value.toDateString() === now.toDateString()) return time;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (value.toDateString() === yesterday.toDateString()) return `вчера ${time}`;

  const datePart = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(value);

  return `${datePart} ${time}`;
}
