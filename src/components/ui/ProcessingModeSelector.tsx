import React from "react";
import { Cloud, Lock } from "lucide-react";

interface ProcessingModeSelectorProps {
  useLocalWhisper: boolean;
  setUseLocalWhisper: (value: boolean) => void;
  className?: string;
}

export default function ProcessingModeSelector({
  useLocalWhisper,
  setUseLocalWhisper,
  className = "",
}: ProcessingModeSelectorProps) {
  return (
    <div className={`grid grid-cols-1 gap-3 md:grid-cols-2 ${className}`}>
      <button
        onClick={() => setUseLocalWhisper(false)}
        className={`cursor-pointer rounded-xl border-2 p-4 text-left transition-all ${
          !useLocalWhisper
            ? "border-indigo-500 bg-indigo-50"
            : "border-neutral-200 bg-white hover:border-neutral-300"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="h-6 w-6 text-blue-600" />
            <h4 className="font-medium text-neutral-900">Cloud Processing</h4>
          </div>
          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-600">
            Fastest
          </span>
        </div>
        <p className="text-sm text-neutral-600">
          Audio sent to OpenAI servers. Faster processing, requires API key.
        </p>
      </button>

      <button
        onClick={() => setUseLocalWhisper(true)}
        className={`cursor-pointer rounded-xl border-2 p-4 text-left transition-all ${
          useLocalWhisper
            ? "border-indigo-500 bg-indigo-50"
            : "border-neutral-200 bg-white hover:border-neutral-300"
        }`}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-blue-600" />
            <h4 className="font-medium text-neutral-900">Local Processing</h4>
          </div>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">Private</span>
        </div>
        <p className="text-sm text-neutral-600">
          Audio stays on your device. Complete privacy, works offline.
        </p>
      </button>
    </div>
  );
}
