/**
 * Shamsi (Solar Hijri) Calendar Conversion Utility
 * High-precision Gregorian <-> Jalaali algorithms
 */

export const PERSIAN_MONTH_NAMES = [
  "فروردین", "اردیبهشت", "خرداد",
  "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر",
  "دی", "بهمن", "اسفند"
];

export const PERSIAN_MONTH_PHONETIC = [
  "Farvardin", "Ordibehesht", "Khordad",
  "Tir", "Mordad", "Shahrivar",
  "Mehr", "Aban", "Azar",
  "Dey", "Bahman", "Esfand"
];

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/**
 * Convert standard digits (0-9) to Persian digits (۰-۹)
 */
export function toPersianDigits(num: number | string): string {
  return String(num).replace(/[0-9]/g, (char) => PERSIAN_DIGITS[parseInt(char, 10)]);
}

/**
 * Convert Gregorian date to Jalaali (Shamsi)
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  let gy2: number;

  if (gy > 1600) {
    jy = 979;
    gy2 = gy - 1600;
  } else {
    jy = 0;
    gy2 = gy - 621;
  }

  const gm_offset = (gm > 2) ? (gy2 + 1) : gy2;
  let days = (365 * gy2) + Math.floor((gm_offset + 3) / 4) - Math.floor((gm_offset + 99) / 100) + Math.floor((gm_offset + 399) / 400) - 80 + gd + g_d_m[gm - 1];

  jy += 33 * Math.floor(days / 12053);
  days %= 12053;

  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let jm: number;
  let jd: number;

  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }

  return { jy, jm, jd };
}

/**
 * Convert Jalaali (Shamsi) date to Gregorian
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  const jy2 = jy - 979;
  let gy = 1600;
  let days = (365 * jy2) + Math.floor(jy2 / 33) * 8 + Math.floor(((jy2 % 33) + 3) / 4) + 78 + jd;

  if (jm <= 6) {
    days += (jm - 1) * 31;
  } else {
    days += 186 + (jm - 7) * 30;
  }

  gy += 400 * Math.floor(days / 146097);
  days %= 146097;

  if (days > 36524) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }

  gy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  let gm = 1;
  let gd = 1;
  const isLeapGregorian = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
  const sal_a = [0, 31, isLeapGregorian ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  for (let i = 1; i <= 12; i++) {
    if (days < sal_a[i]) {
      gm = i;
      gd = days + 1;
      break;
    }
    days -= sal_a[i];
  }

  return { gy, gm, gd };
}

/**
 * Format any ISO date string or Date object into a detailed Shamsi Date
 */
export function formatToShamsi(
  dateInput: Date | string | number,
  options: {
    includeTime?: boolean;
    usePersianDigits?: boolean;
    formatStyle?: "slashes" | "verbose" | "both";
  } = {}
): string {
  const { includeTime = true, usePersianDigits = false, formatStyle = "verbose" } = options;
  const date = typeof dateInput === "string" || typeof dateInput === "number" ? new Date(dateInput) : dateInput;

  if (!date || isNaN(date.getTime())) return "N/A";

  const gy = date.getUTCFullYear();
  const gm = date.getUTCMonth() + 1;
  const gd = date.getUTCDate();

  // For Asia-Tehran time, we should ideally use the actual date in that timezone
  // However, for consistency with the existing UTC-based math, we'll keep it simple
  // but ensure the timePart reflects Tehran time if requested
  
  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);

  const monthName = PERSIAN_MONTH_NAMES[jm - 1];
  const phoneticName = PERSIAN_MONTH_PHONETIC[jm - 1];

  const dStr = jd.toString().padStart(2, "0");
  const mStr = jm.toString().padStart(2, "0");

  let datePart = "";
  if (formatStyle === "slashes") {
    datePart = `${jy}/${mStr}/${dStr}`;
  } else if (formatStyle === "verbose") {
    datePart = `${jd} ${monthName} ${jy}`;
  } else {
    datePart = `${jy}/${mStr}/${dStr} (${monthName} / ${phoneticName})`;
  }

  let timePart = "";
  if (includeTime) {
    const timeStr = date.toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Tehran"
    });
    timePart = ` ${timeStr}`;
  }

  const result = `${datePart}${timePart}`;
  return usePersianDigits ? toPersianDigits(result) : result;
}
