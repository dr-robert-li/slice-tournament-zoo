# STZ vNext: Exhaustive Implementation Plan
# Bounded RSI Plugin Harness for Claude Code
# Based on: AlphaEvolve, SICA, DGM, SelfEvolve, EvolveR, MemEvolve, MOSS, ABSTRAL, PostTrainBench

---

## 0. Context and Diagnosis

### 0.1 What the existing codebase already does correctly

The current slice-tournament-zoo repository (STZ) contains a
sophisticated Claude Code plugin with the following proven components:

- `src/harness.ts` — orchestrates slice-level tournament rounds
- `src/bridge.ts` — Claude Code SDK bridge (~70KB, the core execution layer)
- `src/eval-runner.ts` — evaluation harness for candidate scoring
- `src/selection.ts` — winner selection logic
- `src/specdiff.ts` — spec diffing between candidate outputs
- `src/grpo.ts` — Group Relative Policy Optimisation scoring
- `src/hack-detector.ts` — reward hacking detection
- `src/judge-reliability.ts` — judge consistency checks
- `src/merge.ts` — candidate merge logic
- `src/types.ts` — shared type definitions (~14KB)
- `src/state.ts` — run state management
- `src/taxonomy.ts` — issue taxonomy classification
- `src/diversity.ts` — candidate diversity enforcement
- `src/budget.ts` — token/cost budgeting
- `src/escalation.ts` — escalation triggers
- `src/pressure.ts` — selection pressure controls
- `src/injector.ts` — context injection
- `src/cost-tracker.ts` — per-run cost accounting
- `src/version.ts` — versioning primitives
- `src/migrate.ts` — state migration
- `src/update.ts` — harness update logic
- `src/seal.ts` — sealed test suite management
- `src/cli.ts` — CLI entry point
- `agents/` — sub-agent definitions
- `commands/` — slash command definitions
- `hooks/` — Claude Code lifecycle hooks
- `.claude-plugin/` — plugin manifest

### 0.2 The structural ceiling

The current architecture improves test coverage and sharpens
existing suites but cannot improve software engineering quality
beyond that ceiling because:

1. Correctness is gated entirely on the sealed test suite, which is
    derived from the same model-authored loop — no exogenous ground truth
2. Learnings from tournaments are ephemeral — nothing survives a run
    boundary in a structured, typed, evidence-gated way
3. Memory injection (where it exists) is bulk and undifferentiated —
    CTIM-Rover proved a single noisy word in a memory item can steer
    an agent to the wrong function
4. The improvement axis is purely test-sharpening — there is no rubric,
    spec, or property dimension that can catch architectural or semantic
    failures tests pass through
5. Sub-agents are not topologically typed — winning configurations
    from prior runs cannot be selectively reused

### 0.3 The theoretical basis for the fix

| Research | Key result | STZ implication |
|---|---|---|
| AlphaEvolve (DeepMind, 2025) | Automated verifier is the necessary condition for RSI | Exogenous verifier plane required |
| SICA (Bristol/iGent, 2025) | 17%→53% SWE-bench via iterative meta-control + benchmarking | Meta-control loop + held-out eval |
| SelfEvolve (2026) | TDD: 92.7% pass at 2.2 iter vs 72.7% at 4.7 without (p<0.001) | spec-first mode as first-class run mode |
| EvolveR (2025) | Offline distillation of trajectories into abstract principles | Two-stage: distil then retrieve |
| MemEvolve/ICML 2026 | Evolve ESRM memory architecture, not just content | Memory primitive as evolvable gene |
| DGM/Sakana 2025 | Open-ended agent archive + parent lineage selection | Lineage-aware promotion ledger |
| ABSTRAL (2026) | Contrastive trace analysis discovers specialist roles | Post-tournament topology promotion |
| MOSS (2026) | Source-level rewriting boosts OpenClaw 0.25→0.61 | Failure-anchored structural rewrite path |
| PostTrainBench (2026) | Agents reward-hack benchmarks when self-defining success | Held-out calibration is non-negotiable |
| Unfaithfulness/ICML 2026 | Condensed experience ignored when conflicting with priors | Symbol-anchored, traceable artifacts only |

---

## 1. Target Architecture Overview

STZ vNext is structured as seven planes. Each plane has a single
responsibility, defined persistence semantics, and explicit
inter-plane contracts.

```
┌─────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATION PLANE                      │
│  Issue loop · Slice loop · Tournament coordinator · Budget gate │
└───────────────────────────┬─────────────────────────────────────┘
                            │ spawns
┌───────────────────────────▼─────────────────────────────────────┐
│                     CANDIDATE GENERATION PLANE                  │
│  Planner · RubricAuthor · Patcher · SpecAuthor · TraceRecorder  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ produces
┌───────────────────────────▼─────────────────────────────────────┐
│                       VERIFIER STACK PLANE                      │
│  ExecutionVerifier · RubricJudge · SpecVerifier · HackDetector  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ scores flow to
┌───────────────────────────▼─────────────────────────────────────┐
│                      ARTIFACT STORE PLANE                       │
│  candidates/ (ephemeral) · promoted/ (durable) · quarantine/    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ gated by
┌───────────────────────────▼─────────────────────────────────────┐
│                      PROMOTION LEDGER PLANE                     │
│  Append-only JSONL · Evidence links · Lineage tracking          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ feeds
┌───────────────────────────▼─────────────────────────────────────┐
│                     PROJECT KNOWLEDGE PLANE                     │
│  Read-only during execution · Typed tiers · Selective retrieval │
└───────────────────────────┬─────────────────────────────────────┘
                            │ measured by
┌───────────────────────────▼─────────────────────────────────────┐
│                   CONTINUAL EVALUATION PLANE                    │
│  Chronological stream · Calibration set · Ablation runner       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Repository Layout

The full target directory tree, showing what exists vs what is new:

```
slice-tournament-zoo/
├── .claude-plugin/              # EXISTS — extend manifest only
│   ├── plugin.json              # ADD: new agent declarations
│   └── settings.json
├── .github/                     # EXISTS — add eval workflows
│   └── workflows/
│       ├── eval-chronological.yml   # NEW
│       └── ablation-report.yml      # NEW
├── src/                         # EXISTS — refactor in phases
│   ├── index.ts                 # EXISTS
│   ├── types.ts                 # EXISTS — extend with new types
│   ├── bridge.ts                # EXISTS — add write guard hooks
│   ├── harness.ts               # EXISTS — add manifest emission
│   ├── eval-runner.ts           # EXISTS — add triad scoring
│   ├── selection.ts             # EXISTS — add triad reranking
│   ├── specdiff.ts              # EXISTS — extend for spec artifacts
│   ├── grpo.ts                  # EXISTS — keep, extend weights
│   ├── hack-detector.ts         # EXISTS — extend for evaluator capture
│   ├── judge-reliability.ts     # EXISTS — extend for rubric calibration
│   ├── merge.ts                 # EXISTS
│   ├── state.ts                 # EXISTS — extend for manifest tracking
│   ├── budget.ts                # EXISTS
│   ├── seal.ts                  # EXISTS
│   ├── cli.ts                   # EXISTS — add promote/ablate commands
│   ├── injector.ts              # EXISTS — replace bulk with selective
│   │
│   ├── artifacts/               # NEW MODULE
│   │   ├── artifact-store.ts    # Core artifact CRUD + write guard
│   │   ├── artifact-types.ts    # Typed artifact schemas
│   │   ├── artifact-index.ts    # FAISS-backed retrieval index
│   │   └── artifact-validator.ts
│   │
│   ├── primitives/              # NEW MODULE
│   │   ├── primitive-types.ts   # HarnessPrimitive<T> interfaces
│   │   ├── primitive-registry.ts
│   │   └── manifest-emitter.ts
│   │
│   ├── verifiers/               # NEW MODULE
│   │   ├── execution-verifier.ts
│   │   ├── rubric-verifier.ts
│   │   ├── spec-verifier.ts
│   │   └── triad-scorer.ts
│   │
│   ├── knowledge/               # NEW MODULE
│   │   ├── knowledge-tiers.ts   # WorkingMemory/Candidate/Project/Meta
│   │   ├── retrieval-policy.ts  # ESRM-structured retrieval
│   │   └── retrieval-explainer.ts
│   │
│   ├── ledger/                  # NEW MODULE
│   │   ├── ledger-writer.ts     # Append-only JSONL writer
│   │   ├── ledger-reader.ts
│   │   ├── promotion-engine.ts
│   │   └── lineage-tracker.ts   # DGM-style parent lineage
│   │
│   ├── memory/                  # NEW MODULE (MemEvolve-inspired)
│   │   ├── memory-primitive.ts  # ESRM typed memory
│   │   ├── memory-evolver.ts    # Bilevel evolution loop
│   │   └── memory-pareto.ts     # Pareto ranking: success/cost/latency
│   │
│   ├── traces/                  # NEW MODULE (ABSTRAL-inspired)
│   │   ├── trace-recorder.ts
│   │   ├── trace-analyser.ts    # Contrastive win/loss analysis
│   │   └── topology-proposer.ts # Specialist role discovery
│   │
│   ├── eval/                    # NEW MODULE
│   │   ├── chronological-stream.ts
│   │   ├── calibration-set.ts
│   │   ├── ablation-runner.ts
│   │   └── metrics-reporter.ts
│   │
│   └── rewrite/                 # NEW MODULE (MOSS-inspired, Phase 6 only)
│       ├── failure-anchor.ts
│       ├── rewrite-proposer.ts
│       └── rewrite-gate.ts
│
├── agents/                      # EXISTS — add new agent definitions
│   ├── planner.md               # EXISTS or extend
│   ├── rubric-author.md         # NEW
│   ├── rubric-judge.md          # NEW
│   ├── spec-author.md           # NEW
│   ├── spec-verifier.md         # NEW
│   ├── promoter.md              # NEW
│   ├── consolidator.md          # NEW
│   └── trace-analyst.md         # NEW
│
├── commands/                    # EXISTS — add commands
│   ├── promote.md               # NEW: /stz:promote
│   ├── ablate.md                # NEW: /stz:ablate
│   ├── report.md                # NEW: /stz:report
│   └── lineage.md               # NEW: /stz:lineage
│
├── repos/                       # NEW: per-project state root
│   └── <project-id>/
│       └── .stz/
│           ├── config.yaml
│           ├── manifests/
│           ├── artifacts/
│           │   ├── candidates/
│           │   ├── promoted/
│           │   └── quarantine/
│           ├── ledger/
│           │   └── promotions.jsonl
│           └── eval/
│               ├── issue-stream/
│               ├── calibration/
│               └── reports/
│
├── docs/                        # EXISTS — add architecture docs
├── experiments/                 # EXISTS — add ablation configs
├── test/                        # EXISTS — add integration tests
├── package.json                 # EXISTS
├── tsconfig.json                # EXISTS
└── vitest.config.ts             # EXISTS
```

---

## 3. Type System Extension

### 3.1 Core artifact types (src/artifacts/artifact-types.ts)

```typescript
export type ArtifactKind =
    | 'patch'
    | 'test'
    | 'rubric'
    | 'behavior_spec'
    | 'property_generator'
    | 'search_heuristic'
    | 'repo_note'
    | 'retrieval_index_snapshot'
    | 'memory_architecture'
    | 'topology_proposal'
    | 'promotion_decision'
    | 'rewrite_proposal';

