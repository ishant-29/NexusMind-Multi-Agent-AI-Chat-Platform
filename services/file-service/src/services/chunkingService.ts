/**
 * Chunking Service
 * Splits documents into chunks for embedding and retrieval
 */

export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
  preserveParagraphs?: boolean;
}

export interface TextChunk {
  content: string;
  index: number;
  metadata: {
    chunkSize: number;
    overlap: number;
    startChar: number;
    endChar: number;
  };
}

export class ChunkingService {
  private static readonly DEFAULT_CHUNK_SIZE = 1000; // characters
  private static readonly DEFAULT_OVERLAP = 200; // characters

  /**
   * Split text into overlapping chunks
   */
  static chunkText(
    text: string,
    options: ChunkOptions = {}
  ): TextChunk[] {
    const {
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      overlap = this.DEFAULT_OVERLAP,
      preserveParagraphs = true,
    } = options;

    // Clean and normalize text
    const cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (cleanText.length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < cleanText.length) {
      let endIndex = Math.min(startIndex + chunkSize, cleanText.length);

      // If not at the end and preserveParagraphs is true, try to break at paragraph
      if (endIndex < cleanText.length && preserveParagraphs) {
        // Look for paragraph break
        const paragraphBreak = cleanText.lastIndexOf('\n\n', endIndex);
        if (paragraphBreak > startIndex) {
          endIndex = paragraphBreak + 2;
        } else {
          // Look for sentence break
          const sentenceBreak = this.findSentenceBreak(cleanText, startIndex, endIndex);
          if (sentenceBreak > startIndex) {
            endIndex = sentenceBreak;
          }
        }
      }

      const chunkContent = cleanText.slice(startIndex, endIndex).trim();

      if (chunkContent.length > 0) {
        chunks.push({
          content: chunkContent,
          index: chunkIndex,
          metadata: {
            chunkSize,
            overlap,
            startChar: startIndex,
            endChar: endIndex,
          },
        });
        chunkIndex++;
      }

      // Move start index forward, accounting for overlap
      startIndex = endIndex - overlap;

      // Ensure we make progress
      if (startIndex <= chunks[chunks.length - 1]?.metadata.startChar) {
        startIndex = endIndex;
      }
    }

    return chunks;
  }

  /**
   * Find a good sentence break point near the target index
   */
  private static findSentenceBreak(
    text: string,
    startIndex: number,
    targetIndex: number
  ): number {
    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    let bestBreak = targetIndex;
    let bestDistance = Infinity;

    // Look backwards from target for sentence enders
    for (let i = targetIndex; i > startIndex; i--) {
      for (const ender of sentenceEnders) {
        if (text.slice(i, i + ender.length) === ender) {
          const distance = targetIndex - i;
          if (distance < bestDistance) {
            bestDistance = distance;
            bestBreak = i + ender.length;
          }
        }
      }

      // Don't look too far back
      if (targetIndex - i > 200) break;
    }

    return bestBreak;
  }

  /**
   * Chunk text by semantic sections (paragraphs, headings, etc.)
   */
  static chunkBySections(text: string): TextChunk[] {
    const sections = text.split(/\n\n+/);
    const chunks: TextChunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;
    let charIndex = 0;

    for (const section of sections) {
      const trimmedSection = section.trim();
      if (!trimmedSection) continue;

      // If adding this section would exceed chunk size, save current chunk
      if (
        currentChunk.length > 0 &&
        currentChunk.length + trimmedSection.length > this.DEFAULT_CHUNK_SIZE
      ) {
        chunks.push({
          content: currentChunk.trim(),
          index: chunkIndex,
          metadata: {
            chunkSize: currentChunk.length,
            overlap: 0,
            startChar: charIndex - currentChunk.length,
            endChar: charIndex,
          },
        });
        chunkIndex++;
        currentChunk = '';
      }

      currentChunk += (currentChunk ? '\n\n' : '') + trimmedSection;
      charIndex += trimmedSection.length + 2;
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        metadata: {
          chunkSize: currentChunk.length,
          overlap: 0,
          startChar: charIndex - currentChunk.length,
          endChar: charIndex,
        },
      });
    }

    return chunks;
  }

  /**
   * Get optimal chunk size based on document length
   */
  static getOptimalChunkSize(documentLength: number): number {
    if (documentLength < 5000) return 500;
    if (documentLength < 20000) return 1000;
    if (documentLength < 50000) return 1500;
    return 2000;
  }
}
