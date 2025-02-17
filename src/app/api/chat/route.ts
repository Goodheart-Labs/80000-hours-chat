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
    model: openai("gpt-4o"),
    schema: z.object({
      answer: z.string(),
    }),
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
  console.log(resources);

  // Create documents
  const documents = createDocuments(resources);
  console.log(documents);

  // Stream message using Anthropic
  const stream = anthropic.messages.stream({
    model: "claude-3-5-sonnet-latest",
    max_tokens: 1024,
    temperature: 0,
    stream: true,
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
      for await (const message of stream) {
        console.log(message);
        if (message.type === "content_block_delta") {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: message.delta.text })}\n\n`,
            ),
          );
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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
        type: "content",
        content,
      },
      title: sourceUrl,
      context: JSON.stringify({ similarity }),
      citations: { enabled: true },
    })),
  };
}

// const result = streamText({
//   model: openai("gpt-4o"),
//   system:
//     "You are a helpful assistant that provides personalized career advice aimed at maximizing the positive impact an individual can have through their work. You can only respond to questions using information from relevant resources. To find relevant resources provide the 'findRelevantResources' tool with a one-sentence hypothetical answer to the question. Use the resources to answer the question.",
//   messages,
//   tools: {
//     findRelevantResources: tool({
//       description: "Find relevant resources for a given query",
//       parameters: z.object({
//         hypotheticalAnswer: z.string(),
//       }),
//       execute: async ({ hypotheticalAnswer }) =>
//         findRelevantResources(hypotheticalAnswer),
//     }),
//   },
// });

// return result.toDataStreamResponse();
