/**
 * STZ 0.9.6 — selective retrieval of promoted artifacts (PHASED-PLAN Phase 6).
 *
 * Deterministic, no FAISS, no vector DB, no bulk injection. Retrieves only
 * ACCEPTED artifacts, only the requested kinds, capped per kind, each with a
 * mandatory explanation (why selected + what it matched). `repo_note` is capped
 * at 0 by default (the CTIM-Rover risk: one noisy note steers the agent to the
 * wrong function); candidate-trust artifacts and patches are never retrievable
 * into a generation context.
 *
 * Scoring is a deterministic overlap: symbol matches weigh more than keyword
 * matches. Same pool + query → same hits, every run (N6).
 */
export type RetrievableKind = "predicate" | "contract_delta" | "rubric" | "search_heuristic" | "repo_note";

export interface RetrievableArtifact {
  id: string;
  kind: RetrievableKind;
  /** Only `accepted` artifacts may ever be retrieved into a generation context. */
  trust: "accepted" | "candidate";
  /** Anchored code symbols (drive precise matching). */
  symbols: string[];
  /** Title/statement text for keyword matching. */
  text: string;
}

export interface RetrievalQuery {
  symbols: string[];
  keywords: string[];
  requestedKinds: RetrievableKind[];
  /** Per-step retrieval tracking (per-step is the CTIM-Rover-safe trigger). */
  stepId: string;
}

export interface RetrievalExplanation {
  whySelected: string;
  matchedSymbols: string[];
  matchedKeywords: string[];
  score: number;
}

export interface RetrievalHit {
  artifact: RetrievableArtifact;
  explanation: RetrievalExplanation;
}

/** Per-kind caps. `repo_note` disabled by default; patches/tests never listed. */
export const DEFAULT_CAPS: Record<RetrievableKind, number> = {
  predicate: 3,
  contract_delta: 2,
  rubric: 1,
  search_heuristic: 1,
  repo_note: 0,
};

const lc = (s: string) => s.toLowerCase();

function scoreArtifact(
  a: RetrievableArtifact,
  q: RetrievalQuery,
): { score: number; matchedSymbols: string[]; matchedKeywords: string[] } {
  const qsyms = new Set(q.symbols.map(lc));
  const matchedSymbols = a.symbols.filter((s) => qsyms.has(lc(s)));
  const qkw = q.keywords.map(lc);
  const text = lc(a.text);
  const matchedKeywords = qkw.filter((k) => text.includes(k));
  // Symbol matches are worth 2, keyword matches 1 — symbols are the precise anchor.
  const score = 2 * matchedSymbols.length + matchedKeywords.length;
  return { score, matchedSymbols, matchedKeywords };
}

/**
 * Selective, capped, explained retrieval. Pure + deterministic. Returns [] for a
 * kind whose cap is 0. Never returns a non-accepted artifact, an unrequested
 * kind, or a zero-overlap artifact (no bulk).
 */
export function retrieve(
  pool: RetrievableArtifact[],
  query: RetrievalQuery,
  caps: Record<RetrievableKind, number> = DEFAULT_CAPS,
): RetrievalHit[] {
  const hits: RetrievalHit[] = [];
  for (const kind of query.requestedKinds) {
    const cap = caps[kind] ?? 0;
    if (cap === 0) continue;
    const scored = pool
      .filter((a) => a.kind === kind && a.trust === "accepted")
      .map((a) => ({ a, ...scoreArtifact(a, query) }))
      .filter((x) => x.score > 0) // zero-overlap → not retrieved (no bulk dump)
      // deterministic: score desc, then id asc for stable ties
      .sort((x, y) => y.score - x.score || (x.a.id < y.a.id ? -1 : 1))
      .slice(0, cap);
    for (const x of scored) {
      hits.push({
        artifact: x.a,
        explanation: {
          whySelected:
            `matched ${x.matchedSymbols.length} symbol(s) [${x.matchedSymbols.join(", ")}]` +
            (x.matchedKeywords.length ? ` and keyword(s) [${x.matchedKeywords.join(", ")}]` : ""),
          matchedSymbols: x.matchedSymbols,
          matchedKeywords: x.matchedKeywords,
          score: x.score,
        },
      });
    }
  }
  return hits;
}

/** Post-hoc audit: which retrieved artifacts the agent actually used. Retrieval
 *  utility = fraction of retrieved items that were used (logged, not guessed). */
export interface RetrievalAudit {
  stepId: string;
  retrieved: string[];
  used: string[];
  utility: number;
}

export function auditRetrieval(query: RetrievalQuery, hits: RetrievalHit[], usedIds: string[]): RetrievalAudit {
  const retrieved = hits.map((h) => h.artifact.id);
  const used = usedIds.filter((id) => retrieved.includes(id));
  return { stepId: query.stepId, retrieved, used, utility: retrieved.length === 0 ? 0 : used.length / retrieved.length };
}