export type ArtifactStatus =
    | 'candidate'
    | 'pending_promotion'
    | 'promoted'
    | 'quarantined'
    | 'rejected'
    | 'sunset';

export type ArtifactTrust =
    | 'untrusted'    // fresh candidate
    | 'provisional'  // passed single eval round
    | 'trusted'      // passed promotion gate
    | 'verified';    // passed + independently reproduced

export interface ArtifactMetadata {
    artifactId: string;          // e.g. "rubric.api-boundary.v1"
    kind: ArtifactKind;
    status: ArtifactStatus;
    trust: ArtifactTrust;
    repo: string;
    sourceRun: string;
    sourceIssue?: string;
    createdBy: AgentRole;
    createdAt: string;           // ISO-8601
    version: number;
    supersedes?: string;         // prior artifactId
    dependencies: string[];      // other artifactIds this depends on
    anchoredSymbols?: string[];  // code symbols this artifact is bound to
    evidence: EvidenceLink[];
    promotionState: PromotionState;
}

export interface EvidenceLink {
    runId: string;
    issueId: string;
    triадScore: TriadScore;
    calibrationPassed: boolean;
    regressionDelta: number;
}

export interface TriadScore {
    execution: number;    // 0-1
    rubric: number;       // 0-1
    spec: number;         // 0-1
    composite: number;    // weighted: 0.5*exec + 0.3*rubric + 0.2*spec
    hardFail: boolean;    // any hard-fail criterion triggered
    hardFailReason?: string;
}

export type PromotionState =
    | 'pending'
    | 'under_review'
    | 'promoted'
    | 'rejected'
    | 'sunset';
```

### 3.2 Harness primitive types (src/primitives/primitive-types.ts)

```typescript
export type PrimitiveKind =
    | 'planner'
    | 'slicer'
    | 'candidate'
    | 'retrieval'
    | 'verifier'
    | 'promotion'
    | 'consolidation'
    | 'memory'
    | 'topology';

export interface HarnessPrimitive<TConfig = Record<string, unknown>> {
    id: string;
    version: string;
    kind: PrimitiveKind;
    description: string;
    config: TConfig;
    inputSchema: Record<string, unknown>;   // JSON Schema
    outputSchema: Record<string, unknown>;  // JSON Schema
    safety: {
    readonly: boolean;
    promotable: boolean;
    allowedRepos?: string[];
    maxBlastRadius: 'local' | 'project' | 'global';
    };
    lineage?: {
    parentId: string;
    mutationType: 'config_change' | 'prompt_change' | 'logic_change';
    mutationRationale: string;
    };
}

export interface HarnessManifest {
    manifestId: string;
    repo: string;
    createdAt: string;
    runId?: string;
    primitives: {
    planner: string;    // primitive id
    slicer: string;
    candidate: string;
    retrieval: string;
    verifier: string;
    promotion: string;
    consolidation: string;
    memory: string;
    };
    geneValues: GeneValues;  // current evolvable gene settings
}

export interface GeneValues {
    // Safe genes — evolvable from Phase 6 onward
    candidateBranches: number;         // 2-6
    sliceGranularity: 'coarse' | 'medium' | 'fine';
    retrievalTopK: number;             // 1-5
    triадWeights: { exec: number; rubric: number; spec: number };
    requestBehaviorSpec: boolean;
    heuristicOrdering: 'recency' | 'evidence' | 'symbol_match';
    rerankingThreshold: number;        // 0-1
    memoryArchitecture: string;        // MemEvolve ESRM variant id

    // Medium-risk genes — evolvable from Phase 7 onward
    plannerPromptVariant: string;
    rubricAuthorPromptVariant: string;
    specAuthorPromptVariant: string;

    // High-risk genes — never auto-evolved
    promotionThresholds: never;        // manual only
    defaultKnowledgeLoadingPolicy: never;
    orchestratorLogic: never;
}
```

### 3.3 Memory primitive types (src/memory/memory-primitive.ts)

Following MemEvolve's Encode-Store-Retrieve-Manage schema:

```typescript
export interface MemoryPrimitive {
    id: string;
    variant: string;    // e.g. "esrm.symbol-anchored.v1"

    encode: EncodePolicy;
    store: StorePolicy;
    retrieve: RetrievePolicy;
    manage: ManagePolicy;
}

export interface EncodePolicy {
    strategy: 'trajectory' | 'principle' | 'symbol_anchored' | 'failure_anchored';
    compressionRatio: number;    // 0.1-1.0
    requiresSymbolBinding: boolean;
    // If true, each encoded item MUST list anchoredSymbols
    // This addresses ICML 2026 unfaithfulness: vague items get rejected
}

export interface StorePolicy {
    backend: 'faiss' | 'bm25' | 'hybrid';
    maxItemsPerKind: Record<ArtifactKind, number>;
    deduplicationStrategy: 'none' | 'symbol_hash' | 'semantic';
    versionControl: boolean;    // always true for promoted tier
}

export interface RetrievePolicy {
    trigger: 'per_step' | 'per_slice' | 'per_issue' | 'never';
    // per_step is the CTIM-Rover-safe pattern
    queryComponents: Array<'issue_text' | 'changed_symbols' | 'slice_objective' | 'error_trace'>;
    maxItemsPerKind: Record<ArtifactKind, number>;
    requiresExplanation: boolean;  // always true
    explanationFields: Array<'why_selected' | 'expected_benefit' | 'confidence' | 'evidence_links'>;
}

export interface ManagePolicy {
    evictionStrategy: 'lru' | 'evidence_weight' | 'pareto';
    retentionOnPromotion: boolean;
    sunsetOnNegativeEvidence: boolean;
    paretoObjectives?: Array<'task_success' | 'token_cost' | 'latency'>;
}
```

### 3.4 Promotion ledger types (src/ledger/ledger-writer.ts)

```typescript
export type PromotionDecision = 'promote' | 'quarantine' | 'reject' | 'sunset';

export interface LedgerEntry {
    promotionId: string;           // e.g. "promo_000123"
    timestamp: string;             // ISO-8601
    repo: string;
    subject: {
    kind: ArtifactKind;
    id: string;
    version: number;
    };
    basedOnRuns: string[];
    evaluation: {
    baselineManifest: string;
    candidateManifest: string;
    sampleSize: number;
    executionDelta: number;
    rubricDelta: number;
    specDelta: number;
    regressionDelta: number;
    toolCostDelta: number;
    calibrationPassed: boolean;
    ablationResults?: AblationResult[];
    };
    decision: PromotionDecision;
    reason: string[];
    risk: 'low' | 'medium' | 'high';
    supersedes?: string;
    lineage?: {
    parentArtifactId: string;
    generationDepth: number;
    branchPath: string[];        // DGM-style lineage chain
    };
    approvedBy: 'automatic' | 'manual';
    approvedAt?: string;
}

export interface AblationResult {
    condition: string;    // e.g. "no_retrieval" | "rubric_only" | "full_triad"
    score: number;
    sampleSize: number;
}
```

### 3.5 Agent role types

```typescript
export type AgentRole =
    | 'planner'
    | 'rubric_author'
    | 'rubric_judge'
    | 'candidate_patcher'
    | 'spec_author'
    | 'spec_verifier'
    | 'execution_verifier'
    | 'promoter'
    | 'consolidator'
    | 'trace_analyst'
    | 'topology_proposer'
    | 'memory_evolver'
    | 'rewrite_proposer';   // Phase 6 only

export interface AgentPermissions {
    role: AgentRole;
    canWriteCode: boolean;
    canWriteCandidateArtifacts: boolean;
    canWritePromotedArtifacts: boolean;
    canReadProjectKnowledge: boolean;
    canReadKnowledgeTiers: KnowledgeTier[];
    maxRetrievedItemsPerStep: number;
    allowedArtifactKinds: ArtifactKind[];
}

