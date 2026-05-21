import type { AnalysisResponse } from "../analysis/responseTypes.js";
import type { NormalizedIntake } from "../analysis/requestTypes.js";
import type { TrendStore } from "./service.js";
import type { CommonPhraseTrend, ScamTypeTrend, TrendResponse } from "./types.js";

const MAX_ITEMS = 10;
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "they",
  "said",
  "asked",
  "someone"
]);

export function createInMemoryTrendStore(): TrendStore {
  const scamTypeCounts = new Map<string, number>();
  const phraseCounts = new Map<string, number>();

  return {
    recordAnalysis(intake: NormalizedIntake, response: AnalysisResponse): void {
      increment(scamTypeCounts, response.category);

      for (const phrase of extractPhrases(intake)) {
        increment(phraseCounts, phrase);
      }
    },

    async getTrends(): Promise<TrendResponse> {
      return {
        scamTypes: toSortedTrends(scamTypeCounts).map((item) => ({
          category: item.value as ScamTypeTrend["category"],
          count: item.count
        })),
        commonPhrases: toSortedTrends(phraseCounts).map((item) => ({
          phrase: item.value,
          count: item.count
        }))
      };
    }
  };
}

function extractPhrases(intake: NormalizedIntake): string[] {
  const textParts = [
    intake.scenario,
    ...intake.context.messageExcerpts,
    intake.context.requestedAction,
    intake.context.deadlineOrUrgency,
    intake.context.userConcern
  ].filter((part): part is string => typeof part === "string" && part.length > 0);

  const phrases = new Set<string>();

  for (const part of textParts) {
    for (const phrase of extractThaiPhrases(part)) {
      phrases.add(phrase);
    }

    for (const phrase of extractEnglishPhrases(part)) {
      phrases.add(phrase);
    }
  }

  return [...phrases];
}

function extractThaiPhrases(value: string): string[] {
  const matches = value.match(/[\u0E00-\u0E7F0-9]{3,}(?:\s+[\u0E00-\u0E7F0-9]{1,})?/g);
  return normalizePhraseList(matches ?? []);
}

function extractEnglishPhrases(value: string): string[] {
  const words = value
    .toLowerCase()
    .match(/[a-z0-9]+/g)
    ?.filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  if (!words || words.length === 0) {
    return [];
  }

  const phrases: string[] = [];
  for (let index = 0; index < words.length - 1; index += 1) {
    phrases.push(`${words[index]} ${words[index + 1]}`);
  }

  if (words.length === 1) {
    phrases.push(words[0]);
  }

  return normalizePhraseList(phrases);
}

function normalizePhraseList(phrases: string[]): string[] {
  return phrases
    .map((phrase) => phrase.replace(/\s+/g, " ").trim())
    .filter((phrase) => phrase.length >= 3);
}

function increment(counts: Map<string, number>, value: string): void {
  counts.set(value, (counts.get(value) ?? 0) + 1);
}

function toSortedTrends(
  counts: Map<string, number>
): Array<{ value: string; count: number }> {
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value))
    .slice(0, MAX_ITEMS);
}
