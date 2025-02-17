"use server";

import { db } from "@/db";
import { cosineDistance, gt, desc, sql } from "drizzle-orm";
import { embed } from "ai";
import { embeddingModel } from "./shared";
import { embeddings } from "@/db/schema";

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
};

export async function findRelevantResources(query: string) {
  const userQueryEmbedded = await generateEmbedding(query);
  const similarity = sql<number>`1 - (${cosineDistance(
    embeddings.embedding,
    userQueryEmbedded,
  )})`;
  const similarGuides = await db
    .select({
      content: embeddings.content,
      similarity,
      sourceUrl: embeddings.sourceUrl,
    })
    .from(embeddings)
    .where(gt(similarity, 0.55))
    .orderBy((t) => desc(t.similarity))
    .limit(8);
  return similarGuides;
}
