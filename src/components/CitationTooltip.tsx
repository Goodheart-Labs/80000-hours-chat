import { Quote } from "lucide-react";
import { Trigger } from "@radix-ui/react-popover";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Citation } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { memo } from "react";

export const CitationPopover = memo(function CitationPopover(
  citation: Citation,
) {
  const fullSourceUrl = `https://80000hours.org${citation.document_title}`;

  return (
    <Popover>
      <Trigger className="text-green-500 hover:text-green-700 align-middle bg-green-100 hover:bg-green-200 rounded-full p-1 mr-1">
        <Quote className="w-3 h-3" fill="currentColor" />
      </Trigger>
      <PopoverContent className="overflow-y-auto max-h-[300px] prose prose-sm shadow-lg bg-slate-50 border-slate-500/50 border-2">
        <p>
          <a href={fullSourceUrl} target="_blank" rel="noopener noreferrer">
            {fullSourceUrl}
          </a>
        </p>
        <ReactMarkdown>{citation.cited_text}</ReactMarkdown>
      </PopoverContent>
    </Popover>
  );
});
