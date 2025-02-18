"use client";

import { useState } from "react";
import { MemoizedMarkdown } from "@/components/MemoizedMarkdown";
import { StreamChunk } from "@/lib/types";
import { Resource } from "@/lib/types";
import { Loader2 } from "lucide-react";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setAnswer("");
    setResources([]);

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

              switch (parsed.type) {
                case "text":
                  if (parsed.text) {
                    setAnswer((prev) => prev + parsed.text);
                  }
                  break;
                case "citation":
                  if (parsed.citation) {
                    const citationData = btoa(
                      unescape(
                        encodeURIComponent(JSON.stringify(parsed.citation)),
                      ),
                    );
                    setAnswer(
                      (prev) =>
                        prev + `<cite data-parsed="${citationData}"></cite>`,
                    );
                  }
                  break;
                case "resources":
                  if (parsed.resources) {
                    setResources(parsed.resources);
                  }
                  break;
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
          <p className="text-sm text-muted-foreground mb-2 text-center">
            Ask a question about your career, effective altruism, or 80,000
            Hours research
          </p>
          <div className="relative">
            <input
              className="w-full p-3 text-lg rounded-lg shadow-inner bg-slate-100 placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50 tracking-wide"
              value={question}
              placeholder="Ask a question..."
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
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
