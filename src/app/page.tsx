"use client";

import { useState } from "react";
import { MemoizedMarkdown } from "@/components/MemoizedMarkdown";

type Citation = {
  citedText: string;
  sourceUrl: string;
};

type StreamChunk = {
  text?: string;
  citation?: {
    cited_text: string;
    document_title: string;
  };
};

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [citations, setCitations] = useState<Citation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setAnswer("");
    setCitations([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ content: question }] }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(5);
            try {
              const parsed: StreamChunk = JSON.parse(data);

              if (parsed.text) {
                setAnswer((prev) => prev + parsed.text);
              }

              if (parsed.citation) {
                setAnswer((prev) => prev + parsed.citation?.document_title);
                // setCitations((prev) => [
                //   ...prev,
                //   {
                //     citedText: parsed.citation!.cited_text,
                //     sourceUrl: parsed.citation!.document_title,
                //   },
                // ]);
              }
            } catch (e) {
              console.error("Failed to parse chunk", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      setAnswer("Sorry, something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid w-full max-w-2xl py-12 mx-auto">
      <div className="grid gap-6">
        <form onSubmit={handleSubmit}>
          <input
            className="w-full p-3 text-lg rounded-lg shadow-inner bg-slate-100 placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50 tracking-wide"
            value={question}
            placeholder="Ask a question..."
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
          />
        </form>
        {answer && (
          <div className="leading-relaxed prose prose-slate max-w-none">
            <MemoizedMarkdown content={answer} />
          </div>
        )}
      </div>
    </div>
  );
}
