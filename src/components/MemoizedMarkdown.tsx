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
          const citation = JSON.parse(
            decodeURIComponent(escape(atob(props["data-parsed"]))),
          ) as Citation;
          console.log(citation);
          return <CitationCard {...citation} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

MemoizedMarkdown.displayName = "MemoizedMarkdown";
