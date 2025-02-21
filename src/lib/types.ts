export type Citation = {
  type: "char_location";
  cited_text: string;
  document_index: number;
  document_title: string | null;
  start_char_index: number;
  end_char_index: number;
};

export type Resource = {
  content: string;
  similarity: number;
  sourceUrl: string;
};

export type StreamChunk =
  | {
      type: "text";
      text?: string;
    }
  | {
      type: "citation";
      citation: Citation;
    }
  | {
      type: "resources";
      resources: Resource[];
    };

export type SimpleMessage =
  | {
      role: "user";
      content: string;
    }
  | {
      role: "assistant";
      content: string;
      resources: Resource[];
    };
