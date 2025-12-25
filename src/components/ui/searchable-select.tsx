import * as React from "react";
import { ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
};

export type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  allowClear?: boolean;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
};

export const SearchableSelect = React.forwardRef<HTMLButtonElement, SearchableSelectProps>(({
  options,
  value,
  onChange,
  placeholder = "เลือกตัวเลือก...",
  searchPlaceholder = "ค้นหา...",
  emptyLabel = "ไม่พบข้อมูล",
  allowClear = false,
  disabled,
  className,
  contentClassName,
}, ref) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const filteredOptions = React.useMemo(() => {
    if (!query.trim()) {
      return options;
    }
    const lowerQuery = query.trim().toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(lowerQuery) ||
        option.value.toLowerCase().includes(lowerQuery) ||
        option.description?.toLowerCase().includes(lowerQuery)
    );
  }, [options, query]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !selectedOption && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[280px] p-2", contentClassName)}
        align="start"
      >
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
          />
          {allowClear && value && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">ล้างค่า</span>
            </Button>
          )}
        </div>
        <ScrollArea className="mt-2 max-h-60 rounded-md border">
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {emptyLabel}
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex w-full flex-col items-start gap-1 rounded-sm px-3 py-2 text-left text-sm hover:bg-accent",
                      isSelected && "bg-accent"
                    )}
                  >
                    <span className="font-medium leading-none">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
});
SearchableSelect.displayName = "SearchableSelect";
