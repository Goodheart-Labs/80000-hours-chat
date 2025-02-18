import { memo } from "react";
import ReactMarkdown from "react-markdown";

export const MemoizedMarkdown = memo(({ content }: { content: string }) => {
  return (
    <ReactMarkdown
      components={{
        cite: () => <div>Citation</div>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
});

MemoizedMarkdown.displayName = "MemoizedMarkdown";
