/**
 * Deterministic mock model layer.
 *
 * Lets the full slice pipeline run end-to-end with zero network calls and
 * perfectly reproducible outputs (N6). Specimen "quality" is configured, not
 * sampled, so tests can drive both the success path and the failure path
 * (no passers → retry → replan → halt). The mock EvalRunner runs the *real*
 * hack-detector over the specimen files, so the anti-hacking layer is exercised
 * for real even though the model is fake.
 */
import type {
  DonePredicate,
  EvalResult,
  HackPattern,
  SliceManifest,
  SpecimenId,
} from "../types.js";
import type {
  Documenter,
  Elicitor,
  EvalRunner,
  Judge,
  ModelLayer,
  Planner,
  Specimen,
  SpecimenOutput,
  Strategist,
  TestAuthor,
} from "./interfaces.js";
import type { Spec } from "../specdiff.js";
import { detectHacks } from "../hack-detector.js";
import { evalReward } from "../selection.js";

/** Quality profile for one mock specimen in one round. */
export interface MockProfile {
  specimen: SpecimenId;
  strategy: string;
  passGate: boolean;
  testPassRate: number;
  coverage: number;
  mutationScore: number;
  /** If set, inject a file containing this hack pattern (→ disqualification). */
  hack?: HackPattern;
}

export interface MockConfig {
  complexity: number;
  donePredicates: DonePredicate[];
  /** Profiles per round; index = round (0 = initial, 1 = retry, …). Last reused. */
  profilesByRound: MockProfile[][];
  votesPerPair: number;
}

const HACK_SNIPPET: Record<HackPattern, string> = {
  "test-skip": "it.skip('contract', () => {});",
  "assertion-mutation": "expect(true).toBe(true);",
  "network-bypass": "const r = await fetch('https://api.example.com/score');",
  "fixture-keyed-branch": "if (input === FIXTURE_GOLDEN) return cached;",
  "hardcoded-test-input": "return 'EXPECTED_OUTPUT';",
};

export function defaultMockConfig(): MockConfig {
  return {
    complexity: 2,
    donePredicates: [
      { id: "schema", expr: "returns_schema(Result)", kind: "schema" },
      { id: "latency", expr: "p95_latency_ms < 200", kind: "metric" },
    ],
    profilesByRound: [
      [
        { specimen: "a", strategy: "iterator-based", passGate: true, testPassRate: 1.0, coverage: 0.95, mutationScore: 0.1 },
        { specimen: "b", strategy: "stream-based", passGate: true, testPassRate: 1.0, coverage: 0.88, mutationScore: 0.2 },
        { specimen: "c", strategy: "batch-based", passGate: true, testPassRate: 0.9, coverage: 0.8, mutationScore: 0.3 },
        { specimen: "d", strategy: "recursive", passGate: false, testPassRate: 0.4, coverage: 0.5, mutationScore: 0.6, hack: "test-skip" },
      ],
    ],
    votesPerPair: 8,
  };
}

/** A config whose every specimen always fails — drives retry → replan → halt. */
export function alwaysFailConfig(): MockConfig {
  const fail = (specimen: SpecimenId, strategy: string): MockProfile => ({
    specimen,
    strategy,
    passGate: false,
    testPassRate: 0.3,
    coverage: 0.4,
    mutationScore: 0.7,
  });
  return {
    complexity: 5,
    donePredicates: [{ id: "x", expr: "ok == true", kind: "test" }],
    profilesByRound: [
      [fail("a", "iterator-based"), fail("b", "stream-based"), fail("c", "batch-based"), fail("d", "recursive")],
    ],
    votesPerPair: 8,
  };
}

export class MockModelLayer implements ModelLayer {
  private round = 0;
  constructor(private cfg: MockConfig = defaultMockConfig()) {}

  /** Advance to the next escalation round (orchestrator calls on retry/replan). */
  nextRound(): void {
    this.round++;
  }

  private currentProfiles(): MockProfile[] {
    const r = Math.min(this.round, this.cfg.profilesByRound.length - 1);
    return this.cfg.profilesByRound[r]!;
  }

