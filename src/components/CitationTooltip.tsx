import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

type CitationInfo = {
  citedText: string;
  sourceUrl: string;
};

export function CitationTooltip({ citation }: { citation: CitationInfo }) {
  const fullSourceUrl = `https://80000hours.org${citation.sourceUrl}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="border-b border-dotted border-slate-400 cursor-help">
          <Info />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <div className="grid gap-2">
          <p className="text-sm text-slate-600">Cited from:</p>
          <a
            href={fullSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {citation.sourceUrl}
          </a>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
