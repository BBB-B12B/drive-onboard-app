"use client";

import { useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, UploadCloud } from "lucide-react";
import type { DailyReportResponseSlot } from "@/lib/daily-report";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyReportSlotCardProps {
  slot: DailyReportResponseSlot;
  uploading: boolean;
  deleting: boolean;
  onSelectFile: (file: File) => void;
  onDelete: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function DailyReportSlotCard({
  slot,
  uploading,
  deleting,
  onSelectFile,
  onDelete,
  disabled,
  disabledReason,
}: DailyReportSlotCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSelectFile(file);
    }
  };

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const isBusy = uploading || deleting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{slot.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          {slot.url ? (
            <>
              <img
                src={slot.url}
                alt={slot.label}
                className="aspect-video w-full rounded-md object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={onDelete}
                disabled={isBusy || disabled}
                aria-label="Delete image"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/40">
              <p className="text-sm text-muted-foreground">No image uploaded</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="truncate pr-2">{slot.fileName || "ยังไม่มีไฟล์"}</span>
          <span>{slot.uploadedAt ? format(new Date(slot.uploadedAt), "PPp") : "-"}</span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isBusy || disabled}
        />
        <Button
          className="w-full"
          onClick={handleUploadClick}
          disabled={isBusy || disabled}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="mr-2 h-4 w-4" />
          )}
          {slot.url ? "Replace Image" : "Upload Image"}
        </Button>
        {disabled && disabledReason && (
          <p className="text-xs text-center text-destructive">{disabledReason}</p>
        )}
      </CardContent>
    </Card>
  );
}

DailyReportSlotCard.Skeleton = function DailyReportSlotCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-2/4" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
};
