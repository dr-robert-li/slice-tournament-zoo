/**
 * Hybrid selection (F7): eval-gate then judge ranking.
 *
 *  Stage 1 (gate): a specimen must pass the sealed held-out suite AND carry no
 *                  hack findings (F10/L3). Failures are eliminated.
 *  Stage 2 (rank):  pairwise comparisons across passers, V=8 votes per pair
 *                   (RTV default). Ranking is by win-count (the plain,
 *                   deterministic aggregation — deliberately not clever).
 *
 * GRPO group-relative advantage (F8) is computed over a scalar reward derived
 * from each passer's eval signal + pairwise win share, and is reported
 * alongside the ranking so the winner pick and the pressure-log weighting share
 * one number.
 */
import type {
  Advantage,
  EvalResult,
  Judgment,
  PairwiseVote,
  SpecimenId,
} from "./types.js";
import { groupRelativeAdvantage } from "./grpo.js";

/** Stage 1: eliminate specimens that fail the gate or trip a hack pattern. */
export function evalGate(results: EvalResult[]): {
  passers: SpecimenId[];
  eliminated: { specimen: SpecimenId; reason: string }[];
} {
  const passers: SpecimenId[] = [];
  const eliminated: { specimen: SpecimenId; reason: string }[] = [];
  for (const r of results) {
    if (r.hackFindings.length > 0) {
      eliminated.push({
        specimen: r.specimen,
        reason: `hack-pattern: ${r.hackFindings.map((f) => f.pattern).join(", ")}`,
      });
    } else if (!r.passedGate) {
      eliminated.push({
        specimen: r.specimen,
        reason: `gate-fail: testPassRate=${r.testPassRate.toFixed(2)}`,
      });
    } else {
      passers.push(r.specimen);
    }
  }
  return { passers, eliminated };
}

/** Tally pairwise votes into per-specimen win counts. */
export function tallyVotes(votes: PairwiseVote[]): Map<SpecimenId, number> {
  const wins = new Map<SpecimenId, number>();
  for (const v of votes) {
    // Ensure both contestants exist in the map even at 0 wins.
    if (!wins.has(v.a)) wins.set(v.a, 0);
    if (!wins.has(v.b)) wins.set(v.b, 0);
    wins.set(v.winner, (wins.get(v.winner) ?? 0) + 1);
  }
  return wins;
}

/**
 * Stage 2: rank passers by pairwise win-count (descending). Ties broken by
 * the specimen's scalar eval reward, then lexicographically by id so ranking
 * is fully deterministic (N6).
 */
export function rankByVotes(
  passers: SpecimenId[],
  votes: PairwiseVote[],
  rewardOf: (s: SpecimenId) => number,
): SpecimenId[] {
  const wins = tallyVotes(votes);
  return [...passers].sort((a, b) => {
    const wd = (wins.get(b) ?? 0) - (wins.get(a) ?? 0);
    if (wd !== 0) return wd;
    const rd = rewardOf(b) - rewardOf(a);
    if (rd !== 0) return rd;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

/**
 * Scalar reward for a passer: blend of test pass rate, coverage, and mutation
 * kill rate (1 − survival). Bounded to [0,1]. Feeds GRPO + tie-breaks.
 */
export function evalReward(r: EvalResult): number {
  const killRate = 1 - r.mutationScore;
  return 0.5 * r.testPassRate + 0.25 * r.coverage + 0.25 * killRate;
}

/** Full two-stage selection producing a Judgment (F7 + F8). */
export function select(
  results: EvalResult[],
  votes: PairwiseVote[],
): { judgment: Judgment; eliminated: { specimen: SpecimenId; reason: string }[] } {
  const { passers, eliminated } = evalGate(results);
  const rewardByName = new Map(results.map((r) => [r.specimen, evalReward(r)]));
  const rewardOf = (s: SpecimenId) => rewardByName.get(s) ?? 0;

  const ranking = rankByVotes(passers, votes, rewardOf);
  // GRPO advantage is computed across the WHOLE specimen group (F8: "across
  // the slice's specimen group"), including gate-eliminated specimens — so the
  // pressure log can weight which *losers'* diffs are most informative (F9).
  const advantages: Advantage[] = groupRelativeAdvantage(
    results.map((r) => ({ specimen: r.specimen, reward: rewardOf(r.specimen) })),
  );

  const judgment: Judgment = {
    ranking,
    winner: ranking[0] ?? null,
    advantages,
    votes,
  };
  return { judgment, eliminated };
}

/**
 * Generate the full round-robin pairing schedule for a set of passers, each
 * pair to be voted V times by the judge. Order is deterministic (i<j).
 */
export function pairings(passers: SpecimenId[]): [SpecimenId, SpecimenId][] {
  const pairs: [SpecimenId, SpecimenId][] = [];
  for (let i = 0; i < passers.length; i++) {
    for (let j = i + 1; j < passers.length; j++) {
      pairs.push([passers[i]!, passers[j]!]);
    }
  }
  return pairs;
}
