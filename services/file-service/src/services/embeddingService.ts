import axios from 'axios';

/**
 * Embedding Service
 * Generates embeddings using OpenAI or OpenRouter
 */

// Read env vars lazily: this module may be imported before
// dotenv.config() runs in index.ts (ES imports are hoisted)
const getProvider = () => {
  if (process.env.OPENAI_API_KEY) {
    return {
      url: 'https://api.openai.com/v1/embeddings',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    };
  }
  if (process.env.OPENROUTER_API_KEY) {
    return {
      url: 'https://openrouter.ai/api/v1/embeddings',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.EMBEDDING_MODEL || 'nvidia/llama-nemotron-embed-vl-1b-v2:free',
    };
  }
  throw new Error('No embedding provider configured (set OPENAI_API_KEY or OPENROUTER_API_KEY)');
};

export class EmbeddingService {
  /**
   * Generate embeddings for text
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    const provider = getProvider();

    try {
      const response = await axios.post(
        provider.url,
        {
          model: provider.model,
          input: text,
        },
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data[0].embedding;
    } catch (error: any) {
      console.error('Error generating embedding:', error.response?.data || error.message);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const provider = getProvider();

    try {
      const response = await axios.post(
        provider.url,
        {
          model: provider.model,
          input: texts,
        },
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.data.map((item: any) => item.embedding);
    } catch (error: any) {
      console.error('Error generating embeddings:', error.response?.data || error.message);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    // Mismatched dimensions (e.g. chunks embedded by a different model) or
    // zero vectors would otherwise produce NaN and be silently dropped
    if (!vecA?.length || !vecB?.length || vecA.length !== vecB.length) return 0;
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