export const AGENT_PERMISSION_TABLE: Record<AgentRole, AgentPermissions> = {
    planner: {
    role: 'planner',
    canWriteCode: false,
    canWriteCandidateArtifacts: true,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['project', 'meta'],
    maxRetrievedItemsPerStep: 3,
    allowedArtifactKinds: ['search_heuristic', 'repo_note'],
    },
    rubric_author: {
    role: 'rubric_author',
    canWriteCode: false,
    canWriteCandidateArtifacts: true,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['project'],
    maxRetrievedItemsPerStep: 2,
    allowedArtifactKinds: ['rubric'],
    },
    rubric_judge: {
    role: 'rubric_judge',
    canWriteCode: false,
    canWriteCandidateArtifacts: false,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['project'],
    maxRetrievedItemsPerStep: 2,
    allowedArtifactKinds: [],
    },
    candidate_patcher: {
    role: 'candidate_patcher',
    canWriteCode: true,
    canWriteCandidateArtifacts: true,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['project'],
    maxRetrievedItemsPerStep: 3,
    allowedArtifactKinds: ['patch', 'test'],
    },
    spec_author: {
    role: 'spec_author',
    canWriteCode: false,
    canWriteCandidateArtifacts: true,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['project'],
    maxRetrievedItemsPerStep: 3,
    allowedArtifactKinds: ['behavior_spec', 'property_generator'],
    },
    spec_verifier: {
    role: 'spec_verifier',
    canWriteCode: false,
    canWriteCandidateArtifacts: false,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: false,
    canReadKnowledgeTiers: [],
    maxRetrievedItemsPerStep: 0,
    allowedArtifactKinds: [],
    },
    execution_verifier: {
    role: 'execution_verifier',
    canWriteCode: false,
    canWriteCandidateArtifacts: false,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: false,
    canReadKnowledgeTiers: [],
    maxRetrievedItemsPerStep: 0,
    allowedArtifactKinds: [],
    },
    promoter: {
    role: 'promoter',
    canWriteCode: false,
    canWriteCandidateArtifacts: false,
    canWritePromotedArtifacts: true,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['project', 'meta'],
    maxRetrievedItemsPerStep: 5,
    allowedArtifactKinds: ['promotion_decision'],
    },
    consolidator: {
    role: 'consolidator',
    canWriteCode: false,
    canWriteCandidateArtifacts: true,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['project', 'meta'],
    maxRetrievedItemsPerStep: 5,
    allowedArtifactKinds: ['rubric', 'behavior_spec', 'search_heuristic'],
    },
    trace_analyst: {
    role: 'trace_analyst',
    canWriteCode: false,
    canWriteCandidateArtifacts: true,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['project'],
    maxRetrievedItemsPerStep: 3,
    allowedArtifactKinds: ['topology_proposal'],
    },
    topology_proposer: {
    role: 'topology_proposer',
    canWriteCode: false,
    canWriteCandidateArtifacts: true,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['meta'],
    maxRetrievedItemsPerStep: 3,
    allowedArtifactKinds: ['topology_proposal'],
    },
    memory_evolver: {
    role: 'memory_evolver',
    canWriteCode: false,
    canWriteCandidateArtifacts: true,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['meta'],
    maxRetrievedItemsPerStep: 3,
    allowedArtifactKinds: ['memory_architecture'],
    },
    rewrite_proposer: {   // Phase 6 only — gated behind config flag
    role: 'rewrite_proposer',
    canWriteCode: false,    // proposes only — never executes
    canWriteCandidateArtifacts: true,
    canWritePromotedArtifacts: false,
    canReadProjectKnowledge: true,
    canReadKnowledgeTiers: ['project', 'meta'],
    maxRetrievedItemsPerStep: 3,
    allowedArtifactKinds: ['rewrite_proposal'],
    },
};
```

---

## 4. Write Guard (Phase 0 — Week 1, Day 1-2)

This is the single most important change. Every persistence event
must go through a typed gate. Add to `src/bridge.ts`:

```typescript
// src/bridge.ts — add near top of file

export class WriteGuard {
    private static readonly FORBIDDEN_DIRECT_WRITE_PATHS = [
    /CLAUDE\.md$/,
    /\.stz\/promoted\//,
    /\.stz\/ledger\//,
    /agents\/.*\.md$/,
    /commands\/.*\.md$/,
    ];

    static assertAllowed(
    path: string,
    callerRole: AgentRole,
    artifactKind?: ArtifactKind
    ): void {
    for (const pattern of this.FORBIDDEN_DIRECT_WRITE_PATHS) {
        if (pattern.test(path)) {
        throw new WriteGuardViolation(
            `Role ${callerRole} attempted direct write to protected path: ${path}. ` +
            `Use ArtifactStore.writeCandidate() then promote via LedgerEngine.`
        );
        }
    }
    if (callerRole === 'candidate_patcher' && path.includes('/promoted/')) {
        throw new WriteGuardViolation(
        `candidate_patcher cannot write directly to promoted/`
        );
    }
    if (artifactKind === 'repo_note' && callerRole !== 'consolidator') {
        throw new WriteGuardViolation(
        `Only consolidator may write repo_note artifacts`
        );
    }
    }

    static wrap<T>(
    fn: (...args: unknown[]) => T,
    callerRole: AgentRole
    ): (...args: unknown[]) => T {
    return (...args) => {
        // Intercept any fs write calls — integrate with existing
        // bridge file write hooks
        return fn(...args);
    };
    }
}

export class WriteGuardViolation extends Error {
    constructor(message: string) {
    super(`[WriteGuard] ${message}`);
    this.name = 'WriteGuardViolation';
    }
}
```

Manifest emission — add to `src/harness.ts`:

```typescript
// At the start of every run, emit the current manifest

async function emitRunManifest(
    repo: string,
    runId: string,
    primitiveRegistry: PrimitiveRegistry,
    geneValues: GeneValues
): Promise<HarnessManifest> {
    const manifest: HarnessManifest = {
    manifestId: `manifest_${runId}`,
    repo,
    createdAt: new Date().toISOString(),
    runId,
    primitives: primitiveRegistry.getActiveIds(),
    geneValues,
    };
    // Write to .stz/manifests/ — this path IS allowed
    await fs.writeFile(
    `.stz/manifests/${manifest.manifestId}.json`,
    JSON.stringify(manifest, null, 2)
    );
    return manifest;
}
```

---

## 5. Artifact Store (Phase 0 — Week 1, Day 3-5)

```typescript
// src/artifacts/artifact-store.ts

export class ArtifactStore {
    private readonly basePath: string;

    constructor(repo: string) {
    this.basePath = `repos/${repo}/.stz/artifacts`;
    }

    // Only path for creating candidate artifacts
    async writeCandidate<T extends ArtifactKind>(
    kind: T,
    runId: string,
    content: unknown,
    metadata: Partial<ArtifactMetadata>,
    callerRole: AgentRole
    ): Promise<ArtifactMetadata> {
    WriteGuard.assertAllowed(
        `${this.basePath}/candidates/`,
        callerRole,
        kind
    );
    const id = this.generateId(kind, runId);
    const fullMetadata: ArtifactMetadata = {
        artifactId: id,
        kind,
        status: 'candidate',
        trust: 'untrusted',
        version: 1,
        createdAt: new Date().toISOString(),
        createdBy: callerRole,
        repo: metadata.repo ?? '',
        sourceRun: runId,
        dependencies: [],
        evidence: [],
        promotionState: 'pending',
        ...metadata,
    };
    // Validate symbol anchoring for unfaithfulness mitigation
    if (this.requiresSymbolAnchor(kind) && !fullMetadata.anchoredSymbols?.length) {
        throw new ArtifactValidationError(
        `${kind} artifact must declare anchoredSymbols to prevent ` +
        `unfaithful retrieval (per ICML 2026 findings)`
        );
    }
    const dir = `${this.basePath}/candidates/run-${runId}/${kind}`;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(`${dir}/${id}.json`, JSON.stringify({ content, metadata: fullMetadata }, null, 2));
    return fullMetadata;
    }

    // Only called by promoter via LedgerEngine after gate passage
    async promoteArtifact(
    artifactId: string,
    ledgerEntryId: string
    ): Promise<void> {
    // Reads from candidates/, writes to promoted/
    // Immutable once written
    const candidate = await this.readCandidate(artifactId);
    const promoted = {
        ...candidate,
        metadata: {
        ...candidate.metadata,
        status: 'promoted' as const,
        trust: 'trusted' as const,
        promotionState: 'promoted' as const,
        },
        ledgerEntryId,
        promotedAt: new Date().toISOString(),
    };
    const dir = `${this.basePath}/promoted/${candidate.metadata.kind}`;
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
        `${dir}/${artifactId}.json`,
        JSON.stringify(promoted, null, 2)
    );
    }

    private requiresSymbolAnchor(kind: ArtifactKind): boolean {
    return ['behavior_spec', 'property_generator', 'rubric'].includes(kind);
    }

    private generateId(kind: ArtifactKind, runId: string): string {
    return `${kind}.${runId}.${Date.now()}`;
    }
}
```

---

## 6. Verifier Triad (Phase 3 — Week 2-3)

### 6.1 Execution verifier (src/verifiers/execution-verifier.ts)

Extends the existing `eval-runner.ts`. Key additions:

```typescript
export interface ExecutionVerifierResult {
    compileSuccess: boolean;
    targetTestsPassed: number;
    targetTestsTotal: number;
    regressionDelta: number;       // negative = regressions introduced
    heldOutCalibrationPassed: boolean;
    flakyTestsDetected: string[];
    resourceSanityPassed: boolean; // time + memory within bounds
    rawScore: number;              // 0-1
    hardFail: boolean;
    hardFailReason?: string;
}

// Hard fail conditions — any triggers immediate rejection
const HARD_FAIL_CONDITIONS = {
    compileFailed: (r: ExecutionVerifierResult) => !r.compileSuccess,
    targetIssueUnresolved: (r: ExecutionVerifierResult) =>
    r.targetTestsPassed / r.targetTestsTotal < 0.5,
    heldOutCalibrationFailed: (r: ExecutionVerifierResult) =>
    !r.heldOutCalibrationPassed,
    severeRegression: (r: ExecutionVerifierResult) =>
    r.regressionDelta < -0.05,
};
```

Test pool segregation — critical distinction:

```typescript
export type TestPoolKind =
    | 'baseline'          // pre-existing, not authored this run
    | 'candidate_generated' // written by candidate_patcher this run
    | 'regression'          // from prior successful promotions
    | 'calibration_held_out'; // never used for training-like selection

