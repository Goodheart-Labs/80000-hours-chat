import { readdir } from "fs/promises";
import matter from "gray-matter";
import { embed, embedMany } from "ai";
import { embeddings, InsertEmbedding } from "../src/db/schema";
import { db } from "../src/db/index";
import { embeddingModel } from "@/lib/shared";
const PATH_TO_FILES =
  "/Users/robgordon/Dev/playground/ingest-80000/scraped/markdown";

// list all md in ./scraped/markdown
// list files
const files = await readdir(PATH_TO_FILES);
console.log(`${files.length} files found`);

const filteredFiles = files
  // Filter out archive files
  .filter((file) => !file.startsWith("topic"))
  // Filter out author pages
  .filter((file) => !file.startsWith("author"))
  // Filter out podcast episodes
  .filter((file) => !file.startsWith("podcastepisodes"))
  // Filter out job board files
  .filter((file) => !file.includes("job-board"))
  // Sort by filename
  .sort();

async function processFile(
  file: string,
): Promise<Omit<InsertEmbedding, "embedding">[]> {
  // read the file
  const fileContent = await Bun.file(`${PATH_TO_FILES}/${file}`).text();
  const { data, content } = matter(fileContent);
  const { source_url = "" } = data as {
    source_url: string;
    filename: string;
  };

  let sourceUrl;
  if (source_url.includes("https://80000hours.org")) {
    sourceUrl = source_url.split("https://80000hours.org")[1];
  } else {
    sourceUrl = "https://80000hours.org";
  }

  // Sanitize the content before splitting
  const sanitizedContent = sanitizeContent(content);
  const splitContent = splitMarkdown(sanitizedContent);
  const chunks = prepareChunks(splitContent);
  return chunks.map((chunk) => ({
    sourceUrl,
    content: sanitizeContent(chunk), // Also sanitize individual chunks
  }));
}

async function main() {
  const flattenedChunks: Omit<InsertEmbedding, "embedding">[] = [];
  for (const file of filteredFiles) {
    const chunks = await processFile(file);
    flattenedChunks.push(...chunks);
  }
  console.log(`${flattenedChunks.length} chunks found`);

  // Handle 100 chunks at a time
  for (let i = 0; i < flattenedChunks.length; i += 100) {
    try {
      console.log(`${i}/${flattenedChunks.length} chunks processed`);
      const chunk = flattenedChunks.slice(i, i + 100);
      const chunkEmbeddings = await generateEmbeddings(chunk);
      await db.insert(embeddings).values(chunkEmbeddings);
    } catch (error) {
      console.log(`Error processing chunk ${i}`);
      console.error(error);
    }
  }

  console.log("Done");
}

main();

/**
 * This function splits markdown content on headers #,##,###
 */
function splitMarkdown(content: string) {
  // Split content into lines
  const lines = content.split("\n");
  // Initialize result array
  const sections: string[] = [];
  // Current section content
  let currentContent: string[] = [];

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    // If it's a header
    if (trimmedLine.match(/^#{1,3}\s+.*$/)) {
      // If we have accumulated content, add it to sections
      if (currentContent.length > 0) {
        sections.push(currentContent.join("\n").trim());
        currentContent = [];
      }
      // Add the header as its own section
      sections.push(trimmedLine);
    } else if (trimmedLine.length > 0) {
      currentContent.push(line);
    }
  });

  // Add any remaining content
  if (currentContent.length > 0) {
    sections.push(currentContent.join("\n").trim());
  }

  return sections.filter((section) => section.length > 0);
}

/**
 * This function prepends a non-header section with the relevant headers
 * and returns the chunks
 */
function prepareChunks(sections: string[]) {
  const currentHeaders: [string, string, string] = ["", "", ""];
  const chunks: string[] = [];
  sections.forEach((section) => {
    if (isH1(section)) {
      currentHeaders[0] = section;
    } else if (isH2(section)) {
      currentHeaders[1] = section;
    } else if (isH3(section)) {
      currentHeaders[2] = section;
    } else {
      const headers = currentHeaders.filter((h) => h.length > 0);

      const content = filterSection(section);
      if (content.length < 1024) {
        chunks.push([...headers, content].join("\n"));
      } else {
        const paragraphs = content
          .split("\n\n")
          .filter((line) => line.length > 0);
        for (const paragraph of paragraphs) {
          chunks.push([...headers, paragraph].join("\n"));
        }
      }
    }
  });
  return chunks;
}

function isH1(line: string) {
  return line.match(/^#{1}\s+.*$/);
}

function isH2(line: string) {
  return line.match(/^#{2}\s+.*$/);
}

function isH3(line: string) {
  return line.match(/^#{3}\s+.*$/);
}

/**
 * This filters unnecessary content from individual sections
 */
function filterSection(section: string) {
  const footerLinks = "[Like (opens in new window)]";
  if (section.includes(footerLinks)) {
    return section.split(footerLinks)[0];
  }
  return section;
}

function sanitizeContent(text: string): string {
  return text
    .replace(/\0/g, "") // Remove null bytes
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, "") // Remove invalid UTF-8 characters
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "") // Remove control characters
    .trim();
}

async function generateEmbedding(value: string): Promise<number[]> {
  const input = sanitizeContent(value.replaceAll("\\n", " "));
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });
  return embedding;
}

async function generateEmbeddings(
  chunks: Omit<InsertEmbedding, "embedding">[],
): Promise<InsertEmbedding[]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks.map((chunk) => chunk.content),
  });
  return chunks.map((chunk, index) => ({
    ...chunk,
    embedding: embeddings[index],
  }));
}
