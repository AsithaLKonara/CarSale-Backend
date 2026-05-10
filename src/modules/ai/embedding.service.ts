/**
 * Pure-mathematical TF-IDF Vectorization Service.
 * Allows instant localized semantic string matching and vector extraction
 * without external heavy API keys or pgvector extensions.
 */
export class EmbeddingService {
  /**
   * Tokenizes and cleans a string of text.
   */
  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2); // Filter small noise words
  }

  /**
   * Computes term frequencies (TF) for a set of words.
   */
  private static computeTF(tokens: string[]): Map<string, number> {
    const tf = new Map<string, number>();
    tokens.forEach((token) => {
      tf.set(token, (tf.get(token) || 0) + 1);
    });
    // Normalize by total tokens count
    tf.forEach((count, token) => {
      tf.set(token, count / tokens.length);
    });
    return tf;
  }

  /**
   * Generates TF-IDF vector matrices for a target list of documents.
   */
  public static createVectors(
    documents: { id: string; content: string }[]
  ): { id: string; vector: Map<string, number> }[] {
    const docTokens = documents.map((doc) => ({
      id: doc.id,
      tokens: this.tokenize(doc.content),
    }));

    // Compute Document Frequency (DF)
    const df = new Map<string, number>();
    docTokens.forEach((doc) => {
      const uniqueTokens = new Set(doc.tokens);
      uniqueTokens.forEach((token) => {
        df.set(token, (df.get(token) || 0) + 1);
      });
    });

    // Compute Inverse Document Frequency (IDF)
    const idf = new Map<string, number>();
    const N = documents.length;
    df.forEach((count, token) => {
      idf.set(token, Math.log((1 + N) / (1 + count)) + 1); // Standard smoothed IDF formulation
    });

    // Generate TF-IDF normalized vector mapping
    return docTokens.map((doc) => {
      const tf = this.computeTF(doc.tokens);
      const tfidfVector = new Map<string, number>();
      
      tf.forEach((tfVal, token) => {
        const idfVal = idf.get(token) || 0;
        tfidfVector.set(token, tfVal * idfVal);
      });

      return {
        id: doc.id,
        vector: tfidfVector,
      };
    });
  }

  /**
   * Calculates the cosine-similarity ratio between two vector maps.
   */
  public static cosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    const intersectionKeys = new Set([...vec1.keys()].filter((k) => vec2.has(k)));
    
    let dotProduct = 0;
    intersectionKeys.forEach((key) => {
      dotProduct += (vec1.get(key) || 0) * (vec2.get(key) || 0);
    });

    let norm1 = 0;
    vec1.forEach((val) => {
      norm1 += val * val;
    });

    let norm2 = 0;
    vec2.forEach((val) => {
      norm2 += val * val;
    });

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
}
