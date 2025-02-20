import { findRelevantResources } from "@/lib/actions";
import { SimpleMessage } from "@/lib/types";
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
  const { messages } = (await req.json()) as { messages: SimpleMessage[] };

  return replyWithCitations(messages);
}

async function replyWithCitations(messages: SimpleMessage[]) {
  // Generate hypothetical answer to the question
  const {
    object: { searchQuery },
  } = await generateObject({
    model: openai("gpt-3.5-turbo"),
    schema: z.object({
      searchQuery: z.string(),
    }),
    temperature: 1,
    system:
      "You are a research assistant for personalized career advice. Based on the conversation, come up with a one-sentence search query to locate relevant resources.",
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });
  console.log({ searchQuery });

  // Find relevant resources
  const resources = await findRelevantResources(searchQuery);

  // Create documents
  const documents = createDocuments(resources);

  // Stream message using Anthropic
  const stream = anthropic.messages.stream({
    model: "claude-3-5-haiku-latest",
    max_tokens: 2048,
    stream: true,
    system:
      "You are a career advice assistant. You provide easy-to-understand, conversational advice using resources from 80000hours.org. AVOID PHRASES LIKE 'documents provided' OR 'based on the resources'. Use resource citations to support your response. Use markdown to format your response.",
    messages: [documents, ...messages],
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
