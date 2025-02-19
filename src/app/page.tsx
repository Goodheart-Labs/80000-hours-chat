"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { MemoizedMarkdown } from "@/components/MemoizedMarkdown";
import { SimpleMessage, StreamChunk } from "@/lib/types";
import { Resource } from "@/lib/types";
import { Loader2, FileText, ChevronDown, Send } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { throttle } from "lodash-es";

type LoadingPhase = "idle" | "searching" | "processing" | "generating";

/** We're going to migrate to a message array so we can have chat functionality */

/** Safely strips citation tags from a message */
function stripCitationTags(text: string) {
  const div = document.createElement("div");
  div.innerHTML = text;
  // Remove all cite elements
  div.querySelectorAll("cite").forEach((el) => el.remove());
  return div.textContent || text;
}

export default function Chat() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<SimpleMessage[]>([
    {
      role: "user",
      content: "",
    },
  ]);

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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const throttledScrollToBottom = useMemo(
    () => throttle(scrollToBottom, 100, { trailing: true }),
    [scrollToBottom],
  );

  useEffect(() => {
    throttledScrollToBottom();
  }, [messages, throttledScrollToBottom]);

  // Set answer stores content on the most recent assistant message
  const setAssistantMessage = useCallback(
    (textOrCallback: string | ((prev: string) => string)) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        const content =
          typeof textOrCallback === "function"
            ? textOrCallback(lastMessage.content)
            : textOrCallback;
        return [...prev.slice(0, -1), { ...lastMessage, content }];
      });
    },
    [],
  );

  // Sets the most recent user message
  const setUserMessage = useCallback(
    (textOrCallback: string | ((prev: string) => string)) => {
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        const content =
          typeof textOrCallback === "function"
            ? textOrCallback(lastMessage.content)
            : textOrCallback;
        return [...prev.slice(0, -1), { ...lastMessage, content }];
      });
    },
    [],
  );

  const submitMessage = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setLoadingPhase("searching");

    // Set up the assistant message
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
      },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((message) => ({
            ...message,
            content: stripCitationTags(message.content),
          })),
        }),
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
                    setAssistantMessage((text) => text + parsed.text);
                    throttledScrollToBottom();
                  }
                  break;
                case "citation":
                  if (parsed.citation) {
                    console.log("Citation delta received:", parsed.citation);
                    const citationData = btoa(
                      unescape(
                        encodeURIComponent(JSON.stringify(parsed.citation)),
                      ),
                    );
                    setAssistantMessage(
                      (text) =>
                        text + `<cite data-parsed="${citationData}"></cite>`,
                    );
                  }
                  break;
                case "resources":
                  if (parsed.resources) {
                    setLoadingPhase("processing");
                    setResources((resources) => [
                      ...resources,
                      ...parsed.resources,
                    ]);
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
      setAssistantMessage("Sorry, something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
      setLoadingPhase("idle");

      // Add a new user message and scroll to bottom
      setMessages((prev) => [...prev, { role: "user", content: "" }]);
      throttledScrollToBottom();
      // Put cursor in the active text area
      setTimeout(() => {
        const activeTextArea = document.querySelector(
          "[data-is-active='true']",
        ) as HTMLTextAreaElement;
        if (activeTextArea) {
          activeTextArea.focus();
        }
      }, 100);
    }
  }, [isLoading, messages, setAssistantMessage, throttledScrollToBottom]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitMessage();
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
              value={messages[0].content}
              placeholder="Ask a question..."
              onChange={(e) => setUserMessage(e.target.value)}
              disabled={messages.length > 1}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </form>
        {messages.slice(1).map((message, index) => {
          if (message.role === "assistant") {
            return (
              <div
                className="leading-relaxed prose prose-slate max-w-none"
                key={index}
              >
                <MemoizedMarkdown content={message.content} />
              </div>
            );
          } else if (message.role === "user") {
            const stale = isLoading || index + 1 !== messages.length - 1;
            return (
              <div className="relative" key={index}>
                <Textarea
                  className="w-full bg-slate-100 shadow-inner border-none h-24 resize-none !text-base"
                  placeholder="Continue the conversation..."
                  value={message.content}
                  onChange={(e) => setUserMessage(e.target.value)}
                  disabled={stale}
                  data-is-active={!stale}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      submitMessage();
                    }
                  }}
                />
                {!stale ? (
                  <Button
                    className="absolute right-3 bottom-3 shadow-none bg-slate-200 hover:bg-slate-200"
                    size="icon"
                    variant="secondary"
                    onClick={submitMessage}
                  >
                    <Send className="h-4 w-4 -translate-x-px" />
                  </Button>
                ) : null}
              </div>
            );
          }
        })}
        {isLoading &&
          loadingPhase !== "idle" &&
          loadingPhase !== "generating" && (
            <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>{loadingMessages[loadingPhase]}</p>
            </div>
          )}
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
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
