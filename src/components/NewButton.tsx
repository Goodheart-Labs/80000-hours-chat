"use client";

import { Plus } from "lucide-react";

export function NewButton() {
  return (
    <button
      onClick={() => {
        // Reload
        window.location.reload();
      }}
      className="lg:hidden inline-flex items-center justify-center ml-4"
    >
      <Plus className="h-9 w-9 text-white/90 hover:text-white transition-colors" />
    </button>
  );
}