// Candidate-generated tests support a case but cannot define correctness.
// Promotion requires calibration_held_out passage.
export function computeTestPoolWeights(): Record<TestPoolKind, number> {
    return {
    baseline: 0.50,
    candidate_generated: 0.10,   // lowest trust
    regression: 0.25,
    calibration_held_out: 0.15,  // highest per-test signal value
    };
}
```

### 6.2 Rubric verifier (src/verifiers/rubric-verifier.ts)

The rubric-author sub-agent (agent definition in agents/rubric-author.md)
receives the repo + issue and produces a rubric artifact BEFORE any
patch is generated. This mirrors Agentic Rubrics ICLR 2026 (+3.5% on
SWE-Bench Verified from pre-patch rubric authoring).

Rubric schema (YAML artifact content):

```yaml
# Stored as behavior_spec artifact, kind: rubric
rubric_id: rubric.{issue_id}.v1
repo: {repo}
issue: {issue_id}
authored_before_patch: true   # MUST be true — verified by rubric-judge
criteria:
    - id: c1
    title: "Resolves described failure mode"
    weight: 0.25
    kind: semantic
    pass_conditions:
        - "{specific condition derived from issue text}"
        - "{specific condition derived from issue text}"
    anchoredSymbols: ["{module}.{function}"]  # symbol anchor required
    - id: c2
    title: "Respects module boundary"
    weight: 0.15
    kind: architecture
    pass_conditions:
        - "{condition}"
    anchoredSymbols: ["{module}"]
    - id: c3
    title: "Avoids regression in adjacent API"
    weight: 0.20
    kind: compatibility
    pass_conditions:
        - "{condition}"
    anchoredSymbols: ["{adjacent_module}.{public_api}"]
    - id: c4
    title: "Change is localized and minimally invasive"
    weight: 0.10
    kind: maintainability
    pass_conditions:
        - "Diff touches ≤3 non-test files"
        - "No new global state introduced"
    - id: c5
    title: "Naming and types align with repo conventions"
    weight: 0.10
    kind: style
    pass_conditions:
        - "{repo-specific convention observed from exploration}"
    - id: c6
    title: "Test changes are semantically justified"
    weight: 0.20
    kind: verification
    pass_conditions:
        - "New tests exercise the fixed failure mode specifically"
        - "Tests do not overfit to implementation details"
```

Rubric judge prompt template (agents/rubric-judge.md):

```markdown
---
name: rubric-judge
description: Score a candidate patch against a pre-authored rubric.
---

You are the rubric-judge. You receive:
1. A rubric authored BEFORE this patch was generated
2. A candidate patch diff
3. The repository context (touched files only)

You must NOT be the same agent that generated the patch or the rubric.

For each criterion in the rubric:
- Score 0.0 to 1.0
- Cite specific evidence from the diff or repo context
- State which anchoredSymbols you examined
- Flag if the rubric criterion is vacuous (cannot be evaluated from diff)

Hard rules:
- If authored_before_patch is false, reject the rubric entirely
- If >2 criteria lack symbol anchors, reduce total rubric score by 0.3
- If any criterion is vacuous, score it 0.0 and note it

Output format: JSON matching RubricVerifierResult schema
```

### 6.3 Spec verifier (src/verifiers/spec-verifier.ts)

Spec-Harness-lite: executable behavioral specs for touched functions.
Scope is deliberately narrow (per CodeSpecBench findings):

- Touched API boundary functions
- Stateful workflow entry points
- Permission/auth decision points
- Financial/numeric computation functions
- Serialization/deserialization boundaries

Spec format (Python, stored as behavior_spec artifact):

```python
# behavior_spec/{module}_{function}.py
# anchoredSymbols: ["{module}.{function}"]
# version: 1
# sourceIssue: {issue_id}

from typing import Any

def pre(ctx: dict, args: dict) -> None:
    """Preconditions — must hold before function executes"""
    assert args.get('user_id') is not None, "user_id required"
    assert isinstance(args.get('email'), str), "email must be string"

def post(ctx_before: dict, args: dict, result: Any, ctx_after: dict) -> None:
    """Postconditions — must hold after function returns"""
    assert result.get('email') == args.get('email'), \
        "returned email must match input"
    assert ctx_after['audit_log']['last_event']['type'] == 'user_email_updated', \
        "audit log must record event"

def invariants(ctx_before: dict, ctx_after: dict) -> None:
    """State invariants — must hold across call"""
    assert ctx_after['account']['status'] == ctx_before['account']['status'], \
        "account status must not change during email update"

def forbidden(ctx_before: dict, args: dict, result: Any, ctx_after: dict) -> None:
    """Forbidden side effects"""
    assert 'password' not in result, "password must never appear in response"
```

Spec-stubs are auto-generated by spec-author for any function in the
patch diff that matches the narrow scope criteria above. The spec-author
outputs stub specs with TODO markers; human review fills semantics where
needed; the spec-verifier runs them.

### 6.4 Triad scorer (src/verifiers/triad-scorer.ts)

```typescript
export function computeTriadScore(
    execution: ExecutionVerifierResult,
    rubric: RubricVerifierResult,
    spec: SpecVerifierResult
): TriadScore {
    if (execution.hardFail || rubric.hardFail || spec.hardFail) {
    return {
        execution: execution.rawScore,
        rubric: rubric.rawScore,
        spec: spec.rawScore,
        composite: 0,
        hardFail: true,
        hardFailReason:
        execution.hardFailReason ??
        rubric.hardFailReason ??
        spec.hardFailReason,
    };
    }
    const composite =
    0.50 * execution.rawScore +
    0.30 * rubric.rawScore +
    0.20 * spec.rawScore;
    return {
    execution: execution.rawScore,
    rubric: rubric.rawScore,
    spec: spec.rawScore,
    composite,
    hardFail: false,
    };
}

// Hard fail conditions
export const HARD_FAIL_TRIGGERS = {
    executionHardFail: (r: TriadScore) => r.execution < 0.1,
    noRubricOrSpecGain: (exec: number, rubric: number, spec: number) =>
    // Prevent test-only wins from masquerading as SWE improvement
    rubric < 0.3 && spec < 0.3,
    evaluatorCaptureSuspected: (
    rubricAuthorRun: string,
    patcherRun: string
    ) => rubricAuthorRun === patcherRun,
    // Same run ID = same entity generated patch + rubric = self-approval
};
```

---

## 7. Selective Retrieval (Phase 4 — Week 4)

Replacing the existing bulk injection in `src/injector.ts`:

```typescript
// src/knowledge/retrieval-policy.ts

export class SelectiveRetriever {
    private readonly store: ArtifactStore;
    private readonly index: ArtifactIndex;

    // Retrieval caps by artifact kind — PostTrainBench-safe defaults
    private readonly DEFAULT_CAPS: Record<ArtifactKind, number> = {
    rubric: 2,
    behavior_spec: 3,
    search_heuristic: 1,
    repo_note: 0,          // disabled by default (CTIM-Rover risk)
    test: 0,               // never retrieved into generation context
    patch: 0,
    property_generator: 2,
    retrieval_index_snapshot: 0,
    memory_architecture: 1,
    topology_proposal: 0,
    promotion_decision: 0,
    rewrite_proposal: 0,
    };

    async retrieve(
    request: RetrievalRequest,
    policy: RetrievePolicy
    ): Promise<RetrievalResult[]> {
    if (policy.trigger === 'never') return [];

    const caps = this.computeCaps(request, policy);
    const results: RetrievalResult[] = [];

    for (const kind of request.requestedKinds) {
        const cap = caps[kind] ?? 0;
        if (cap === 0) continue;

        const query = this.buildQuery(request, policy);
        const hits = await this.index.search(query, kind, cap);

        for (const hit of hits) {
        results.push({
            artifact: hit,
            explanation: {
            whySelected: await this.explainSelection(hit, request),
            expectedBenefit: hit.metadata.anchoredSymbols?.join(', ') ?? 'general',
            confidence: hit.score,
            evidenceLinks: hit.metadata.evidence,
            },
        });
        }
    }

    // Log every retrieval event for audit
    await this.logRetrieval(request, results);
    return results;
    }

    // Build query from multiple components per MemEvolve ESRM encode policy
    private buildQuery(
    request: RetrievalRequest,
    policy: RetrievePolicy
    ): string {
    const parts: string[] = [];
    if (policy.queryComponents.includes('issue_text')) {
        parts.push(request.issue);
    }
    if (policy.queryComponents.includes('changed_symbols')) {
        parts.push(...(request.changedSymbols ?? []));
    }
    if (policy.queryComponents.includes('slice_objective')) {
        parts.push(request.sliceObjective);
    }
    return parts.join(' ');
    }
}

export interface RetrievalRequest {
    repo: string;
    issue: string;
    sliceObjective: string;
    changedSymbols?: string[];
    requestedKinds: ArtifactKind[];
    callerRole: AgentRole;
    stepId: string;   // per-step retrieval tracking
}

export interface RetrievalResult {
    artifact: ArtifactMetadata & { content: unknown };
    explanation: {
    whySelected: string;
    expectedBenefit: string;
    confidence: number;
    evidenceLinks: EvidenceLink[];
    };
}
```

Knowledge tier hierarchy:

```typescript
// src/knowledge/knowledge-tiers.ts

export type KnowledgeTier = 'working' | 'candidate' | 'project' | 'meta';

export const KNOWLEDGE_TIER_POLICY: Record<KnowledgeTier, {
    writableBy: AgentRole[];
    readableBy: AgentRole[];
    persists: boolean;
    requiresPromotion: boolean;
    maxLifetime: 'run' | 'session' | 'permanent';
}> = {
    working: {
    writableBy: ['planner', 'candidate_patcher', 'spec_author', 'rubric_author'],
    readableBy: ['planner', 'candidate_patcher', 'spec_author', 'rubric_author'],
    persists: false,
    requiresPromotion: false,
    maxLifetime: 'run',
    },
    candidate: {
    writableBy: ['planner', 'candidate_patcher', 'spec_author', 'rubric_author', 'trace_analyst'],
    readableBy: ['rubric_judge', 'spec_verifier', 'execution_verifier', 'promoter'],
    persists: false,
    requiresPromotion: true,
    maxLifetime: 'session',
    },
    project: {
    writableBy: ['promoter'],   // ONLY promoter, after ledger gate
    readableBy: ['planner', 'rubric_author', 'spec_author', 'candidate_patcher', 'consolidator'],
    persists: true,
    requiresPromotion: true,
    maxLifetime: 'permanent',
    },
    meta: {
    writableBy: ['promoter'],   // ONLY promoter, after ledger gate
    readableBy: ['memory_evolver', 'topology_proposer', 'promoter', 'consolidator'],
    persists: true,
    requiresPromotion: true,
    maxLifetime: 'permanent',
    },
};
```

---

## 8. Promotion Ledger Engine (Phase 5 — Week 4-5)

```typescript
// src/ledger/promotion-engine.ts

export class PromotionEngine {
    private readonly ledgerPath: string;
    private readonly store: ArtifactStore;
    private readonly evalRunner: ChronologicalEvalRunner;
    private readonly config: ProjectConfig;

