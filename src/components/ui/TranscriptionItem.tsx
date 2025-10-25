import React from "react";
import { Button } from "./button";
import { Copy, Trash2 } from "lucide-react";
import type { TranscriptionItem as TranscriptionItemType } from "../../types/electron";

interface TranscriptionItemProps {
  item: TranscriptionItemType;
  index: number;
  total: number;
  onCopy: (text: string) => void;
  onDelete: (id: number) => void;
}

export default function TranscriptionItem({
  item,
  index,
  total,
  onCopy,
  onDelete,
}: TranscriptionItemProps) {
  return (
    <div className="relative rounded-xl bg-gradient-to-b from-blue-50/30 to-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-6 pl-16" style={{ paddingTop: "8px" }}>
        <div className="flex items-start justify-between">
          <div className="mr-3 flex-1">
            <div
              className="mb-1 flex items-center gap-2"
              style={{ marginTop: "2px", lineHeight: "24px" }}
            >
              <span className="text-xs font-medium text-indigo-600">#{total - index}</span>
              <div className="h-3 w-px bg-neutral-300" />
              <span className="text-xs text-neutral-500">
                {new Date(item.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p
              className="text-sm text-neutral-800"
              style={{
                fontFamily:
                  'Noto Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                lineHeight: "24px",
                textAlign: "left",
                marginTop: "2px",
                paddingBottom: "2px",
              }}
            >
              {item.text}
            </p>
          </div>
          <div className="flex flex-shrink-0 gap-1" style={{ marginTop: "2px" }}>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onCopy(item.text)}
              className="h-7 w-7"
            >
              <Copy size={12} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(item.id)}
              className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
