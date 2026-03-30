const kesFormatter = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

const compactKesFormatter = new Intl.NumberFormat("en-KE", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-KE", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatKes(amount: number) {
  return kesFormatter.format(amount);
}

export function formatCompactKes(amount: number) {
  return `KES ${compactKesFormatter.format(amount)}`;
}

export function formatDateLabel(value: string) {
  return dateFormatter.format(new Date(value));
}
