import { readdir } from "fs/promises";
import matter from "gray-matter";

const PATH_TO_FILES =
  "/Users/robgordon/Dev/playground/ingest-80000/scraped/markdown";

// list all md in ./scraped/markdown
// list files
const files = await readdir(PATH_TO_FILES);
console.log(files.length);

const filteredFiles = files
  // Filter out archive files
  .filter((file) => !file.startsWith("topic"))
  // Filter out author pages
  .filter((file) => !file.startsWith("author"))
  // Filter out podcast episodes
  .filter((file) => !file.startsWith("podcastepisodes"))
  // Filter out job board files
  .filter((file) => !file.includes("job-board"));

async function processFile(file: string) {
  // read the file
  const fileContent = await Bun.file(`${PATH_TO_FILES}/${file}`).text();
  const { data, content } = matter(fileContent);
  const { source_url, filename } = data as {
    source_url: string;
    filename: string;
  };
  console.log({ source_url, filename });
  const splitContent = splitMarkdown(content);
  const chunks = prepareChunks(splitContent);
  if (chunks.length > 0) {
    const chunk = chunks[Math.floor(Math.random() * chunks.length)];
    console.log(chunk.length);
  }
}

// pick a random file from the list
const randomFile =
  filteredFiles[Math.floor(Math.random() * filteredFiles.length)];
console.log(randomFile);

processFile(randomFile);

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
