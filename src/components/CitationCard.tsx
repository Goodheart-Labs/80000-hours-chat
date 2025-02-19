import { Quote, Link as LinkIcon } from "lucide-react";
import { Trigger } from "@radix-ui/react-hover-card";
import { HoverCard, HoverCardContent } from "@/components/ui/hover-card";
import { Citation } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import { memo } from "react";
import Link from "next/link";

export const CitationCard = memo(function CitationPopover(citation: Citation) {
  const fullSourceUrl = `https://80000hours.org${citation.document_title}`;

  return (
    <HoverCard openDelay={0} closeDelay={0}>
      <Trigger asChild>
        <Link
          href={fullSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-500 hover:text-green-700 align-middle bg-green-100 hover:bg-green-200 rounded-full p-1 mr-1 inline-block"
        >
          <Quote className="w-3 h-3" fill="currentColor" />
        </Link>
      </Trigger>
      <HoverCardContent className="overflow-y-auto max-h-[300px] text-sm shadow-lg bg-white/90 border-none backdrop-blur-md citation-content">
        <ReactMarkdown
          components={{
            a: ({ href, children }) => {
              const fullHref = href?.startsWith("/")
                ? `https://80000hours.org${href}`
                : href;

              return (
                <a href={fullHref} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            },
            h1: ({ children }) => {
              return <span className="font-bold">{children}</span>;
            },
            h2: ({ children }) => {
              return <span className="font-bold">{children}</span>;
            },
            h3: ({ children }) => {
              return <span className="font-bold">{children}</span>;
            },
            h4: ({ children }) => {
              return <span className="font-bold">{children}</span>;
            },
            h5: ({ children }) => {
              return <span className="font-bold">{children}</span>;
            },
          }}
        >
          {citation.cited_text.trim()}
        </ReactMarkdown>
        <span className="flex items-center gap-1.5 mb-2">
          <LinkIcon className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
          <a
            href={fullSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-slate-400 truncate w-full hover:text-slate-500 transition-colors no-underline"
          >
            {citation.document_title}
          </a>
        </span>
      </HoverCardContent>
    </HoverCard>
  );
});
