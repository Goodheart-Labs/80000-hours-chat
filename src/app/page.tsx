"use client";

import { useChat } from "@ai-sdk/react";
import { Fragment } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    maxSteps: 3,
  });
  return (
    <div className="grid w-full max-w-2xl py-24 mx-auto">
      <div className="grid gap-6">
        {messages.map((m) => {
          return (
            <Fragment key={m.id}>
              {m.parts.map((part, index) => {
                switch (part.type) {
                  case "text":
                    return (
                      <div
                        key={m.id + index.toString()}
                        className="grid gap-2 p-4 rounded-lg bg-white/50 shadow-sm"
                      >
                        <div className="font-medium text-sm text-muted-foreground">
                          {m.role === "assistant" ? "AI Assistant" : "You"}
                        </div>
                        <p className="text-sm leading-relaxed">{part.text}</p>
                      </div>
                    );
                  case "tool-invocation":
                    return (
                      <Collapsible key={m.id + index.toString()}>
                        <div className="grid gap-2 p-4 rounded-lg bg-slate-50 shadow-sm">
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                            <ChevronDown className="h-4 w-4" />
                            Tool: {part.toolInvocation.toolName}
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="grid gap-2 mt-2">
                              <div className="grid gap-1.5">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Arguments:
                                </div>
                                <pre className="p-2 text-xs font-mono bg-slate-100 rounded-md overflow-x-auto">
                                  {JSON.stringify(
                                    part.toolInvocation.args,
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                              <div className="grid gap-1.5">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Result:
                                </div>
                                <pre className="p-2 text-xs font-mono bg-slate-100 rounded-md overflow-x-auto">
                                  {JSON.stringify(
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (part.toolInvocation as any).result ?? {},
                                    null,
                                    2,
                                  )}
                                </pre>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    );
                  default:
                    return null;
                }
              })}
            </Fragment>
          );
        })}
      </div>

      <form
        onSubmit={handleSubmit}
        className="fixed bottom-0 left-0 right-0 py-4 bg-gradient-to-t from-background to-transparent"
      >
        <div className="max-w-2xl mx-auto px-4">
          <input
            className="w-full p-3 text-sm border border-input rounded-lg shadow-sm bg-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={input}
            placeholder="Send a message..."
            onChange={handleInputChange}
          />
        </div>
      </form>
    </div>
  );
}
