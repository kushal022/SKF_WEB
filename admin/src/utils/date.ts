export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr || dateStr.startsWith('0000-00-00')) {
    return '—';
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return '—';
  }

  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const formattedHours = hours.toString().padStart(2, '0');

  return `${day} ${month} ${year}, ${formattedHours}:${minutes} ${ampm}`;
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr || dateStr.startsWith('0000-00-00')) {
    return '—';
  }

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return '—';
  }

  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}
