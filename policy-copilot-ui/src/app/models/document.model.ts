export interface Document {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  processingStatus: string;
  chunks: DocumentChunk[];
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
}

export interface QueryRequest {
  question: string;
  maxResults: number;
}

export interface QueryResponse {
  answer: string;
  sources: RelevantChunk[];
  model: string;
}

export interface RelevantChunk {
  content: string;
  fileName: string;
  similarity: number;
  chunkIndex: number;
}
