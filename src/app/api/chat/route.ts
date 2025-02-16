import { findRelevantResources } from "@/lib/actions";
import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o"),
    system:
      "You are a helpful assistant that provides personalized career advice aimed at maximizing the positive impact an individual can have through their work. Only respond to questions using information from tool calls. If no relevant information is available, respond with 'I don't know'.",
    messages,
    tools: {
      findRelevantResources: tool({
        description: "Find relevant resources for a given query",
        parameters: z.object({
          query: z.string(),
        }),
        execute: async ({ query }) => findRelevantResources(query),
      }),
    },
  });

  return result.toDataStreamResponse();
}