    async evaluatePromotion(
    artifactId: string,
    candidateManifestId: string
    ): Promise<LedgerEntry> {
    const artifact = await this.store.readCandidate(artifactId);
    const baselineManifest = await this.loadBaselineManifest();

    // Run chronological held-out evaluation
    const evalResult = await this.evalRunner.runComparison({
        baselineManifest,
        candidateManifest: candidateManifestId,
        issueStream: 'calibration_held_out',
        sampleSize: this.config.promotion.minSampleSize,
    });

    const decision = this.makeDecision(evalResult);

    const entry: LedgerEntry = {
        promotionId: `promo_${Date.now()}`,
        timestamp: new Date().toISOString(),
        repo: this.config.projectId,
        subject: {
        kind: artifact.metadata.kind,
        id: artifactId,
        version: artifact.metadata.version,
        },
        basedOnRuns: evalResult.runs,
        evaluation: {
        baselineManifest: baselineManifest.manifestId,
        candidateManifest: candidateManifestId,
        sampleSize: evalResult.sampleSize,
        executionDelta: evalResult.executionDelta,
        rubricDelta: evalResult.rubricDelta,
        specDelta: evalResult.specDelta,
        regressionDelta: evalResult.regressionDelta,
        toolCostDelta: evalResult.costDelta,
        calibrationPassed: evalResult.calibrationPassed,
        ablationResults: evalResult.ablations,
        },
        decision: decision.verdict,
        reason: decision.reasons,
        risk: decision.risk,
        approvedBy: 'automatic',
        approvedAt: new Date().toISOString(),
        lineage: this.buildLineage(artifact),
    };

    // Append to JSONL — never overwrite
    await fs.appendFile(
        this.ledgerPath,
        JSON.stringify(entry) + '\n'
    );

    if (decision.verdict === 'promote') {
        await this.store.promoteArtifact(artifactId, entry.promotionId);
    }

    return entry;
    }

    private makeDecision(eval: EvalComparisonResult): {
    verdict: PromotionDecision;
    reasons: string[];
    risk: 'low' | 'medium' | 'high';
    } {
    const cfg = this.config.promotion;

    // Hard rejection conditions
    if (eval.regressionDelta < -cfg.maxSevereRegressions) {
        return {
        verdict: 'reject',
        reasons: ['Severe regression on held-out set'],
        risk: 'high',
        };
    }
    if (!eval.calibrationPassed) {
        return {
        verdict: 'reject',
        reasons: ['Failed calibration gate'],
        risk: 'high',
        };
    }
    if (eval.sampleSize < cfg.minSampleSize) {
        return {
        verdict: 'quarantine',
        reasons: [`Insufficient sample size: ${eval.sampleSize} < ${cfg.minSampleSize}`],
        risk: 'medium',
        };
    }

    const compositeGain =
        0.5 * eval.executionDelta +
        0.3 * eval.rubricDelta +
        0.2 * eval.specDelta;

    // Test-only win prevention
    if (eval.rubricDelta < 0.01 && eval.specDelta < 0.01) {
        return {
        verdict: 'quarantine',
        reasons: [
            'Gain is test-execution-only. Rubric and spec verifiers show no improvement.',
            'This pattern is consistent with test-sharpening rather than SWE improvement.',
        ],
        risk: 'medium',
        };
    }

    if (compositeGain < cfg.requiredPositiveDelta) {
        return {
        verdict: 'quarantine',
        reasons: [`Composite gain ${compositeGain.toFixed(4)} below threshold ${cfg.requiredPositiveDelta}`],
        risk: 'medium',
        };
    }

    // Cost explosion guard
    if (eval.costDelta > 0.15 && compositeGain < eval.costDelta * 2) {
        return {
        verdict: 'quarantine',
        reasons: ['Cost increase not justified by gain ratio'],
        risk: 'medium',
        };
    }

    return {
        verdict: 'promote',
        reasons: [
        `Composite gain: +${(compositeGain * 100).toFixed(2)}%`,
        `Execution: +${(eval.executionDelta * 100).toFixed(2)}%`,
        `Rubric: +${(eval.rubricDelta * 100).toFixed(2)}%`,
        `Spec: +${(eval.specDelta * 100).toFixed(2)}%`,
        'No severe regressions. Calibration passed.',
        ],
        risk: 'low',
    };
    }

    // DGM-style lineage tracking
    private buildLineage(artifact: StoredArtifact): LedgerEntry['lineage'] {
    if (!artifact.metadata.dependencies.length) return undefined;
    const parentId = artifact.metadata.dependencies;
    const depth = this.computeGenerationDepth(parentId);
    return {
        parentArtifactId: parentId,
        generationDepth: depth,
        branchPath: this.getBranchPath(parentId),
    };
    }
}
```

---

## 9. Contrastive Trace Analysis (ABSTRAL pattern)

The trace-analyst sub-agent runs AFTER a tournament round and compares
winning vs losing agent configurations to discover specialist roles.

```typescript
// src/traces/trace-analyser.ts

export interface TournamentTrace {
    runId: string;
    issueId: string;
    candidateId: string;
    agentConfiguration: {
    primitiveIds: Record<PrimitiveKind, string>;
    geneValues: GeneValues;
    retrievedArtifacts: string[];
    };
    triадScore: TriadScore;
    outcome: 'winner' | 'runner_up' | 'eliminated';
    stepTraces: StepTrace[];
}

export class ContrastiveTraceAnalyser {
    async analyse(
    winnerTraces: TournamentTrace[],
    loserTraces: TournamentTrace[],
    issueContext: IssueContext
    ): Promise<TopologyProposal[]> {
    // Find gene values and agent configs that reliably differentiate
    // winners from losers across multiple tournaments
    const winnerGenes = this.extractGeneDistribution(winnerTraces);
    const loserGenes = this.extractGeneDistribution(loserTraces);

    const differentiatingGenes = this.computeContrastiveSignal(
        winnerGenes,
        loserGenes
    );

    // Find tool-use patterns unique to winners
    const winnerToolPatterns = this.extractToolPatterns(winnerTraces);
    const novelRoles = this.detectNovelRoles(winnerToolPatterns, loserTraces);

    const proposals: TopologyProposal[] = [];

    for (const gene of differentiatingGenes) {
        proposals.push({
        kind: 'gene_adjustment',
        gene: gene.name,
        direction: gene.direction,
        magnitude: gene.magnitude,
        supportingTournaments: gene.tournaments,
        confidence: gene.confidence,
        });
    }

    for (const role of novelRoles) {
        proposals.push({
        kind: 'specialist_role_discovered',
        role: role.description,
        behaviorPattern: role.pattern,
        observedIn: role.traces,
        confidence: role.confidence,
        });
    }

    return proposals;
    }

    // Extract gene value distributions from a set of traces
    private extractGeneDistribution(
    traces: TournamentTrace[]
    ): GeneDistribution {
    // Statistical analysis across gene values in this trace set
    const dist: Record<string, number[]> = {};
    for (const trace of traces) {
        for (const [gene, value] of Object.entries(trace.agentConfiguration.geneValues)) {
        if (!dist[gene]) dist[gene] = [];
        dist[gene].push(typeof value === 'number' ? value : 0);
        }
    }
    return dist;
    }
}

export interface TopologyProposal {
    kind: 'gene_adjustment' | 'specialist_role_discovered' | 'primitive_swap';
    gene?: string;
    direction?: 'increase' | 'decrease';
    magnitude?: number;
    role?: string;
    behaviorPattern?: string;
    observedIn?: string[];
    supportingTournaments?: string[];
    confidence: number;
}
```

---

## 10. MemEvolve Bilevel Evolution (Phase 6)

The memory evolver runs on a schedule (not per-issue) and proposes
memory architecture candidates via the bilevel loop:

```typescript
// src/memory/memory-evolver.ts

export class MemoryEvolver {
    // Inner loop: update memory content (EvolveR offline distillation)
    async innerLoop(
    trajectories: AgentTrajectory[],
    currentMemory: MemoryPrimitive
    ): Promise<MemoryPrimitive> {
    // Distil trajectories into abstract principles (EvolveR stage 1)
    const principles = await this.distilPrinciples(trajectories);

    // Filter by symbol anchoring (unfaithfulness mitigation)
    const anchored = principles.filter(p =>
        p.anchoredSymbols && p.anchoredSymbols.length > 0
    );

    return {
        ...currentMemory,
        store: {
        ...currentMemory.store,
        // Updated content only — architecture unchanged
        },
        _distilledPrinciples: anchored,
    };
    }

    // Outer loop: evolve the ESRM architecture itself
    async outerLoop(
    memoryVariants: MemoryPrimitive[],
    evalResults: MemoryEvalResult[]
    ): Promise<MemoryPrimitive> {
    // Pareto rank by: task success, token cost, latency
    const ranked = this.paretoRank(memoryVariants, evalResults);

    // Select Pareto-optimal front
    const paretoFront = ranked.filter(r => r.isParetoOptimal);

    if (paretoFront.length === 0) return memoryVariants; // no improvement

    // Propose diagnosis-driven redesign of weakest ESRM module
    const weakestModule = this.identifyWeakestModule(paretoFront, evalResults);
    const redesigned = await this.redesignModule(
        paretoFront.variant,
        weakestModule
    );

    // Emit as memory_architecture candidate artifact
    await this.store.writeCandidate(
        'memory_architecture',
        this.currentRunId,
        redesigned,
        {
        repo: this.repo,
        sourceIssue: undefined,
        anchoredSymbols: [],
        },
        'memory_evolver'
    );

    return redesigned;
    }

    private paretoRank(
    variants: MemoryPrimitive[],
    results: MemoryEvalResult[]
    ): Array<{ variant: MemoryPrimitive; isParetoOptimal: boolean }> {
    return variants.map(v => {
        const result = results.find(r => r.variantId === v.id);
        if (!result) return { variant: v, isParetoOptimal: false };

        const dominated = results.some(other => {
        if (other.variantId === result.variantId) return false;
        return (
            other.taskSuccess >= result.taskSuccess &&
            other.tokenCost <= result.tokenCost &&
            other.latency <= result.latency
        );
        });
        return { variant: v, isParetoOptimal: !dominated };
    });
    }
}
```

---

## 11. SelfEvolve TDD Mode

The spec-first run mode leverages SelfEvolve's TDD insight: generate
failing tests (or specs) BEFORE patches. This is a run mode flag, not
a separate system.

```typescript
// src/harness.ts — run mode selection

