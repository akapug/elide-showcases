import type { Logger } from 'pino';

interface Item {
  itemId: string;
  score: number;
  metadata?: any;
}

export class DiversityOptimizer {
  constructor(private logger: Logger) {}

  optimize(items: Item[], diversityWeight: number): Item[] {
    if (diversityWeight === 0) return items;

    // Maximal Marginal Relevance (MMR) algorithm
    const result: Item[] = [];
    const remaining = [...items];

    while (remaining.length > 0 && result.length < items.length) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const item = remaining[i];

        // Relevance score
        const relevance = item.score;

        // Diversity score (how different from already selected items)
        const diversity = result.length === 0 ? 1 :
          this.calculateDiversity(item, result);

        // Combined score
        const mmrScore = (1 - diversityWeight) * relevance + diversityWeight * diversity;

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIndex = i;
        }
      }

      result.push(remaining[bestIndex]);
      remaining.splice(bestIndex, 1);
    }

    return result;
  }

  private calculateDiversity(item: Item, selected: Item[]): number {
    // Calculate average dissimilarity with selected items
    const similarities = selected.map(s => this.calculateSimilarity(item, s));
    const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

    return 1 - avgSimilarity;
  }

  private calculateSimilarity(item1: Item, item2: Item): number {
    // Category-based similarity
    if (item1.metadata?.category && item2.metadata?.category) {
      return item1.metadata.category === item2.metadata.category ? 0.8 : 0.2;
    }

    return 0.5;
  }
}
