import React, { useState } from "react";
import { formatToShamsi } from "../utils/shamsi";

interface ShamsiDateDisplayProps {
  /**
   * Gregorian Date object, ISO string, or millisecond timestamp
   */
  date: Date | string | number;
  /**
   * Optional custom classes to apply to the container
   */
  className?: string;
  /**
   * Whether to include the hour and minute in the string
   */
  includeTime?: boolean;
  /**
   * Layout style format to use for the date text
   */
  formatStyle?: "slashes" | "verbose" | "both";
  /**
   * Optional initial state for Persian digits. Defaults to false.
   */
  initialPersianDigits?: boolean;
}

/**
 * Reusable Shamsi Date Display Component
 * Renders Gregorian dates formatted into Persian Jalaali (Solar Hijri) calendar dates
 * with an interactive digit toggle (Persian/Western) for optimal localization.
 */
export default function ShamsiDateDisplay({
  date,
  className = "",
  includeTime = true,
  formatStyle = "both",
  initialPersianDigits = false,
}: ShamsiDateDisplayProps) {
  const [persianDigits, setPersianDigits] = useState<boolean>(initialPersianDigits);

  const formatted = formatToShamsi(date, {
    includeTime,
    usePersianDigits: persianDigits,
    formatStyle,
  });

  return (
    <div
      id="shamsi-date-display-badge"
      className={`inline-flex items-center gap-2 bg-gray-950/40 hover:bg-gray-950/60 border border-gray-800/80 rounded px-2 py-0.5 text-[11px] font-mono transition text-gray-300 ${className}`}
    >
      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded uppercase tracking-wider">
        Shamsi
      </span>
      <span className="leading-none">{formatted}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPersianDigits(!persianDigits);
        }}
        title="Toggle Persian/English numeral sets"
        className="text-[9px] text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition px-1 py-0.2 rounded border border-gray-800 font-bold bg-gray-900 cursor-pointer select-none"
      >
        {persianDigits ? "۱۲۳" : "123"}
      </button>
    </div>
  );
}