export type RunMode = 'test_first' | 'spec_first' | 'mixed';

export function selectRunMode(issue: IssueContext): RunMode {
    // spec_first triggers when touched symbols include high-risk domains
    const specFirstIndicators = [
    /auth|permission|access_control/i,
    /payment|billing|invoice|refund/i,
    /serializ|deserializ|encoding/i,
    /state_machine|workflow|transition/i,
    /migration|schema/i,
    /api.boundary|public_interface/i,
    ];

    const touchesSensitiveDomain = specFirstIndicators.some(p =>
    issue.description.match(p) ||
    (issue.changedSymbols ?? []).some(s => s.match(p))
    );

    if (touchesSensitiveDomain) return 'spec_first';

    // test_first when issue has crisp repro + known failing tests
    if (issue.hasReproducibleFailure && issue.failingTestIds?.length) {
    return 'test_first';
    }

    return 'mixed';
}

// spec_first loop order (SelfEvolve TDD pattern):
// 1. spec-author generates behavior spec
// 2. spec-verifier confirms spec is executable and non-vacuous
// 3. rubric-author generates rubric
// 4. candidate-patcher generates patch AGAINST spec + rubric
// 5. triad verifier scores
//
// test_first loop order:
// 1. rubric-author generates rubric
// 2. candidate-patcher generates patch against failing tests
// 3. spec-author generates spec post-hoc for regression protection
// 4. triad verifier scores
//
// mixed: rubric first, then patch, then spec
```

---

## 12. MOSS-Inspired Failure Anchoring (Phase 6 — Gated)

The source-level rewrite path is the highest-risk improvement axis.
It is gated behind an explicit config flag and a separate human
approval requirement. It is never invoked automatically.

```typescript
// src/rewrite/failure-anchor.ts

export interface FailureAnchor {
    failureId: string;
    sourceFile: string;
    failingFunction: string;
    anchoredSymbol: string;
    failureClass:
    | 'structural_limitation'   // text-mutable elements cannot fix this
    | 'tool_hallucination'      // agent consistently invents wrong tool calls
    | 'context_window_loss'     // important context dropped before function call
    | 'instruction_following';  // prompt structure preventing correct behavior
    evidenceRuns: string[];        // minimum 5 supporting runs required
    severity: 'low' | 'medium' | 'high';
}

// Gate — rewrite proposal requires:
// 1. minimum 5 runs with same failure class
// 2. execution verifier confirms failure is reproducible
// 3. rubric judge confirms fix cannot be achieved via prompt alone
// 4. human approval required before rewrite executes
export async function gateRewriteProposal(
    anchor: FailureAnchor,
    config: ProjectConfig
): Promise<{ allowed: boolean; reason: string }> {
    if (!config.features.sourceRewriteEnabled) {
    return {
        allowed: false,
        reason: 'sourceRewriteEnabled=false in project config (Phase 6 gated)',
    };
    }
    if (anchor.evidenceRuns.length < 5) {
    return {
        allowed: false,
        reason: `Insufficient evidence: ${anchor.evidenceRuns.length}/5 runs required`,
    };
    }
    if (anchor.severity === 'high') {
    return {
        allowed: false,
        reason: 'High-severity rewrites require manual override. Set rewrite.allowHighSeverity=true.',
    };
    }
    return { allowed: true, reason: 'Gate passed — pending human approval' };
}
```

---

## 13. Continual Evaluation Plane

```typescript
// src/eval/chronological-stream.ts

export class ChronologicalEvalStream {
    // Issue splits — must be chronological, never shuffled
    // Shuffling inflates scores by allowing future-data leakage
    readonly splits: {
    trainingLike: IssueStream;      // where learnings originate
    promotionHoldout: IssueStream;  // justifies promotion decisions
    finalReportHoldout: IssueStream; // untouched until milestone review
    };

    async runAblation(
    manifests: Record<string, HarnessManifest>,
    issueStream: IssueStream
    ): Promise<AblationReport> {
    const conditions: AblationCondition[] = [
        { id: 'baseline_no_retrieval', retrieval: false, rubric: false, spec: false },
        { id: 'retrieval_only', retrieval: true, rubric: false, spec: false },
        { id: 'rubric_only', retrieval: false, rubric: true, spec: false },
        { id: 'spec_only', retrieval: false, rubric: false, spec: true },
        { id: 'rubric_plus_tests', retrieval: false, rubric: true, spec: false },
        { id: 'spec_plus_tests', retrieval: false, rubric: false, spec: true },
        { id: 'full_triad', retrieval: false, rubric: true, spec: true },
        { id: 'full_triad_plus_promoted', retrieval: true, rubric: true, spec: true },
    ];

    const results: AblationResult[] = [];
    for (const condition of conditions) {
        const score = await this.runUnderCondition(
        manifests.candidate,
        issueStream,
        condition
        );
        results.push({ condition: condition.id, score, sampleSize: issueStream.size });
    }

    return {
        reportId: `ablation_${Date.now()}`,
        repo: this.repo,
        generatedAt: new Date().toISOString(),
        conditions: results,
        // Key metric: does full_triad_plus_promoted beat baseline?
        // If not, RSI claim is not supported
        overallGain: results.find(r => r.condition === 'full_triad_plus_promoted')!.score -
                    results.find(r => r.condition === 'baseline_no_retrieval')!.score,
    };
    }
}
```

Primary metrics tracked per repo (not globally):

```typescript
export interface RepoMetrics {
    repo: string;
    period: { from: string; to: string };

    // Core SWE metrics
    issueResolutionRate: number;
    triадCompositeScore: number;
    timeToFirstCorrectPatch: number;   // seconds

    // Continual learning metrics (SWE-Bench-CL inspired)
    forwardTransfer: number;   // does learning on task A help task B?
    backwardTransfer: number;  // does learning on task B hurt task A?
    forgetting: number;        // degradation of earlier promoted artifacts

    // Promotion quality metrics
    promotionPrecision: number;         // non-regressive promotions / total
    knowledgeUtility: number;           // runs where retrieval helped / total
    verifierComplementarity: number;    // tasks where rubric/spec changed ranking

    // Safety metrics
    rewardHackingDetected: number;
    evaluatorCaptureDetected: number;
    specVacuityRate: number;

    // Cost metrics
    toolCostPerResolvedIssue: number;
    tokenCostPerRun: number;
}
```

---

## 14. Agent Definitions

### agents/rubric-author.md

```markdown
---
name: rubric-author
description: >
    Author a repository-grounded rubric for an issue BEFORE any patch
    is generated. Takes only the issue, repo structure, and promoted
    rubric artifacts (not patches). Produces rubric artifact with
    symbol anchors on all criteria.
tools: [Read, Glob, Grep]
allowedArtifactKinds: [rubric]
mustRunBeforePatcher: true
---

## Instructions

1. Read the issue description and extract the described failure mode in
    precise technical terms.
2. Explore the repository: identify the modules, functions, and types
    most likely involved. List them as candidate anchoredSymbols.
3. Retrieve at most 2 prior rubric artifacts from promoted knowledge
    for this repo. Use them for style reference ONLY — do not copy criteria.
4. Author a rubric with 5-7 criteria using the schema below.
5. EVERY criterion must have at least one anchoredSymbol entry.
6. Mark authored_before_patch: true.
7. Output as YAML matching the rubric artifact schema.

## Hard rules

- Do NOT read any patch diff or candidate artifact before authoring.
- Do NOT generate test code.
- Criteria must be evaluable from a diff + repo context alone.
- If a criterion cannot be tied to a specific symbol, drop it.
```

### agents/spec-author.md

```markdown
---
name: spec-author
description: >
    Generate executable behavioral spec stubs for functions touched by
    a patch diff. Scope is narrow: API boundaries, stateful workflows,
    auth/permission, financial computation, serialization.
tools: [Read, Glob]
allowedArtifactKinds: [behavior_spec, property_generator]
---

## Instructions

1. Receive the patch diff and the set of changed function signatures.
2. For each changed function that matches the narrow scope criteria:
    a. Generate a Python spec file with pre/post/invariants/forbidden.
    b. Derive conditions from the function signature and issue description.
    c. Mark any condition you cannot determine with # TODO: human review.
    d. Populate anchoredSymbols with the exact qualified function name.
3. If a function's spec cannot be made non-vacuous, skip it and note why.
4. Output one spec file per function as separate behavior_spec artifacts.

## Narrow scope criteria

Generate specs ONLY for functions where:
- The function is a public API entry point
- The function manages state transitions
- The function makes auth or permission decisions
- The function performs financial or numeric computation
- The function serializes or deserializes data
- The issue description explicitly references this function's contract

Do NOT generate specs for:
- Internal utility functions
- Test helpers
- UI rendering functions
- Pure string formatting functions
```

### agents/promoter.md

```markdown
---
name: promoter
description: >
    Evaluate candidate artifacts against the promotion gate and write
    ledger decisions. The only agent permitted to write to promoted/.
tools: [Read]
allowedArtifactKinds: [promotion_decision]
canWritePromotedArtifacts: true
---

## Instructions

1. Receive a list of candidate artifact IDs and the evaluation results
    from the continual eval runner.
2. For each candidate, load the full evidence from its supporting runs.
3. Apply the promotion decision table:

    | Condition | Decision |
    |---|---|
    | Positive triad gain, no regression, calibration passed | promote |
    | Positive gain but high variance or weak sample | quarantine |
    | Gain only on execution tests, rubric+spec flat | quarantine |
    | Any severe regression | reject |
    | Degrades held-out set post-prior-promotion | sunset |

4. Write a ledger entry with full evidence and reasons.
5. Only then write to promoted/ via ArtifactStore.promoteArtifact().
6. Never self-approve: if the promoter agent itself authored the
    candidate (same run context), escalate to manual review.