  elicitor: Elicitor = {
    elicit: async (request: string) => ({
      questionnaire: { request, scope: "single-repo", interface: "documented" },
      donePredicates: this.cfg.donePredicates,
      complexity: this.cfg.complexity,
    }),
  };

  testAuthor: TestAuthor = {
    authorTests: async (manifest: SliceManifest) => ({
      sealed: {
        "held-out/contract.spec.ts": `// sealed held-out suite for ${manifest.id}\n// property-based generators run at judge time (R8)\n`,
      },
      rubric: "trace quality, convention adherence, coverage delta, as-built clarity",
    }),
  };

  strategist: Strategist = {
    strategies: async (_m: SliceManifest, n: number) => {
      const profiles = this.currentProfiles();
      const out = profiles.slice(0, n).map((p) => p.strategy);
      while (out.length < n) out.push(`strategy-${out.length}`);
      return out;
    },
  };

  specimen: Specimen = {
    implement: async (manifest, strategy, _refinement) => {
      const p = this.currentProfiles().find((x) => x.strategy === strategy)
        ?? this.currentProfiles()[0]!;
      const files: Record<string, string> = {
        [`src/${manifest.name}.ts`]:
          `// ${manifest.name} via ${strategy}\nexport function run(input: unknown) {\n  return process(input);\n}\n`,
      };
      if (p.hack) {
        files[`src/${manifest.name}.hack.ts`] = `${HACK_SNIPPET[p.hack]}\n`;
      }
      return { specimen: p.specimen, files, strategy } satisfies SpecimenOutput;
    },
  };

  evalRunner: EvalRunner = {
    evaluate: async (output: SpecimenOutput, _sealed) => {
      const p = this.currentProfiles().find((x) => x.specimen === output.specimen)!;
      const hackFindings = detectHacks(output.specimen, output.files, {
        fixtureNames: ["FIXTURE_GOLDEN"],
      });
      return {
        specimen: output.specimen,
        passedGate: p.passGate && hackFindings.length === 0,
        testPassRate: p.testPassRate,
        coverage: p.coverage,
        mutationScore: p.mutationScore,
        hackFindings,
      } satisfies EvalResult;
    },
  };

  judge: Judge = {
    // Deterministic, majority-correct judge: the higher-reward specimen wins.
    // Reward is recomputed from the configured profile so votes are stable (N6).
    vote: async (a, b, _sealed): Promise<SpecimenId> => {
      const ra = this.rewardFor(a.specimen);
      const rb = this.rewardFor(b.specimen);
      if (ra > rb) return a.specimen;
      if (rb > ra) return b.specimen;
      return a.specimen < b.specimen ? a.specimen : b.specimen;
    },
  };

  documenter: Documenter = {
    asBuilt: async (winner: SpecimenOutput): Promise<Spec> => ({
      claims: [
        `implements the contract`,
        `passes sealed held-out suite`,
        `exposes run() entrypoint`,
        // Extra: the specific strategy the winner chose (plan left "how" open,
        // R5) — surfaces in the spec-diff as "built beyond plan", not "missing".
        `via ${winner.strategy} strategy`,
      ],
    }),
  };

  planner: Planner = {
    // Intent spec states behavioural claims about the slice. Done-predicates
    // live in the manifest/questionnaire and are checked by the sealed suite,
    // so they are not restated as spec claims here — that keeps the intent vs
    // as-built diff a comparison of delivered behaviour (F13).
    intentSpec: async (_manifest: SliceManifest): Promise<Spec> => ({
      claims: [
        `implements the contract`,
        `passes sealed held-out suite`,
        `exposes run() entrypoint`,
      ],
    }),
  };

  private rewardFor(s: SpecimenId): number {
    const p = this.currentProfiles().find((x) => x.specimen === s)!;
    return evalReward({
      specimen: s,
      passedGate: p.passGate,
      testPassRate: p.testPassRate,
      coverage: p.coverage,
      mutationScore: p.mutationScore,
      hackFindings: [],
    });
  }
}
