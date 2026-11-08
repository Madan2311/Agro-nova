const CATEGORY_COLORS: Record<string, string> = {
  fertilizantes: '#b7791f',
  semillas: '#2f855a',
  agroquimicos: '#c05621',
  herramientas: '#3b6b8f',
  'alimento animal': '#9c4a3b',
};

export const CATEGORIES: readonly string[] = [
  'Fertilizantes',
  'Semillas',
  'Agroquímicos',
  'Herramientas',
  'Alimento Animal',
];

const FALLBACK_COLOR = '#6b7a70';

export function categoryColor(name: string | null | undefined): string {
  if (!name) return FALLBACK_COLOR;
  const key = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  return CATEGORY_COLORS[key] ?? FALLBACK_COLOR;
}

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCop(value: number | null | undefined): string {
  return typeof value === 'number' ? copFormatter.format(value) : '—';
}

export type StockLevel = 'out' | 'low' | 'ok';

export const LOW_STOCK_THRESHOLD = 10;

export function stockLevel(stock: number | null | undefined): StockLevel {
  if (typeof stock !== 'number' || stock <= 0) return 'out';
  return stock <= LOW_STOCK_THRESHOLD ? 'low' : 'ok';
}

export const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Activos' },
  { value: 'false', label: 'Inactivos' },
] as const;

export const STOCK_OPTIONS = [
  { value: '', label: 'Cualquiera' },
  { value: 'ok', label: 'Disponible' },
  { value: 'low', label: 'Stock bajo' },
  { value: 'out', label: 'Agotado' },
] as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Más recientes' },
  { value: 'name_asc', label: 'Nombre (A–Z)' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'stock_asc', label: 'Menos stock primero' },
] as const;

export function stockLabel(stock: number | null | undefined): string {
  if (stock == null) return '—';
  const level = stockLevel(stock);
  if (level === 'out') return 'Agotado';
  const units = `${stock} ${stock === 1 ? 'unidad' : 'unidades'}`;
  return level === 'low' ? `${units} · Stock bajo` : units;
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
});

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}