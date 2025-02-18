import { findRelevantResources } from "@/lib/actions";
import { openai } from "@ai-sdk/openai";
import { Anthropic } from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages";
import { generateObject } from "ai";
import { z } from "zod";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not set");
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const question = messages[messages.length - 1].content;

  return replyWithCitations(question);
}

async function replyWithCitations(question: string) {
  // Generate hypothetical answer to the question
  const {
    object: { answer },
  } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      answer: z.string(),
    }),
    temperature: 1,
    system:
      "You are a research assistant for personalized career advice. Come up with a hypothetical one-sentence answer to the user's question to add in locating relevant resources.",
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: String(question) }],
      },
    ],
  });
  console.log({ answer });

  // Find relevant resources
  const resources = await findRelevantResources(answer);

  // Create documents
  const documents = createDocuments(resources);

  // Stream message using Anthropic
  const stream = anthropic.messages.stream({
    model: "claude-3-5-sonnet-latest",
    max_tokens: 2048,
    stream: true,
    system:
      "You are a career advice assistant that provides personalized advice aimed at maximizing the positive impact an individual can have through their work using resources from 80000hours.org to answer the user's question. Always return your text with supporting citations from the resources.",
    messages: [
      documents,
      {
        role: "user",
        content: [{ type: "text", text: String(question) }],
      },
    ],
  });

  // Create a ReadableStream that transforms the Anthropic stream
  const textStream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Send resources data as first message
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "resources",
            resources: resources.map(({ content, similarity, sourceUrl }) => ({
              content,
              similarity,
              sourceUrl,
            })),
          })}\n\n`,
        ),
      );

      for await (const message of stream) {
        if (message.type === "content_block_delta") {
          if (message.delta.type === "text_delta") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: "text", text: message.delta.text })}\n\n`,
              ),
            );
          } else if (message.delta.type === "citations_delta") {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "citation",
                  citation: message.delta.citation,
                })}\n\n`,
              ),
            );
          }
        }
      }
      controller.close();
    },
  });

  // Return a streaming response
  return new Response(textStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function createDocuments(
  resources: Awaited<ReturnType<typeof findRelevantResources>>,
): MessageParam {
  return {
    role: "user",
    content: resources.map(({ content, similarity, sourceUrl }) => ({
      type: "document" as const,
      source: {
        type: "text",
        media_type: "text/plain",
        data: content,
      },
      title: sourceUrl,
      context: JSON.stringify({ similarity, sourceUrl }),
      citations: { enabled: true },
    })),
  };
}