```

---

## 15. Claude Code Plugin Extension

### .claude-plugin/plugin.json additions

```json
{
    "name": "slice-tournament-zoo",
    "version": "2.0.0",
    "description": "Bounded RSI harness with typed artifact system, verifier triad, and promotion ledger",
    "agents": [
    {
        "name": "rubric-author",
        "path": "agents/rubric-author.md",
        "when": "before_patch_generation"
    },
    {
        "name": "rubric-judge",
        "path": "agents/rubric-judge.md",
        "when": "after_patch_generation"
    },
    {
        "name": "spec-author",
        "path": "agents/spec-author.md",
        "when": "after_patch_generation"
    },
    {
        "name": "spec-verifier",
        "path": "agents/spec-verifier.md",
        "when": "after_spec_generation"
    },
    {
        "name": "promoter",
        "path": "agents/promoter.md",
        "when": "on_demand"
    },
    {
        "name": "trace-analyst",
        "path": "agents/trace-analyst.md",
        "when": "after_tournament"
    }
    ],
    "commands": [
    {
        "name": "stz:promote",
        "path": "commands/promote.md",
        "description": "Evaluate and promote candidate artifacts from the last N runs"
    },
    {
        "name": "stz:ablate",
        "path": "commands/ablate.md",
        "description": "Run ablation suite on current vs baseline manifest"
    },
    {
        "name": "stz:report",
        "path": "commands/report.md",
        "description": "Generate continual metrics report for a repo"
    },
    {
        "name": "stz:lineage",
        "path": "commands/lineage.md",
        "description": "Show DGM-style lineage tree for a promoted artifact"
    }
    ],
    "hooks": {
    "PreToolUse": "hooks/write-guard-hook.ts",
    "PostToolUse": "hooks/trace-recorder-hook.ts",
    "Stop": "hooks/run-summary-hook.ts"
    }
}
```

---

## 16. Per-Project Config Schema

```yaml
# repos/<project-id>/.stz/config.yaml

project:
    id: project-x
    mode: bounded-rsi
    defaultManifest: manifest.project-x.v1

features:
    rubricVerifier: true
    specVerifier: true
    selectiveRetrieval: true
    traceAnalysis: true
    memoryEvolution: false      # enable after Phase 5
    sourceRewriteEnabled: false # enable manually in Phase 6 only

promotion:
    minSampleSize: 8
    requiredPositiveDelta: 0.03
    maxSevereRegressions: 0
    maxMinorRegressions: 1
    maxCostExplosionRatio: 0.15
    requireNonTestVerifierGain: true  # prevents test-sharpening promotions

retrieval:
    enabled: true
    trigger: per_step
    maxItemsPerStep: 3
    allowRepoNotes: false     # CTIM-Rover safety default
    requireExplanation: true

verifiers:
    execution:
    enabled: true
    testPoolWeights:
        baseline: 0.50
        candidateGenerated: 0.10
        regression: 0.25
        calibrationHeldOut: 0.15
    rubric:
    enabled: true
    requireAuthoredBeforePatch: true
    requireSymbolAnchors: true
    spec:
    enabled: true
    narrowScopeOnly: true
    requireNonVacuous: true

triad:
    weights:
    execution: 0.50
    rubric: 0.30
    spec: 0.20

eval:
    issueStream:
    split:
        trainingLike: 0.60
        promotionHoldout: 0.25
        finalReportHoldout: 0.15
    chronologicalOnly: true   # never shuffle
    ablations:
    - baseline_no_retrieval
    - retrieval_only
    - rubric_only
    - spec_only
    - full_triad
    - full_triad_plus_promoted

memory:
    activeVariant: esrm.symbol-anchored.v1
    evolutionSchedule: manual   # 'automatic' after Phase 6 validation
    paretoObjectives:
    - task_success
    - token_cost
    - latency

rewrite:
    allowHighSeverity: false
    minEvidenceRuns: 5
    requireHumanApproval: true
