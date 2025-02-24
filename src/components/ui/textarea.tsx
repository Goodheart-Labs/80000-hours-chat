import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, onChange, ...props }, ref) => {
  // Handle auto-resize on mount and value changes
  const handleResize = React.useCallback((element: HTMLTextAreaElement) => {
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, []);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      handleResize(textareaRef.current);
    }
  }, [handleResize, props.value]);

  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={(element) => {
        // Handle both refs
        if (typeof ref === "function") {
          ref(element);
        } else if (ref) {
          ref.current = element;
        }
        textareaRef.current = element;
      }}
      onChange={(e) => {
        if (onChange) {
          onChange(e);
        }
        handleResize(e.target);
      }}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
