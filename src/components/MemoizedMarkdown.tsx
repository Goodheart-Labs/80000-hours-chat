import { Citation } from "@/lib/types";
import { memo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { CitationCard } from "./CitationCard";

export const MemoizedMarkdown = memo(({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cite: (props: any) => {
          try {
            const citation = JSON.parse(
              decodeURIComponent(escape(atob(props["data-parsed"].trim()))),
            ) as Citation;
            return <CitationCard {...citation} />;
          } catch (error) {
            console.error(error);
            return null;
          }
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

MemoizedMarkdown.displayName = "MemoizedMarkdown";