```

---

## 17. Implementation Phases and Milestones

### Phase 0 — Write Guard and Manifest Emission
**Duration: Week 1, Days 1-3**
**Risk: Low**

Files to create/modify:
- MODIFY `src/bridge.ts` — add WriteGuard class
- MODIFY `src/harness.ts` — add emitRunManifest()
- MODIFY `src/state.ts` — add manifest tracking fields
- CREATE `src/artifacts/artifact-types.ts`
- CREATE `src/artifacts/artifact-store.ts` (candidate write only)
- CREATE `src/ledger/ledger-writer.ts` (shell — append only)
- CREATE `repos/<project>/.stz/` directory structure

Tests to write:
- WriteGuard blocks forbidden paths
- WriteGuard blocks candidate_patcher writing to promoted/
- Manifest emitted on every run start
- ArtifactStore.writeCandidate() rejects missing symbol anchors for rubric

Exit criteria:
- All existing STZ commands still pass
- WriteGuard throws on any attempt to mutate CLAUDE.md directly
- Every run produces a manifest JSON in .stz/manifests/

### Phase 1 — Typed Primitives and Manifest Composition
**Duration: Week 1, Days 4-5**
**Risk: Low**

Files to create:
- CREATE `src/primitives/primitive-types.ts`
- CREATE `src/primitives/primitive-registry.ts`
- CREATE `src/primitives/manifest-emitter.ts`

Deliverable: every run represents its configuration as a typed manifest.
Primitive substitution works without code changes.

### Phase 2 — Rubric Author and Rubric Judge
**Duration: Week 2**
**Risk: Low-Medium**

Files to create/modify:
- CREATE `agents/rubric-author.md`
- CREATE `agents/rubric-judge.md`
- CREATE `src/verifiers/rubric-verifier.ts`
- MODIFY `src/eval-runner.ts` — invoke rubric-author before patch loop
- MODIFY `src/selection.ts` — add rubric score to reranking

Key implementation constraint: rubric-author MUST run before any
candidate patch is generated. The orchestrator must enforce this
ordering at the harness level, not just by convention.

Ordering enforcement in `src/harness.ts`:

```typescript
async function runIssueLoop(issue: IssueContext, config: ProjectConfig) {
    // Step 1: Rubric authored before ANY patch generation
    const rubric = await spawnAgent('rubric-author', {
    issue,
    config,
    // NOTE: no patch context provided — rubric-author cannot see patches
    });
    assertRubricAuthoredBeforePatch(rubric);

    // Step 2: Retrieve relevant artifacts
    const retrieved = await retriever.retrieve({
    repo: config.projectId,
    issue: issue.description,
    sliceObjective: issue.primaryObjective,
    requestedKinds: ['behavior_spec', 'search_heuristic'],
    callerRole: 'planner',
    stepId: `step_${Date.now()}`,
    });

    // Step 3: Generate candidates (with rubric available but not patches)
    const candidates = await Promise.all(
    range(config.genes.candidateBranches).map(i =>
        spawnAgent('candidate_patcher', {
        issue,
        rubric,     // rubric injected — not other candidates' patches
        retrieved,
        config,
        })
    )
    );

    // Step 4: Spec author generates specs from patch diffs
    const specs = await Promise.all(
    candidates.map(c =>
        spawnAgent('spec-author', { issue, patch: c.patch, config })
    )
    );

    // Step 5: Triad verification
    const scores = await triadScorer.scoreAll(candidates, rubric, specs);

    // Step 6: Rerank and select
    const winner = selector.selectWinner(candidates, scores);

    // Step 7: Record trace for ABSTRAL analysis
    await traceRecorder.record({ issue, candidates, scores, winner });

    // Step 8: Propose candidate learnings (NOT auto-promoted)
    await proposeLearnings(winner, rubric, specs, scores);

    return winner;
}
```

Exit criteria:
- Rubric artifact created before any patch on each issue
- Rubric score appears in candidate reranking
- At least one issue where rubric score changes winner vs tests-only

### Phase 3 — Spec-Harness-Lite
**Duration: Week 3**
**Risk: Medium**

Files to create:
- CREATE `agents/spec-author.md`
- CREATE `src/verifiers/spec-verifier.ts`
- CREATE `src/verifiers/triad-scorer.ts`
- MODIFY `src/verifiers/execution-verifier.ts` (extend existing eval-runner)
- MODIFY `src/selection.ts` — use triad composite for final ranking

Exit criteria:
- Every candidate receives a triad score
- Spec vacuity detection works (flags unchecked TODO specs as low-confidence)
- Hard fail triggers cause immediate rejection before ledger entry

### Phase 4 — Selective Retrieval
**Duration: Week 4, Days 1-3**
**Risk: Medium**

Files to create/modify:
- CREATE `src/knowledge/knowledge-tiers.ts`
- CREATE `src/knowledge/retrieval-policy.ts`
- CREATE `src/knowledge/retrieval-explainer.ts`
- CREATE `src/artifacts/artifact-index.ts`
- MODIFY `src/injector.ts` — replace bulk injection with SelectiveRetriever

The critical change: remove any code path that appends raw promoted
content to prompt context en masse. Every retrieved item must go
through the per-step retrieval gate with explanation.

Exit criteria:
- No bulk memory dump in any prompt
- Every retrieved item has a logged explanation
- Ablation flag `retrieval: false` fully disables retrieval
- Per-step retrieval verified in integration test

### Phase 5 — Promotion Ledger and Continual Eval
**Duration: Week 4-5**
**Risk: Medium**

Files to create:
- CREATE `src/ledger/promotion-engine.ts`
- CREATE `src/ledger/ledger-reader.ts`
- CREATE `src/ledger/lineage-tracker.ts`
- CREATE `src/eval/chronological-stream.ts`
- CREATE `src/eval/calibration-set.ts`
- CREATE `src/eval/ablation-runner.ts`
- CREATE `src/eval/metrics-reporter.ts`
- CREATE `commands/promote.md`
- CREATE `commands/ablate.md`
- CREATE `commands/report.md`

Exit criteria:
- Every promotion attempt writes a ledger entry
- Test-only wins are quarantined, not promoted
- Ablation report shows full_triad vs baseline comparison
- At least one repo with chronological issue stream configured

### Phase 6 — Safe Gene Evolution
**Duration: Week 6-8**
**Risk: Medium-High (for gene evolution itself)**

Evolvable genes (in order of decreasing safety):

Tier A — evolve first (low blast radius):
1. `candidateBranches` — integer 2-6
2. `retrievalTopK` — integer 1-5 per kind
3. `rerankingThreshold` — float 0.3-0.9
4. `heuristicOrdering` — enum

Tier B — evolve second (medium blast radius):
5. `sliceGranularity` — enum
6. `requestBehaviorSpec` — boolean
7. `triadWeights` — float triplet summing to 1.0

Tier C — evolve third (requires promotion evidence):
8. `plannerPromptVariant` — string id
9. `rubricAuthorPromptVariant` — string id
10. `specAuthorPromptVariant` — string id

Tier D — never auto-evolved:
- `promotionThresholds`
- `defaultKnowledgeLoadingPolicy`
- `orchestratorLogic`
- Any write-guard configuration

Gene evolution mechanism: ContrastiveTraceAnalyser proposes gene
adjustments as topology_proposal artifacts. These go through the
standard promotion gate before affecting any default manifest.

Files to create:
- CREATE `src/traces/trace-recorder.ts`
- CREATE `src/traces/trace-analyser.ts`
- CREATE `src/traces/topology-proposer.ts`
- CREATE `agents/trace-analyst.md`
- CREATE `commands/lineage.md`

Exit criteria:
- Trace analysis produces topology proposals after each tournament
- At least one gene adjustment promoted with supporting evidence
- Promoted gene change demonstrably improves calibration set score
- Lineage command shows DGM-style tree for any promoted artifact

### Phase 7 — MemEvolve Bilevel Loop
**Duration: Week 9-10**
**Risk: High (evolving the retrieval architecture itself)**
**Prerequisite: Phase 5 promotion ledger must show stable operation**

Files to create:
- CREATE `src/memory/memory-primitive.ts`
- CREATE `src/memory/memory-evolver.ts`
- CREATE `src/memory/memory-pareto.ts`
- CREATE `agents/memory-evolver.md`

Gate: `memoryEvolution: false` in config by default. Enable only after
5+ successful stable promotions in Phase 5-6.

Exit criteria:
- Inner loop successfully distils trajectories to symbol-anchored principles
- Outer loop identifies Pareto-optimal memory variants
- At least one memory_architecture artifact promoted with Pareto evidence

### Phase 8 — MOSS Source Rewrite (Optional)
**Duration: Week 12+**
**Risk: Highest — gated behind human approval and explicit config**

Only proceed if:
- 10+ issues resolved with positive triad gain
- Specific structural failure class identified (not just poor prompts)
- Human engineer reviews and approves each rewrite proposal

Files to create:
- CREATE `src/rewrite/failure-anchor.ts`
- CREATE `src/rewrite/rewrite-proposer.ts`
- CREATE `src/rewrite/rewrite-gate.ts`
- CREATE `agents/rewrite-proposer.md`

---

## 18. Failure Mode Mitigations

| Failure mode | Detection | Mitigation |
|---|---|---|
| Evaluator capture | hack-detector.ts extended: patcher run ID == rubric run ID | Agent role separation enforced at spawn; rubric-author has no patch context |
| Spec vacuity | spec-verifier counts TODO markers and uncheckable conditions | Vacuous specs scored 0.0; >50% vacuous = hard fail |
| Regression masking | Candidate-generated tests capped at 10% weight in test pool | Calibration held-out tests required for promotion |
| Retrieval poisoning | Retrieval logs audited; weak notes excluded by default | repo_note kind disabled by default; allowRepoNotes=false |
| Primitive drift | All gene changes go through promotion gate | Tier D genes non-evolvable; tier A-C require ledger evidence |
| Promotion inflation | RequiredPositiveDelta + requireNonTestVerifierGain | Test-only wins are quarantined automatically |
| Benchmark illusion | Per-repo metrics, not global; chronological splits only | External benchmarks marked secondary; internal stream is truth |
| Symbol unfaithfulness | Symbol anchor required on rubric/spec/property artifacts | ArtifactStore rejects unanchored items for those kinds |
| Self-approval loop | Promoter cannot promote its own candidate-run artifacts | Run ID comparison in promotion engine; escalate to manual |
| Memory noise | Per-step retrieval with cap; no bulk dump | injector.ts bulk path deleted; SelectiveRetriever only |

---

## 19. 30-Day Execution Timeline

### Week 1 — Foundation

| Day | Task | File | Output |
|---|---|---|---|
| 1 | WriteGuard implementation | src/bridge.ts | Forbidden write paths blocked |
| 1 | Manifest emission | src/harness.ts | Run manifests in .stz/manifests/ |
| 2 | Artifact type system | src/artifacts/artifact-types.ts | Full type definitions |
| 2 | ArtifactStore candidate write | src/artifacts/artifact-store.ts | Candidate path only |
| 3 | Ledger shell | src/ledger/ledger-writer.ts | Append-only JSONL |
| 3 | Repo directory structure | repos/<project>/.stz/ | Config + dirs |
| 4 | Primitive type interfaces | src/primitives/primitive-types.ts | HarnessPrimitive<T> |
| 4 | Primitive registry | src/primitives/primitive-registry.ts | Active primitive lookup |
| 5 | Integration test: write guard | test/ | WriteGuard blocks confirmed |
| 5 | Integration test: manifest emit | test/ | Manifest round-trip |

### Week 2 — Rubric Author + Judge

| Day | Task | File | Output |
|---|---|---|---|
| 6 | rubric-author agent definition | agents/rubric-author.md | Agent prompt + constraints |
| 6 | Rubric artifact schema | src/artifacts/artifact-types.ts | Rubric YAML schema |
| 7 | rubric-judge agent definition | agents/rubric-judge.md | Agent prompt |
| 7 | Rubric verifier implementation | src/verifiers/rubric-verifier.ts | Scoring logic |
| 8 | Orchestrator ordering enforcement | src/harness.ts | rubric before patch |
| 8 | Reranking with rubric score | src/selection.ts | Combined test+rubric rank |
| 9 | Symbol anchor validation | src/artifacts/artifact-validator.ts | Reject unanchored |
| 9 | End-to-end rubric test | test/ | One issue with rubric score |
| 10 | Rubric vs tests-only comparison | experiments/ | Score differential recorded |

### Week 3 — Spec Verifier + Triad

| Day | Task | File | Output |
|---|---|---|---|
| 11 | spec-author agent definition | agents/spec-author.md | Narrow scope spec generation |
| 11 | Behavior spec schema | src/artifacts/artifact-types.ts | Python spec format |
| 12 | Spec verifier runner | src/verifiers/spec-verifier.ts | Execute pre/post/invariants |
| 12 | Spec vacuity detection | src/verifiers/spec-verifier.ts | TODO marker counting |
| 13 | Triad scorer | src/verifiers/triad-scorer.ts | Composite score |
| 13 | Hard fail triggers | src/verifiers/triad-scorer.ts | Immediate rejection paths |
| 14 | Triad integration | src/selection.ts | Triad reranking live |
| 14 | Run mode selection | src/harness.ts | test_first/spec_first/mixed |
| 15 | Full triad integration test | test/ | All three verifiers exercised |

### Week 4 — Retrieval + Promotion

| Day | Task | File | Output |
|---|---|---|---|
| 16 | Knowledge tier definitions | src/knowledge/knowledge-tiers.ts | Tier access policy |
| 16 | Artifact index (FAISS/BM25) | src/artifacts/artifact-index.ts | Symbol+text search |
| 17 | SelectiveRetriever | src/knowledge/retrieval-policy.ts | Per-step retrieval |
| 17 | Retrieval explainer | src/knowledge/retrieval-explainer.ts | Logged explanations |
| 18 | Replace bulk injector | src/injector.ts | Bulk path deleted |
| 18 | Retrieval ablation flag | src/harness.ts | retrieval:false disables fully |
| 19 | Promotion engine | src/ledger/promotion-engine.ts | Decision logic |
| 19 | ArtifactStore promote path | src/artifacts/artifact-store.ts | promoted/ write |
| 20 | Promotion integration test | test/ | Test-only win quarantined |

### Day 21-30 — Eval Plane + First Milestone Report

| Day | Task | File | Output |
|---|---|---|---|
| 21 | Chronological issue stream | src/eval/chronological-stream.ts | Split configuration |
| 22 | Calibration set management | src/eval/calibration-set.ts | Held-out issues locked |
| 23 | Ablation runner | src/eval/ablation-runner.ts | 8 conditions |
| 24 | Metrics reporter | src/eval/metrics-reporter.ts | RepoMetrics output |
| 25 | /stz:promote command | commands/promote.md | Runnable from Claude Code |
| 25 | /stz:ablate command | commands/ablate.md | Ablation on demand |
| 26 | /stz:report command | commands/report.md | Metrics report |
| 27 | First repo onboarded | repos/<project>/ | Config + issue stream |
| 28 | First promotion attempt | ledger/promotions.jsonl | Ledger entry |
| 29 | Ablation report generated | eval/reports/ | full_triad vs baseline |
| 30 | Milestone 1 review | docs/ | Bounded RSI evidence or null |

---

## 20. Milestone 1 Success Criterion

At day 30, the following must all be true for the bounded RSI claim
to be supportable:

1. At least one repo has a chronological issue stream with ≥8 held-out
    issues evaluated
2. Ablation report shows `full_triad` composite score > `baseline_no_retrieval`
    by ≥3 percentage points
3. At least one artifact promoted with rubric or spec verifier gain
    (not test-execution gain alone)
4. No promoted artifact has caused a severe regression on the
    calibration set
5. Promotion ledger has ≥1 quarantine decision from test-only win
    detection (confirms the mechanism works)
6. WriteGuard has thrown at least once in a live run (confirms guard active)

If any criterion fails, the corresponding phase is incomplete.
Null results are acceptable and stop the experiment safely — the
existing harness remains functional and no state is corrupted.

---

## 21. 90-Day Extended Criteria

By day 90, the full bounded RSI claim requires:

- 2-3 repos onboarded with independent issue streams
- Promotion ledger populated with accept/reject/quarantine/sunset examples
- At least one sunset decision from negative evidence (confirms feedback loop)
- Forward transfer: learnings from repo A demonstrably help repo B on
    shared problem classes (requires cross-repo promotion experiment)
- Retrieval utility: ≥60% of retrieval-enabled runs show positive rank change
- Verifier complementarity: ≥30% of tasks where rubric/spec changes ranking
    vs tests alone
- MemEvolve phase validated: at least one memory architecture variant promoted
- Cost stability: tool cost per resolved issue not increasing despite richer pipeline
- Gene evolution: at least one Tier A gene adjusted via topology proposal with
    supporting ablation evidence