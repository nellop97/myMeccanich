// src/utils/calendarGrid.ts - Calcoli del calendario, uguali su ogni piattaforma

export const MONTH_NAMES = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

export const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isSameDay = (a?: Date | null, b?: Date | null) =>
  !!a && !!b && startOfDay(a).getTime() === startOfDay(b).getTime();

// Sempre sei settimane da lunedì: l'altezza del calendario non cambia tra i mesi
export const buildMonthGrid = (year: number, month: number): CalendarDay[] => {
  const firstOfMonth = new Date(year, month, 1);
  const daysBeforeMonth = (firstOfMonth.getDay() + 6) % 7;

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, index - daysBeforeMonth + 1);
    return { date, isCurrentMonth: date.getMonth() === month };
  });
};

export const isDayAllowed = (date: Date, minimumDate?: Date, maximumDate?: Date) => {
  const day = startOfDay(date).getTime();
  if (minimumDate && day < startOfDay(minimumDate).getTime()) return false;
  if (maximumDate && day > startOfDay(maximumDate).getTime()) return false;
  return true;
};

export const isMonthAllowed = (year: number, month: number, minimumDate?: Date, maximumDate?: Date) => {
  const lastDay = new Date(year, month + 1, 0);
  const firstDay = new Date(year, month, 1);
  if (minimumDate && lastDay < startOfDay(minimumDate)) return false;
  if (maximumDate && firstDay > startOfDay(maximumDate)) return false;
  return true;
};

export const buildYearRange = (minimumDate?: Date, maximumDate?: Date) => {
  const currentYear = new Date().getFullYear();
  const first = minimumDate?.getFullYear() ?? currentYear - 80;
  const last = maximumDate?.getFullYear() ?? currentYear + 20;
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
};

// Giorno scelto con l'ora data: senza un'ora precedente si usa mezzogiorno, così la
// conversione in UTC di toISOString non sposta la data al giorno prima
export const withDay = (day: Date, time?: Date | null) =>
  new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    time ? time.getHours() : 12,
    time ? time.getMinutes() : 0
  );

// Le date delle fatture sono testi AAAA-MM-GG
export const parseDayString = (value?: string) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : null;
};

export const toDayString = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
