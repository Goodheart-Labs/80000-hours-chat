"use client";

import { useState, useMemo } from "react";
import { MemoizedMarkdown } from "@/components/MemoizedMarkdown";
import { StreamChunk } from "@/lib/types";
import { Resource } from "@/lib/types";
import { Loader2, FileText, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type LoadingPhase = "idle" | "searching" | "processing" | "generating";

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");

  const uniqueResources = useMemo(() => {
    // Create a Map to deduplicate by sourceUrl
    const uniqueMap = new Map();
    resources.forEach((resource) => {
      if (!uniqueMap.has(resource.sourceUrl)) {
        uniqueMap.set(resource.sourceUrl, resource);
      }
    });
    return Array.from(uniqueMap.values());
  }, [resources]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setLoadingPhase("searching");
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
                    setLoadingPhase("generating");
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
                    setLoadingPhase("processing");
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
      setLoadingPhase("idle");
    }
  }

  const loadingMessages = {
    searching: "Searching through 80,000 Hours knowledge base...",
    processing: "Analyzing relevant career guidance documents...",
    generating: "Crafting your personalized response...",
  };

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
              type="text"
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
        {isLoading &&
          loadingPhase !== "idle" &&
          loadingPhase !== "generating" && (
            <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>{loadingMessages[loadingPhase]}</p>
            </div>
          )}
        {answer && (
          <div className="leading-relaxed prose prose-slate max-w-none">
            <MemoizedMarkdown content={answer} />
          </div>
        )}
        {!isLoading && answer.length ? (
          <button
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            onClick={() => {
              setQuestion("");
              setAnswer("");
              setResources([]);
              // smooth scroll to top
              window.scrollTo({ top: 0, behavior: "smooth" });
              // Find and focus the input element
              const inputElement = document.querySelector(
                'input[type="text"]',
              ) as HTMLInputElement;
              if (inputElement) {
                inputElement.focus();
              }
            }}
          >
            Ask another question
          </button>
        ) : null}
        {!isLoading && resources.length > 0 && (
          <div className="grid gap-3 pt-6 border-t">
            <Collapsible>
              <CollapsibleTrigger className="grid w-full group">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 transition-colors">
                  <h2 className="font-semibold text-lg">
                    {uniqueResources.length} Related{" "}
                    {uniqueResources.length === 1 ? "Resource" : "Resources"}
                  </h2>
                  <ChevronDown className="h-5 w-5 group-aria-expanded:rotate-180" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="grid gap-1.5 pt-2">
                  {uniqueResources.map((resource, i) => (
                    <a
                      key={i}
                      href={`https://80000hours.org${resource.sourceUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-green-600 shrink-0" />
                      <div className="grid gap-0.5">
                        <span className="text-green-800 break-all">
                          {resource.sourceUrl}
                        </span>
                        <span className="text-sm text-muted-foreground/70 line-clamp-1">
                          {resource.content}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>
    </div>
  );
}
