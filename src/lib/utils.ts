export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export function getNumberColor(num: number): string {
  if (num <= 10) return '#FACC15';
  if (num <= 20) return '#3B82F6';
  if (num <= 30) return '#EF4444';
  if (num <= 40) return '#9CA3AF';
  return '#22C55E';
}

export function getNumberColorClass(num: number): string {
  if (num <= 10) return 'bg-yellow-400 text-gray-900';
  if (num <= 20) return 'bg-blue-500 text-white';
  if (num <= 30) return 'bg-red-500 text-white';
  if (num <= 40) return 'bg-gray-400 text-white';
  return 'bg-green-500 text-white';
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}