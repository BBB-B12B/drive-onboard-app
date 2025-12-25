import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTHS = [
  { value: "0", label: "มกราคม" },
  { value: "1", label: "กุมภาพันธ์" },
  { value: "2", label: "มีนาคม" },
  { value: "3", label: "เมษายน" },
  { value: "4", label: "พฤษภาคม" },
  { value: "5", label: "มิถุนายน" },
  { value: "6", label: "กรกฎาคม" },
  { value: "7", label: "สิงหาคม" },
  { value: "8", label: "กันยายน" },
  { value: "9", label: "ตุลาคม" },
  { value: "10", label: "พฤศจิกายน" },
  { value: "11", label: "ธันวาคม" },
];

const defaultFromYear = new Date().getFullYear() - 80;
const defaultToYear = new Date().getFullYear() + 20;

const getDaysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

export type DateWheelPickerProps = {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  fromYear?: number;
  toYear?: number;
  disabled?: boolean;
  className?: string;
  dayPlaceholder?: string;
  monthPlaceholder?: string;
  yearPlaceholder?: string;
};

export const DateWheelPicker = React.forwardRef<HTMLDivElement, DateWheelPickerProps>(({
  value,
  onChange,
  fromYear = defaultFromYear,
  toYear = defaultToYear,
  disabled,
  className,
  dayPlaceholder = "วัน",
  monthPlaceholder = "เดือน",
  yearPlaceholder = "ปี",
}, ref) => {
  const [year, setYear] = React.useState<number | undefined>(
    value?.getFullYear()
  );
  const [month, setMonth] = React.useState<number | undefined>(
    value?.getMonth()
  );
  const [day, setDay] = React.useState<number | undefined>(value?.getDate());

  React.useEffect(() => {
    if (!value) {
      setYear(undefined);
      setMonth(undefined);
      setDay(undefined);
      return;
    }
    setYear(value.getFullYear());
    setMonth(value.getMonth());
    setDay(value.getDate());
  }, [value]);

  const yearOptions = React.useMemo(() => {
    const start = Math.min(fromYear, toYear);
    const end = Math.max(fromYear, toYear);
    const years: number[] = [];
    for (let y = end; y >= start; y -= 1) {
      years.push(y);
    }
    return years;
  }, [fromYear, toYear]);

  const dayCount =
    year !== undefined && month !== undefined
      ? getDaysInMonth(year, month)
      : 31;

  const dayOptions = React.useMemo(
    () => Array.from({ length: dayCount }, (_, index) => index + 1),
    [dayCount]
  );

  const emitValue = React.useCallback(
    (
      nextYear: number | undefined,
      nextMonth: number | undefined,
      nextDay: number | undefined
    ) => {
      if (
        nextYear !== undefined &&
        nextMonth !== undefined &&
        nextDay !== undefined
      ) {
        onChange(new Date(nextYear, nextMonth, nextDay));
      } else {
        onChange(undefined);
      }
    },
    [onChange]
  );

  const handleYearChange = (selectedYear: string) => {
    const nextYear = Number(selectedYear);
    let nextDay = day;
    if (month !== undefined && day !== undefined) {
      const maxDay = getDaysInMonth(nextYear, month);
      if (day > maxDay) {
        nextDay = maxDay;
        setDay(nextDay);
      }
    }
    setYear(nextYear);
    emitValue(nextYear, month, nextDay);
  };

  const handleMonthChange = (selectedMonth: string) => {
    const nextMonth = Number(selectedMonth);
    let nextDay = day;
    if (year !== undefined && day !== undefined) {
      const maxDay = getDaysInMonth(year, nextMonth);
      if (day > maxDay) {
        nextDay = maxDay;
        setDay(nextDay);
      }
    }
    setMonth(nextMonth);
    emitValue(year, nextMonth, nextDay);
  };

  const handleDayChange = (selectedDay: string) => {
    const nextDay = Number(selectedDay);
    setDay(nextDay);
    emitValue(year, month, nextDay);
  };

  return (
    <div
      ref={ref}
      className={cn("grid grid-cols-3 gap-2", className)}
      tabIndex={-1} // Allow programmatic focus
      style={{ outline: "none" }} // Visual cleanup for programmatic focus
    >
      <Select
        disabled={disabled}
        value={day !== undefined ? String(day) : undefined}
        onValueChange={handleDayChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={dayPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {dayOptions.map((dayOption) => (
            <SelectItem key={dayOption} value={String(dayOption)}>
              {dayOption}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        disabled={disabled}
        value={month !== undefined ? String(month) : undefined}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={monthPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {MONTHS.map((monthOption) => (
            <SelectItem key={monthOption.value} value={monthOption.value}>
              {monthOption.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        disabled={disabled}
        value={year !== undefined ? String(year) : undefined}
        onValueChange={handleYearChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={yearPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {yearOptions.map((yearOption) => (
            <SelectItem key={yearOption} value={String(yearOption)}>
              {yearOption + 543}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});
DateWheelPicker.displayName = "DateWheelPicker";
