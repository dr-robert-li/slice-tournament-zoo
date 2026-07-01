<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# If you were to create a plugin harness on top of Claude Code that is designed to implement elements of RSI bounded within projects, i.e. allow for bounded experimentation by sub-agents which feeds into persisted learnings to improve a project's outcome, explore edge use cases, test novel implementations and validate correctness when measured against norms of well architected software, that is based on frontier research on agents, agent architectures and recursive self improvement, what would this look like?

Search exhaustively for research papers, meta analyses, and experiments conducted by researchers

[https://github.com/dr-robert-li/slice-tournament-zoo](https://github.com/dr-robert-li/slice-tournament-zoo) - I've created this harness but I don't think it's the right approach as I cannot get it to improve outputs beyond sharpening testing.

Can be spec or test driven development

Here's the full report — it's dense, so let me orient you to the key findings.

## The Core Diagnosis of STZ's Ceiling

Your own PAPER.md nail it: the `harness-mine` mechanism genuinely works and the 0.9.5 calibrated-verifier gate correctly prevents degradation. But the ceiling you hit is structural, not an implementation bug. For harness suite-sharpening to produce *better code* (not just sharper tests), three properties must co-occur: the discovered bug class must have a large correctness axis, be split across the blind pool, and be invisible to a good-faith suite simultaneously. The research confirms they rarely do.

## The Four Missing/Underbuilt Components

Based on the frontier research (DGM, HarnessX, VeriAct, Agentic Rubrics, CTIM-Rover, SWE-Bench-CL), here's what changes the trajectory:

**1. Exogenous formal spec as correctness ground** — STZ currently gates everything on the sealed test suite, which is itself derived from the same model-authored loop. VeriAct demonstrates that a Spec-Harness layer (EARS-format requirements → symbolic verification, not just test execution) supplies the genuinely exogenous signal. Amazon Kiro's EARS notation (`WHEN x, the system SHALL y`) is already transformable to property tests and formal inputs — a spec-synthesis sub-agent with Spec-Harness gating is the single highest-leverage addition.[^1_1][^1_2][^1_3][^1_4][^1_5]

**2. A knowledge tier semantically distinct from memory** — CTIM-Rover (TU Munich 2025) found that injecting episodic memory wholesale *degraded* performance — a single word in a memory item was enough to steer the agent to the wrong function. SWE-Bench-CL's FAISS-backed retrieval-at-every-turn (not upfront injection) is the correct pattern. The report proposes a four-tier architecture (Knowledge / Memory / Wisdom / Intelligence) where the Knowledge tier is version-controlled in CLAUDE.md, promoted only through spec-harness verification, and never writable by sub-agents.[^1_6][^1_7][^1_8][^1_9]

**3. Rubric-author sub-agent before every tournament** — Agentic Rubrics (ICLR 2026) shows a +3.5% gain on SWE-Bench Verified by having an isolated sub-agent explore the repo and generate rubric.yaml *before* any implementation sub-agent sees the task. This rubric also serves as the calibration battery for the judge — exactly the mechanism STZ 0.9.5 needs but doesn't yet supply automatically.[^1_10][^1_11]

**4. G7 spec-crystallization gene** — HarnessX validates harness-altitude evolution (+14.5% avg, up to +44%) and finds the weakest models improve most. Adding spec-crystallization heuristics as an evolvable gene (alongside the existing G1–G6) gives the meta-loop an improvement axis that isn't derived from the test suite itself.[^1_12][^1_13]

## The Door A Path Remains Correct

Your ROADMAP's pre-registered post-merge grounding experiment is the right long-horizon bet — real PR-acceptance and downstream regression labels are the only genuinely exogenous SDLC signal. The report's architecture gates this through the existing calibration mechanism before it may steer any promotion, so a null result safely stops the experiment without touching the working harness.
<span style="display:none">[^1_100][^1_101][^1_102][^1_103][^1_104][^1_105][^1_106][^1_107][^1_108][^1_109][^1_110][^1_111][^1_112][^1_113][^1_114][^1_115][^1_116][^1_117][^1_14][^1_15][^1_16][^1_17][^1_18][^1_19][^1_20][^1_21][^1_22][^1_23][^1_24][^1_25][^1_26][^1_27][^1_28][^1_29][^1_30][^1_31][^1_32][^1_33][^1_34][^1_35][^1_36][^1_37][^1_38][^1_39][^1_40][^1_41][^1_42][^1_43][^1_44][^1_45][^1_46][^1_47][^1_48][^1_49][^1_50][^1_51][^1_52][^1_53][^1_54][^1_55][^1_56][^1_57][^1_58][^1_59][^1_60][^1_61][^1_62][^1_63][^1_64][^1_65][^1_66][^1_67][^1_68][^1_69][^1_70][^1_71][^1_72][^1_73][^1_74][^1_75][^1_76][^1_77][^1_78][^1_79][^1_80][^1_81][^1_82][^1_83][^1_84][^1_85][^1_86][^1_87][^1_88][^1_89][^1_90][^1_91][^1_92][^1_93][^1_94][^1_95][^1_96][^1_97][^1_98][^1_99]</span>

<div align="center">⁂</div>

[^1_1]: https://arxiv.org/html/2505.23422v1

[^1_2]: https://slashpage.com/haebom/943zqpmqr5j7q2wnvy87

[^1_3]: https://arxiv.org/abs/2507.00014

[^1_4]: https://chatpaper.com/fr/chatpaper/paper/157194

[^1_5]: https://github.com/thomasjoshi/agents-never-forget/

[^1_6]: https://arxiv.org/abs/2606.14629

[^1_7]: https://arxiv.org/html/2606.14629v1

[^1_8]: https://arxiv.org/abs/2604.00280

[^1_9]: https://arxiv.org/pdf/2604.00280.pdf

[^1_10]: https://bretthamlin.com/briefing/2026-01/2026-01-09-spec-driven-development-agentic-coding-at-faang-sc/

[^1_11]: https://harrisonaix.com/kiro-review/

[^1_12]: https://www.developersdigest.tech/blog/aws-kiro-developer-guide-2026

[^1_13]: https://kiro.dev

[^1_14]: https://agentmarketcap.ai/blog/2026/04/11/amazon-kiro-ai-ide-aws-2026

[^1_15]: https://www.bitslovers.com/kiro-ai-ide-guide/

[^1_16]: https://noqta.tn/en/blog/kiro-aws-agentic-ide-spec-driven-development-guide-2026

[^1_17]: https://ascii.co.uk/news/article/news-20260302-4a758260/vsdd-unified-ai-orchestrated-development-merging-spec-test-v

[^1_18]: https://arxiv.org/abs/2605.27485

[^1_19]: https://web3.arxiv.org/pdf/2601.04171

[^1_20]: https://openreview.net/forum?id=edYwO6bEJD

[^1_21]: https://arxiv.org/html/2601.04171v1

[^1_22]: https://www.alphaxiv.org/overview/2601.04171

[^1_23]: https://arxiv.org/html/2606.18168v1

[^1_24]: https://www.academia.edu/166160332/A_Critical_Anatomical_Review_of_The_Missing_Knowledge_Layer_in_Cognitive_Architectures_for_AI_Agents_by_Micha%C3%ABl_Roynard_2026_Featuring_a_Deep_Comparative_Analysis_of_Persistence_Semantics

[^1_25]: https://www.digitalapplied.com/blog/ai-agent-memory-vector-graph-episodic-2026

[^1_26]: https://huggingface.co/papers/2606.14249

[^1_27]: https://x.com/akshay_pachaar/status/2066886861235315008

[^1_28]: https://www.youtube.com/watch?v=e_R5ou-tGN4

[^1_29]: https://medium.com/@adnanmasood/the-darwin-gödel-machine-open-ended-improvement-via-recursive-code-mutation-and-empirical-fitness-a777681d73e4

[^1_30]: https://www.facebook.com/groups/aimlmalaysia/posts/2380690615664492/

[^1_31]: https://arxiv.org/abs/2511.16043

[^1_32]: https://github.com/aiming-lab/Agent0

[^1_33]: https://x.com/HuaxiuYaoML/status/1992396431416512893

[^1_34]: https://tianpan.co/blog/2026-04-09-agentic-coding-production-swebench-gap

[^1_35]: https://www.youtube.com/watch?v=uLh6AB51QzU

[^1_36]: https://www.penligent.ai/hackinglabs/inside-claude-code-the-architecture-behind-tools-memory-hooks-and-mcp/

[^1_37]: https://www.youtube.com/watch?v=aE_5oq8PQgg

[^1_38]: https://www.youtube.com/watch?v=IYBP_JT9aUo\&list=WL\&index=4

[^1_39]: https://openreview.net/pdf?id=fvL8IIEPxG

[^1_40]: https://arxiv.org/html/2604.14228

[^1_41]: https://arxiv.org/abs/2601.18827

[^1_42]: https://arxiv.org/abs/2505.22954

[^1_43]: https://arxiv.org/abs/2606.14249

[^1_44]: https://agyn.io/blog/ai-self-improvement-2026

[^1_45]: https://arxiv.org/html/2505.22954v2

[^1_46]: https://arxiv.org/html/2606.14249v1

[^1_47]: https://openreview.net/pdf?id=OsPQ6zTQXV

[^1_48]: https://sakana.ai/dgm/

[^1_49]: https://x.com/dair_ai/status/2066563390538178784

[^1_50]: https://www.anthropic.com/institute/recursive-self-improvement

[^1_51]: https://github.com/jennyzzt/dgm

[^1_52]: https://www.youtube.com/watch?v=e_R5ou-tGN4\&vl=ko

[^1_53]: https://recursive-workshop.github.io/papers.html

[^1_54]: https://arxiv.org/pdf/2505.02888.pdf

[^1_55]: https://aclanthology.org/2025.acl-long.1354.pdf

[^1_56]: https://arxiv.org/html/2407.18219v2

[^1_57]: https://iclr.cc/virtual/2026/workshop/10000796

[^1_58]: https://icml.cc/virtual/2026/poster/63667

[^1_59]: https://icrl.dev

[^1_60]: https://www.artifocial.ai/blog/rsi-workshop-2026-mar-18

[^1_61]: https://www.youtube.com/watch?v=BTzJuko474U

[^1_62]: https://www.youtube.com/watch?v=cwCOe0RFM94\&vl=fr-FR

[^1_63]: https://arxiv.org/html/2603.08640v2

[^1_64]: https://proceedings.iclr.cc/paper_files/paper/2025/file/2e3435554b430bd8fe92a60c509929a0-Paper-Conference.pdf

[^1_65]: https://aiworkshoptracker.com/workshop/iclr-2026-rsi/

[^1_66]: https://www.youtube.com/watch?v=nXo1isg_mJ4

[^1_67]: https://openreview.net/group?id=ICLR.cc%2F2026%2FWorkshop%2FRSI

[^1_68]: https://github.com/aisa-group/PostTrainBench

[^1_69]: https://www.youtube.com/watch?v=tY_CxrMdUnk

[^1_70]: https://huggingface.co/datasets/aisa-group/PostTrainBench-Trajectories

[^1_71]: https://www.swebench.com

[^1_72]: https://agentpatterns.ai/agent-design/agent-memory-patterns/

[^1_73]: https://www.softwareseni.com/coding-agent-benchmarks-do-not-tell-the-full-story/

[^1_74]: https://zylos.ai/research/2026-04-05-ai-agent-memory-architectures-persistent-knowledge/

[^1_75]: https://arxiv.org/html/2507.00014v1

[^1_76]: https://arxiv.org/html/2604.26275v1

[^1_77]: https://agentmarketcap.ai/blog/2026/04/09/swe-bench-verified-progress-timeline-2023-2026

[^1_78]: https://proceedings.neurips.cc/paper_files/paper/2025/hash/21bec6ace947b1b58967b945c8ac0f10-Abstract-Datasets_and_Benchmarks_Track.html

[^1_79]: https://arxiv.org/html/2509.16941v1

[^1_80]: https://zylos.ai/zh/research/2026-03-25-ai-agent-evaluation-stack-2026-beyond-swe-bench

[^1_81]: https://scale.com/blog/swe-bench-pro

[^1_82]: https://openreview.net/pdf/80c9d255234f96fafdf293e1a5184150ec8045d3.pdf

[^1_83]: https://arxiv.org/pdf/2606.14629.pdf

[^1_84]: https://arxiv.org/html/2604.00280v1

[^1_85]: https://arxiv.org/pdf/2605.26457.pdf

[^1_86]: https://aclanthology.org/2025.realm-1.30.pdf

[^1_87]: https://www.emergentmind.com/topics/swe-bench-verified-47773414-8319-4e96-b867-a5a13ef278a7

[^1_88]: https://freeacademy.ai/lessons/verifying-output-against-the-spec

[^1_89]: https://arxiv.org/html/2602.00180v1

[^1_90]: https://arxiv.org/html/2603.17150v1

[^1_91]: https://code.claude.com/docs/en/sub-agents

[^1_92]: https://www.instagram.com/p/DXt7R9WDptx/?hl=en

[^1_93]: https://ofox.ai/blog/claude-code-hooks-subagents-skills-complete-guide-2026/

[^1_94]: https://x.com/ComputerPapers/status/2039750336022229359

[^1_95]: https://www.rivista.ai/wp-content/uploads/2026/04/2604.14228v1.pdf

[^1_96]: https://arxiv.org/pdf/2511.16043.pdf

[^1_97]: https://aclanthology.org/2026.findings-acl.908.pdf

[^1_98]: https://www.arxiv.org/pdf/2511.19900.pdf

[^1_99]: https://www.scitepress.org/Papers/2026/146404/146404.pdf

[^1_100]: https://www.youtube.com/watch?v=8Er1oWnzZWw

[^1_101]: https://www.semanticscholar.org/paper/Agent0:-Unleashing-Self-Evolving-Agents-from-Zero-Xia-Xia/a647788b47b1bac9c137ab192316f72de52471d4

[^1_102]: https://www.augmentcode.com/tools/intent-vs-kiro

[^1_103]: https://arxiv.org/html/2510.05156v1

[^1_104]: https://arxiv.org/html/2511.17330v3

[^1_105]: https://codemyspec.com/blog/kiro-specs-explained

[^1_106]: https://www.youtube.com/watch?v=aedvq7jwMrs

[^1_107]: https://www.youtube.com/watch?v=HY_JyxAZsiE

[^1_108]: https://de.slideshare.net/slideshow/spec-driven-development-with-ai-building-future-ready-software-using-kiro-ide/287908914

[^1_109]: https://arxiv.org/pdf/2603.01896.pdf

[^1_110]: https://codex.danielvaughan.com/2026/06/18/harnessx-composable-evolvable-agent-harness-foundry-codex-cli-configuration-evolution-patterns/

[^1_111]: https://arxiv.org/html/2604.10800

[^1_112]: https://arxiv.org/abs/2510.12303

[^1_113]: https://arxiv.org/html/2510.22075v1

[^1_114]: https://arxiv.org/abs/1608.08546

[^1_115]: https://futureagi.com/blog/evaluating-coding-agents-2026/

[^1_116]: https://www.youtube.com/watch?v=IjWmF2xAnxY

[^1_117]: https://hyper.ai/en/papers/2606.14249/pdf


---

# Validate each of these recommendations, have these been tested and shown they materially improve output

Here's an honest validation of each recommendation, split by what is empirically supported, what is theoretically grounded but untested in context, and what carries known caveats.

***

## Recommendation Validation

### 1. Exogenous Formal Spec (VeriAct / EARS / Spec-Harness)

**Status: Empirically supported — with an important caveat on spec quality itself**

VeriAct does outperform both prompt-based and prompt-optimised baselines on two benchmark datasets for JML specification synthesis. The core diagnostic finding is confirmed: verification pass rate alone is misleading — a large fraction of verifier-accepted specs are incorrect or incomplete in ways invisible to the verifier. However, the independent CodeSpecBench evaluation (April 2026, 15 LLMs) found that the *best model achieves only 20.2% pass rate on repository-level spec generation tasks*, and that "specification generation is substantially more challenging than code generation". Verus-SpecGym (May 2026) confirms this at 51–78% for frontier models on function-level tasks, but also found that LLM-as-judge evaluation misses 26% of failures their deterministic evaluator catches. **Honest verdict:** the principle is validated; the implementation difficulty is higher than the report presented. You'd need a deterministic spec evaluator (not an LLM judge) and the failure modes on repository-level tasks are significant.[^2_1][^2_2][^2_3][^2_4]

***

### 2. Calibrated Contextual Verifier (Agentic Rubrics + arXiv:2606.14629)

**Status: Empirically confirmed on the benchmark, but benchmark itself is now contested**

Agentic Rubrics achieved +3.5 percentage points over the strongest baseline on SWE-Bench Verified. The calibration finding (verifiers that are above-threshold on one task become degradation engines on another) is a real documented effect. However, OpenAI retired SWE-Bench Verified in February 2026 precisely because at least 59.4% of audited problems have flawed test cases, and performance gains are partially driven by memorisation. The benchmark is contaminated enough that +3.5pp is hard to interpret as a genuine capability signal. **Honest verdict:** the rubric methodology is sound and the calibration gate logic is correct, but the magnitude of the improvement claim should be treated as unverified pending replication on contamination-controlled benchmarks like SWE-bench Pro.[^2_5][^2_6][^2_7][^2_8][^2_9][^2_10][^2_11]

***

### 3. CTIM-Rover / Retrieval-Gated Knowledge Injection

**Status: Empirically confirmed — but the positive prescription (retrieval fixes it) is not yet validated**

CTIM-Rover's failure is clearly demonstrated: episodic memory injection in any configuration failed to beat the AutoCodeRover baseline on SWE-bench Verified, and the paper's diagnosis is noise from distracting items causing suboptimal initial repository exploration decisions. This is a genuine negative result from a real experiment. **However,** SWE-Bench-CL's FAISS-backed retrieval module is presented as an *evaluation framework*, not a result. The paper compares memory-enabled vs. memory-disabled agents and *describes* the experimental protocol, but the benchmark was published in June 2025 and concrete results showing retrieval-gated injection *improving* performance are not yet published. The recommendation to use retrieval rather than injection is correct in principle (and consistent with CTIM-Rover's diagnosis), but the specific "FAISS at every turn fixes it" claim is not yet empirically demonstrated for software engineering tasks.[^2_12][^2_13][^2_14][^2_15][^2_16][^2_17]

***

### 4. Four-Tier Knowledge Architecture (Knowledge/Memory/Wisdom/Intelligence)

**Status: Theoretically grounded, not empirically tested as a unit**

This architecture is derived from Roynard (2026), which is a position paper, not an experimental result. The decomposition is conceptually coherent and consistent with the CTIM-Rover and SWE-Bench-CL findings, but it has not been implemented and tested as a unified system. **Honest verdict:** treat this as a useful design framework, not a validated approach.[^2_18]

***

### 5. HarnessX / Harness-Genome Evolution at Correct Altitude

**Status: Empirically confirmed, but with scope caveats**

HarnessX's +14.5% average and up to +44% gains across five benchmarks (ALFWorld, GAIA, WebShop, tau³-Bench, SWE-bench Verified) are published. The "weakest model improves most" finding is specifically reported. This is the strongest empirical validation in the set, and it directly corroborates STZ's architectural choice to put RSI at harness altitude rather than per-slice iteration. **Caveats:** (a) the HarnessX codebase is not yet open-sourced, so independent replication hasn't happened; (b) the +14.5% on SWE-bench Verified carries the same contamination caveat as above; (c) HarnessX uses harness-model co-evolution (fine-tuning the model too), which is outside the scope of a Claude Code plugin.[^2_19][^2_20][^2_21]

***

### 6. Agent0 Curriculum-Executor Co-Evolution

**Status: Empirically confirmed for reasoning, not software engineering**

Agent0's +18% on mathematical reasoning and +24% on general reasoning are confirmed (accepted ICML 2026). These are *reasoning benchmark* results, not code generation or software engineering results. The curriculum-executor pattern is the correct conceptual mapping for a spec-critic loop, but the empirical support is in a different domain. **Honest verdict:** the design pattern is motivated but the extrapolation to SDLC contexts is speculative.[^2_22][^2_23][^2_24][^2_25]

***

### 7. Post-Merge Exogenous Grounding (Door A)

**Status: Correctly pre-registered as a gated experiment — not claimed as validated**

This was presented as a gated experiment in the report, which is accurate. The SWE-bench Pro score of 23% vs. 80% on Verified and the METR 19% slowdown are both empirically verified and establish *why* an exogenous production signal matters. The intervention (using post-merge labels to steer) has not been tested.[^2_26][^2_27][^2_28][^2_29]

***

## Summary Table

| Recommendation | Empirical Support | Key Caveat |
| :-- | :-- | :-- |
| Exogenous spec (VeriAct) | ✅ Confirmed on JML benchmarks | Repo-level spec generation is hard (20% pass rate); needs deterministic evaluator |
| Calibrated verifier (Agentic Rubrics) | ✅ +3.5pp on SWE-bench Verified | SWE-bench Verified is now considered contaminated by OpenAI[^2_8] |
| Retrieval-gated injection | ✅ Negative confirmed (injection degrades)[^2_12] | Positive (retrieval fixes it) not yet experimentally validated for SE tasks |
| Four-tier knowledge architecture | ⚠️ Position paper only | No experimental data |
| Harness-genome evolution (HarnessX) | ✅ +14.5% avg across 5 benchmarks[^2_20] | Not open-sourced; includes model fine-tuning STZ cannot do |
| Agent0 curriculum co-evolution | ✅ Confirmed for reasoning tasks[^2_25] | No SE-domain experimental data |
| Post-merge grounding (Door A) | ⚠️ Gated experiment, unvalidated | Correctly positioned as pre-registered, not claimed |

The **core architectural direction is sound** — harness-altitude evolution beats per-slice iteration (confirmed by HarnessX), and closed-loop self-improvement without exogenous ground hits a ceiling (confirmed by STZ's own pilots and CTIM-Rover). The **specific implementation claims** for spec synthesis and retrieval-gated knowledge injection are the two areas where the evidence is directionally correct but less mature than the report suggested.
<span style="display:none">[^2_30][^2_31][^2_32][^2_33][^2_34][^2_35][^2_36][^2_37][^2_38][^2_39][^2_40][^2_41][^2_42][^2_43][^2_44][^2_45][^2_46][^2_47]</span>

<div align="center">⁂</div>

[^2_1]: https://arxiv.org/html/2604.00280v1

[^2_2]: https://arxiv.org/abs/2604.12268v1

[^2_3]: https://arxiv.org/abs/2604.00280

[^2_4]: https://huggingface.co/papers/2605.26457

[^2_5]: https://aclanthology.org/2026.acl-long.697.pdf

[^2_6]: https://arxiv.org/html/2601.04171

[^2_7]: https://conf.researchr.org/details/icse-2026/icse-2026-software-engineering-in-practice/29/The-SWE-Bench-Illusion-When-State-of-the-Art-LLMs-Remember-Instead-of-Reason

[^2_8]: https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/

[^2_9]: https://arxiv.org/html/2512.10218v2

[^2_10]: https://openreview.net/forum?id=edYwO6bEJD

[^2_11]: https://arxiv.org/abs/2606.14629

[^2_12]: https://arxiv.org/html/2505.23422v1

[^2_13]: https://arxiv.org/abs/2507.00014

[^2_14]: https://slashpage.com/haebom/943zqpmqr5j7q2wnvy87

[^2_15]: https://chatpaper.com/fr/chatpaper/paper/157194

[^2_16]: https://github.com/Liqs-v2/ctim-rover

[^2_17]: https://github.com/thomasjoshi/agents-never-forget/

[^2_18]: https://www.academia.edu/166160332/A_Critical_Anatomical_Review_of_The_Missing_Knowledge_Layer_in_Cognitive_Architectures_for_AI_Agents_by_Micha%C3%ABl_Roynard_2026_Featuring_a_Deep_Comparative_Analysis_of_Persistence_Semantics

[^2_19]: https://novalogiq.com/2026/06/25/xiaomis-harnessx-rewrites-its-own-ai-scaffolding-mid-task-and-smaller-models-gain-the-most/

[^2_20]: https://arxiv.org/abs/2606.14249v1

[^2_21]: https://www.youtube.com/watch?v=e_R5ou-tGN4

[^2_22]: https://arxiv.org/html/2511.16043v1

[^2_23]: https://x.com/HuaxiuYaoML/status/1992396431416512893

[^2_24]: https://www.youtube.com/watch?v=nKkmErBO2n4

[^2_25]: https://github.com/aiming-lab/Agent0

[^2_26]: https://tianpan.co/blog/2026-04-09-agentic-coding-production-swebench-gap

[^2_27]: https://particula.tech/blog/ai-coding-tools-developer-productivity-paradox

[^2_28]: https://www.actuia.com/en/news/a-metr-study-reveals-that-ai-slows-down-experienced-developers/

[^2_29]: https://sciencereader.com/ai-coding-tools-slower-developers-metr-study/

[^2_30]: https://dl.acm.org/doi/10.1145/3747588

[^2_31]: https://chatpaper.com/zh-CN/paper/263555

[^2_32]: https://openreview.net/forum?id=svyjoTT47M

[^2_33]: https://www.cs.nuim.ie/research/pop/verifai_updated.html

[^2_34]: https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1655469/full

[^2_35]: https://arxiv.org/abs/2602.13851v3

[^2_36]: https://arxiv.org/html/2507.04857v1

[^2_37]: https://arxiv.org/html/2507.13290v2

[^2_38]: https://nlp.cs.berkeley.edu/pubs/Pan-Wang-Neubig-Jaitly-Ji-Suhr-Zhang_2025_SWEGym_paper.pdf

[^2_39]: https://www.youtube.com/watch?v=IA5KIeO8K_A

[^2_40]: https://arxiv.org/html/2603.13258v1

[^2_41]: https://www.linkedin.com/pulse/harnessx-turns-agent-harness-typed-object-you-can-compose-vj1pe

[^2_42]: https://openreview.net/pdf/f949f845f5ee585741af28e196e1146c94a1a73b.pdf

[^2_43]: https://arxiv.org/pdf/2511.16043.pdf

[^2_44]: https://tianpan.co/zh/blog/2026-04-09-agentic-coding-production-swebench-gap

[^2_45]: https://www.youtube.com/watch?v=9ZqGVh8LtYg

[^2_46]: https://www.seangoedecke.com/impact-of-ai-study/

[^2_47]: https://www.marktechpost.com/2025/11/24/agent0-a-fully-autonomous-ai-framework-that-evolves-high-performing-agents-without-external-data-through-multi-step-co-evolution/


---

### 1. Where Models Agree

| Finding | GPT-5.5 Thinking | Claude Opus 4.8 Thinking | Gemini 3.1 Pro Thinking | Evidence |
| :-- | :-- | :-- | :-- | :-- |
| STZ should evolve around stronger verification, not more free-form memory | ✓ | ✓ | ✓ | VeriAct/Spec-Harness show verifier pass alone is misleading; CTIM-Rover and CL-Bench show naive memory can degrade performance[^3_1][^3_2][^3_3][^3_4] |
| Project-bounded RSI needs exogenous, repo-specific signals beyond sealed tests | ✓ | ✓ | ✓ | Agentic Rubrics adds context-grounded verification; Spec-Harness measures correctness/completeness; SWE-bench Verified is contaminated for frontier evals[^3_5][^3_1][^3_6] |
| Retrieval should be selective and turn-time, not bulk memory injection | ✓ | ✓ | ✓ | CTIM-Rover degraded by injecting CTIM wholesale; authors recommend embedding retrieval each turn; SWE-Bench-CL uses FAISS-backed semantic memory[^3_3][^3_7] |
| Harness evolution should target typed, isolated primitives rather than monolithic rewrites | ✓ | ✓ | ✓ | HarnessX improves by composing/evolving harness primitives; DGM uses archived branching self-modification with evaluation gates[^3_8][^3_9][^3_10] |
| STZ should prioritize repository-grounded spec/rubric generation before implementation tournaments | ✓ | ✓ | ✓ | Agentic Rubrics improves SWE verification; CodeSpecBench shows spec generation is hard but useful for reranking; VeriAct closes loop through spec repair[^3_5][^3_11][^3_1] |
| Demonstrating bounded RSI requires continual metrics that isolate gain over baseline | ✓ | ✓ | ✓ | CL-Bench introduces gain metric; SWE-Bench-CL adds forgetting/forward transfer metrics; user wants maxRounds/convergence controls[^3_4][^3_7] |

### 2. Where Models Disagree

| Topic | GPT-5.5 Thinking | Claude Opus 4.8 Thinking | Gemini 3.1 Pro Thinking | Why They Differ |
| :-- | :-- | :-- | :-- | :-- |
| First integration milestone | Add Spec-Harness-lite and rubric authoring first | Add typed harness primitive layer first, then verification | Add retrieval/memory refactor first to stop harm before adding new loops | Different weighting of immediate ROI: GPT-5.5 Thinking prioritizes better reward signal; Claude Opus 4.8 Thinking prioritizes architecture cleanliness; Gemini 3.1 Pro Thinking prioritizes removing current degradation path[^3_8][^3_1][^3_3] |
| Role of formal specs in STZ vNext | Central, first-class artifact and promotion gate | Important but should begin as soft score beside tests/rubrics | Use executable behavioral specs selectively on high-value slices only | Different assumptions about implementation cost and repo diversity; CodeSpecBench shows specs are powerful but hard at repo level[^3_11][^3_12] |
| Whether to keep tournament self-modification active early | Keep constrained micro-evolution running from phase 1 | Freeze self-modification initially; harden evaluator first | Keep only prompt/control-flow evolution, no persistent learning writes until judge calibration is proven | Different risk tolerance around silent evaluator failure and Goodharting, consistent with your prior concern about silent-failure traps[^3_13][^3_1][^3_5] |
| Best benchmark for proving improvement | Internal project-specific rolling benchmark plus CL-style gain | Private issue stream plus architect rubric and regression suite | Mixed benchmark: internal issues + a small external benchmark for comparability | Different weighting of external comparability vs contamination risk; OpenAI deprecates SWE-bench Verified for frontier measurement[^3_6][^3_4] |

### 3. Unique Discoveries

| Model | Unique Finding | Why It Matters |
| :-- | :-- | :-- |
| GPT-5.5 Thinking | STZ should introduce a “promotion ledger” that records why a learning was promoted, with counterfactual evidence against baseline[^3_4] | Makes bounded RSI auditable and helps separate genuine learning from variance |
| Claude Opus 4.8 Thinking | Add “spec-crystallization” as an evolvable gene alongside current STZ genes, not just prompt/test mutations[^3_8][^3_1] | Gives the system an improvement axis tied to semantics rather than only test sharpening |
| Gemini 3.1 Pro Thinking | Use a two-speed loop: fast ephemeral exploration per issue, slow consolidation only after multi-issue evidence and dream-style cleanup[^3_14][^3_15] | Reduces context rot and prevents noisy learnings from entering persistent project knowledge |

### 4. Comprehensive Analysis

The strongest point of convergence is that STZ should stop trying to demonstrate bounded RSI primarily through persistent experiential memory and instead demonstrate it through **improving the project’s verification and decision surface**. GPT-5.5 Thinking, Claude Opus 4.8 Thinking, and Gemini 3.1 Pro Thinking all converge on the same diagnosis: your current ceiling is not that the sub-agents fail to search, but that the system lacks a sufficiently exogenous and semantically rich reward signal to convert search into reliable software improvement. VeriAct is the most direct research analogue here. It shows that prompt or verifier optimization alone reaches a ceiling, because “passes the verifier” is not the same thing as “correct and complete”. That maps almost perfectly to your observation that STZ sharpens testing but does not reliably improve outputs.[^3_3][^3_5][^3_1][^3_4][^3_2]

A second high-confidence finding is that **bulk memory injection is more likely to harm than help** in software-engineering agents. CTIM-Rover is especially relevant because it is almost the failure mode you want to avoid: a seemingly sensible repository/general memory layer that degrades performance due to noisy guidance, even when built from successful past trajectories. The paper’s qualitative examples are damning — one irrelevant token in a memory item can bias localization toward the wrong function. GPT-5.5 Thinking and Gemini 3.1 Pro Thinking both align this with SWE-Bench-CL, which points toward FAISS-backed retrieval and continual metrics, not indiscriminate persistence. For STZ, the practical implication is that “persisted learnings” must be treated as a privileged artifact class with promotion criteria, not as a writable scratchpad that sub-agents continuously append to.[^3_7][^3_4][^3_3]

A third area of strong agreement is that **verification should be multi-channel and repository-grounded**. Agentic Rubrics is particularly useful because it gives STZ a cheaper, more contextual verifier than test execution alone. All three models treat rubric generation as the missing upstream step before running tournaments: an explorer/verifier agent inspects the repository and issue, then produces an explicit rubric or checklist against which candidate patches can be scored. That gives you a more granular reward signal and mitigates the current dynamic where hidden tests dominate promotion. VeriAct and CodeSpecBench reinforce the same lesson from another direction: executable behavior specs and spec-harnessing are hard, but they reveal semantic errors that test pass rates can miss. Together, the literature supports a stack of gates: tests, rubric, and partial executable spec/property checks, rather than tests alone.[^3_5][^3_1][^3_11]

Where the models diverge is mainly sequencing, not destination. GPT-5.5 Thinking argues for adding **Spec-Harness-lite first**, because the immediate blocker is evaluator blindness. On this view, STZ should gain a new artifact type — perhaps `behavior_contract.py` or `spec.md` plus generated property tests — and candidate solutions should be ranked partly on whether they satisfy those contracts. Claude Opus 4.8 Thinking instead argues that the more important first move is to make STZ’s harness architecture explicitly typed and modular in the HarnessX sense. The benefit is that you can then evolve the harness safely by primitive: planner prompt, slice decomposition policy, retrieval policy, verifier mix, promotion rule, and consolidation policy. Gemini 3.1 Pro Thinking takes the most conservative operational stance: first remove the likely-harmful path by refactoring persistent memory into selective retrieval, then add stronger semantic verification.[^3_7][^3_8][^3_1][^3_3]

These differences come from different assumptions about what currently constrains STZ most. GPT-5.5 Thinking assumes the biggest bottleneck is the reward function. Claude Opus 4.8 Thinking assumes the bottleneck is the inability to evolve components independently. Gemini 3.1 Pro Thinking assumes the bottleneck is negative carryover from noisy persistence. All three are defensible, but given your stated experience — “cannot get it to improve outputs beyond sharpening testing” — the evaluator hypothesis appears strongest. Sharper testing is already evidence that the search loop works; what is missing is a richer notion of “better.”

The most important unique insight is Claude Opus 4.8 Thinking’s suggestion to add **spec-crystallization as an evolvable gene**. That is a cleaner way to operationalize bounded RSI than generic “learn from runs.” Instead of persisting free-form advice, STZ would evolve and compare small, typed project artifacts such as: issue decomposition templates, architecture invariants, property-test generators, API misuse detectors, refactor safety checklists, or function-level behavior contracts. These are inspectable, project-local, and benchmarkable. GPT-5.5 Thinking’s proposed promotion ledger complements this well: every promoted learning should carry evidence that it improved at least one downstream issue without harming held-out calibration tasks. Gemini 3.1 Pro Thinking’s two-speed loop also matters. Fast loop: explore per issue with ephemeral branch-local memory. Slow loop: consolidate only after repeated evidence across multiple issues, followed by dream-style deduplication and cleanup.[^3_8][^3_1][^3_4][^3_14][^3_15]

Given the research and your project constraints, the integration approach that best converges the evidence is:

**Phase 1: Replace “persistent learning” with “candidate learning artifacts.”**
No sub-agent writes directly to project knowledge. It may propose artifacts into a `candidates/` area: rubric snippets, spec clauses, property tests, heuristics, search macros, or slice strategies. This immediately bounds RSI.

**Phase 2: Add a verifier triad.**
For each issue or slice, generate:

1. execution tests/regressions,
2. an agentic rubric,
3. a lightweight executable spec/property layer for touched interfaces.[^3_11][^3_5]
Promotion requires improvement on a weighted combination, not any single channel.

**Phase 3: Introduce selective retrieval, not memory injection.**
Persist only promoted artifacts into a read-only project knowledge store. Retrieval is embedding- or tag-based per turn/per subtask, not preloaded wholesale. Keep working memory separate from project knowledge.[^3_3][^3_7]

**Phase 4: Evolve harness primitives, not full harnesses.**
Adopt a HarnessX-style typed config where STZ can vary decomposition policy, candidate generation count, verifier weighting, reranking strategy, retrieval policy, and consolidation threshold independently. This makes experimentation legible and safer.[^3_8]

**Phase 5: Measure bounded RSI with continual metrics.**
Use a private chronological issue stream and compute baseline vs stateful gain, forgetting, forward transfer, tool-efficiency deltas, and promotion precision. Do not rely on SWE-bench Verified as the headline proof because of contamination concerns. Use internal rolling tasks as primary evidence and, if desired, a small uncontaminated external side benchmark for communication.[^3_6][^3_4][^3_7]

The practical recommendation is to **not** rebuild STZ as a grand self-rewriting agent. Instead, evolve it into a **bounded project improvement foundry** with five explicit artifact classes: `rubric`, `spec`, `test`, `search_policy`, and `knowledge_note`. Only the first four should influence promotion early. `knowledge_note` should be informational until you have clear evidence it helps rather than harms. If you want the single most defensible next step, make it this:[^3_3]

**Implement STZ vNext as “Rubric + Spec-Harness-lite + Promotion Ledger,” while freezing unconstrained persistent learning writes.**

That is the cleanest integration path because it directly addresses your current ceiling, aligns with the strongest research consensus, preserves project-boundedness, and creates measurable conditions under which you can honestly claim bounded RSI in SWE output rather than merely better tests.[^3_1][^3_4][^3_5]
<span style="display:none">[^3_100][^3_101][^3_102][^3_103][^3_104][^3_105][^3_106][^3_107][^3_108][^3_109][^3_110][^3_111][^3_112][^3_113][^3_114][^3_115][^3_116][^3_117][^3_118][^3_119][^3_120][^3_121][^3_122][^3_123][^3_124][^3_125][^3_126][^3_127][^3_128][^3_129][^3_130][^3_131][^3_132][^3_133][^3_134][^3_135][^3_136][^3_137][^3_138][^3_139][^3_140][^3_141][^3_142][^3_143][^3_144][^3_145][^3_146][^3_147][^3_148][^3_149][^3_150][^3_151][^3_152][^3_153][^3_154][^3_16][^3_17][^3_18][^3_19][^3_20][^3_21][^3_22][^3_23][^3_24][^3_25][^3_26][^3_27][^3_28][^3_29][^3_30][^3_31][^3_32][^3_33][^3_34][^3_35][^3_36][^3_37][^3_38][^3_39][^3_40][^3_41][^3_42][^3_43][^3_44][^3_45][^3_46][^3_47][^3_48][^3_49][^3_50][^3_51][^3_52][^3_53][^3_54][^3_55][^3_56][^3_57][^3_58][^3_59][^3_60][^3_61][^3_62][^3_63][^3_64][^3_65][^3_66][^3_67][^3_68][^3_69][^3_70][^3_71][^3_72][^3_73][^3_74][^3_75][^3_76][^3_77][^3_78][^3_79][^3_80][^3_81][^3_82][^3_83][^3_84][^3_85][^3_86][^3_87][^3_88][^3_89][^3_90][^3_91][^3_92][^3_93][^3_94][^3_95][^3_96][^3_97][^3_98][^3_99]</span>

<div align="center">⁂</div>

[^3_1]: https://arxiv.org/abs/2604.00280

[^3_2]: https://arxiv.org/html/2604.00280v1

[^3_3]: https://arxiv.org/abs/2505.23422

[^3_4]: https://arxiv.org/abs/2606.05661

[^3_5]: https://arxiv.org/abs/2601.04171

[^3_6]: https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/

[^3_7]: https://arxiv.org/abs/2507.00014

[^3_8]: https://arxiv.org/abs/2606.14249

[^3_9]: https://sakana.ai/dgm/

[^3_10]: https://github.com/jennyzzt/dgm

[^3_11]: https://arxiv.org/abs/2604.12268

[^3_12]: https://arxiv.org/html/2604.12268v1

[^3_13]: https://www.perplexity.ai/search/8aee10a8-d6b2-4d37-9475-84bafa0f1676

[^3_14]: https://www.youtube.com/watch?v=YPOgIvC_RwA

[^3_15]: https://letsdatascience.com/news/anthropic-introduces-dreaming-for-claude-agent-memory-consol-32a279c9

[^3_16]: https://huggingface.co/papers/2606.14249

[^3_17]: https://huggingface.co/papers/2505.22954

[^3_18]: https://arxiv.org/abs/2604.00280v1

[^3_19]: https://arxiv.org/abs/2604.12268v1

[^3_20]: https://www.microsoft.com/en-us/research/publication/intent-aligned-formal-specification-synthesis-via-traceable-refinement/?lang=zh-cn

[^3_21]: https://arxiv.org/abs/2605.27531v1

[^3_22]: https://arxiv.org/html/2601.04171

[^3_23]: https://arxiv.org/abs/2603.13258

[^3_24]: https://www.alphaxiv.org/overview/2601.04171

[^3_25]: https://conf.researchr.org/details/icse-2026/icse-2026-software-engineering-in-practice/29/The-SWE-Bench-Illusion-When-State-of-the-Art-LLMs-Remember-Instead-of-Reason

[^3_26]: https://www.themoonlight.io/en/review/codespecbench-benchmarking-llms-for-executable-behavioral-specification-generation

[^3_27]: https://arxiv.org/html/2505.23422v1

[^3_28]: https://slashpage.com/haebom/943zqpmqr5j7q2wnvy87

[^3_29]: https://arxiv.org/html/2606.05661v1

[^3_30]: https://chatpaper.com/fr/chatpaper/paper/157194

[^3_31]: https://www.themoonlight.io/en/review/from-knowledge-to-noise-ctim-rover-and-the-pitfalls-of-episodic-memory-in-software-engineering-agents

[^3_32]: https://arxiv.org/html/2511.16043v1

[^3_33]: https://github.com/aiming-lab/Agent0

[^3_34]: https://letsdatascience.com/blog/anthropic-dreaming-claude-managed-agents-self-improving-may-6

[^3_35]: https://www.beri.net/article/2026-05-10-anthropic-dreaming-claude-agents-harvey-6x-self-improving

[^3_36]: https://www.developersdigest.tech/blog/claude-managed-agents-dreaming-outcomes-multi-agent

[^3_37]: https://www.youtube.com/watch?v=YPOgIvC_RwA\&vl=ja

[^3_38]: https://www.abhs.in/blog/anthropic-dreaming-claude-managed-agents-self-improve-harvey-wisedocs-2026

[^3_39]: https://huggingface.co/papers/2603.15401

[^3_40]: https://www.catalyzex.com/paper/swe-skills-bench-do-agent-skills-actually

[^3_41]: https://www.linkedin.com/posts/apoorvajoshi95_if-youre-writing-agent-skills-for-everything-activity-7457435720945942529-WQTC

[^3_42]: https://arxiv.org/pdf/2604.00280.pdf

[^3_43]: https://arxiv.org/abs/2602.13851v3

[^3_44]: https://dev.to/sachin_gupta_7fa2ec5ba28f/hexforge-the-spooky-coding-education-game-for-the-kiroween-1gb6

[^3_45]: https://www.youtube.com/watch?v=27xgil6P20w

[^3_46]: https://github.com/aws-samples/sample-kiro-cli-prompts-for-product-teams/blob/main/.kiro/steering/prd-guide.md

[^3_47]: https://theagenttimes.com/articles/openai-retires-swe-bench-verified-as-saturation-and-contamin-2daddb6c

[^3_48]: https://arxiv.org/abs/2606.14249v1

[^3_49]: https://novalogiq.com/2026/06/25/xiaomis-harnessx-rewrites-its-own-ai-scaffolding-mid-task-and-smaller-models-gain-the-most/

[^3_50]: https://x.com/akshay_pachaar/status/2066886861235315008

[^3_51]: https://tianpan.co/blog/2026-04-09-agentic-coding-production-swebench-gap

[^3_52]: https://particula.tech/blog/ai-coding-tools-developer-productivity-paradox

[^3_53]: https://www.actuia.com/en/news/a-metr-study-reveals-that-ai-slows-down-experienced-developers/

[^3_54]: https://arxiv.org/pdf/2604.12268v1.pdf

[^3_55]: https://chatpaper.com/zh-CN/paper/263555

[^3_56]: https://arxiv.org/html/2605.02455v1

[^3_57]: https://arxiv.org/pdf/2604.05820v1.pdf

[^3_58]: https://www.pith.science/paper/2604.12268

[^3_59]: https://slashpage.com/haebom/36nj8v2wq7gww25ykq9z

[^3_60]: https://huggingface.co/papers/2604.17338

[^3_61]: https://openreview.net/pdf?id=SEcSahl0Ql

[^3_62]: https://arxiv.org/pdf/2603.25770.pdf

[^3_63]: https://ai-navigate-news.com/en/articles/7ea26aa0-edf9-44ad-84e4-7d541f86e859

[^3_64]: https://www2.eecs.berkeley.edu/Pubs/TechRpts/2026/EECS-2026-170.html

[^3_65]: https://arxiv.org/html/2505.22954v3

[^3_66]: https://www.youtube.com/watch?v=IA5KIeO8K_A

[^3_67]: https://www.alphaxiv.org/overview/2606.14249

[^3_68]: https://www.youtube.com/watch?v=e_R5ou-tGN4

[^3_69]: https://aipapersacademy.com/darwin-godel-machine/

[^3_70]: https://codex.danielvaughan.com/2026/06/18/harnessx-composable-evolvable-agent-harness-foundry-codex-cli-configuration-evolution-patterns/

[^3_71]: https://www.linkedin.com/pulse/coding-agent-raises-its-own-swe-bench-score-from-20-50-david-borish-e2hze

[^3_72]: https://www.oio-blog.com/contents/harnessx-agent-harness-foundry/

[^3_73]: https://buttondown.com/anatol/archive/darwin-godel-machines-a-self-improving/

[^3_74]: https://alphasignalai.substack.com/p/harnessx-turns-the-agent-harness

[^3_75]: https://www.intoai.pub/p/darwin-godel-machine-the-first-self

[^3_76]: https://github.com/thomasjoshi/agents-never-forget/

[^3_77]: https://arxiv.org/pdf/2603.13258.pdf

[^3_78]: https://scholar.google.com/citations?user=dLXfLzoAAAAJ\&hl=en

[^3_79]: https://scholar.google.com/citations?user=ms-Y9OgAAAAJ\&hl=en

[^3_80]: https://arxiv.org/html/2603.10291v1

[^3_81]: https://github.com/Liqs-v2/ctim-rover

[^3_82]: https://arxiv.org/html/2501.11739v1

[^3_83]: https://www.arxiv.org/list/cs.SE/recent?skip=5\&show=50

[^3_84]: http://web.eecs.umich.edu/~soar/sitemaker/docs/pubs/ijcai09.pdf

[^3_85]: https://hyper.ai/en/papers/2606.14249/pdf

[^3_86]: https://openreview.net/attachment?id=ayA2tJNDET\&name=pdf

[^3_87]: https://www.cnblogs.com/llmnews/articles/20551345

[^3_88]: https://x.com/Memoirs/status/2009214773276078458

[^3_89]: https://x.com/dair_ai/status/2066563390538178784

[^3_90]: https://alphaxiv.org/overview/2601.04171v1

[^3_91]: https://www.youtube.com/watch?v=IjWmF2xAnxY

[^3_92]: https://scholar.google.com/citations?user=KNsZ1u4AAAAJ\&hl=en

[^3_93]: http://arxiv.org/list/cs/2025-05?skip=12175\&show=2000

[^3_94]: http://www.arxiv.org/list/cs.AI/recent?skip=1100\&show=50

[^3_95]: https://kenhuangus.substack.com/p/how-ai-agents-actually-remember-part

[^3_96]: https://arxiv.org/html/2506.12286v3

[^3_97]: https://arxiv.org/list/cs.CL/pastweek?skip=650\&show=50

[^3_98]: https://hyper.ai/en/papers/2606.05661

[^3_99]: https://aclanthology.org/2025.findings-acl.428.pdf

[^3_100]: https://openreview.net/pdf?id=fjJcJhIzYx

[^3_101]: https://digg.com/tech/x5ziv8r7

[^3_102]: https://arxiv.org/html/2601.22249v1

[^3_103]: https://arxiv.org/html/2509.20215v1

[^3_104]: https://24-ai.news/ja/news/2026-06-04/arxiv-cl-bench-continual-learning/

[^3_105]: https://ar5iv.labs.arxiv.org/html/2506.00027

[^3_106]: https://arxiv.org/html/2504.09643v1

[^3_107]: https://24-ai.news/en/news/2026-06-04/arxiv-cl-bench-continual-learning/

[^3_108]: https://arxiv.org/html/2408.05715v1

[^3_109]: https://24-ai.news/ko/news/2026-06-04/arxiv-cl-bench-continual-learning/

[^3_110]: https://backfield.net/river/tag/continual-learning

[^3_111]: https://agentmarketcap.ai/blog/2026/04/08/real-world-coding-agent-performance-vs-swe-bench-2026

[^3_112]: https://codingfleet.com/blog/swe-bench-pro-explained-the-new-standard-for-ai-coding-benchmarks-2026/

[^3_113]: https://agentmarketcap.ai/blog/2026/04/07/swe-rebench-monthly-updated-coding-agent-benchmark

[^3_114]: https://agentmarketcap.ai/blog/2026/04/07/swe-bench-pro-46-vs-verified-81-benchmark-contamination

[^3_115]: https://www.digitalapplied.com/blog/swe-bench-terminal-bench-benchmark-guide-2026

[^3_116]: https://www.morphllm.com/swe-bench-pro

[^3_117]: https://agentmarketcap.ai/blog/2026/04/12/openai-swe-bench-self-reporting-contamination-crisis

[^3_118]: https://www.codeant.ai/blogs/swe-bench-scores

[^3_119]: https://x.com/OpenAIDevs/status/2026002219909427270

[^3_120]: https://www.youtube.com/watch?v=0RP0x2f9OLM

[^3_121]: https://x.com/latentspacepod/status/2026027529039990985

[^3_122]: https://www.linkedin.com/posts/hackerrank_openai-just-killed-swe-bench-verified-the-activity-7432807590759264256-xzhQ

[^3_123]: https://www.youtube.com/watch?v=_BJwkGJuXc4

[^3_124]: https://vantaige.io/blog/claude-code-dreaming-memory-consolidation-setup-2026

[^3_125]: https://arxiv.org/pdf/2604.00280v1.pdf

[^3_126]: https://tensorpm.com/blog/dreaming-isnt-enough-claude-memory-vs-tensorpm

[^3_127]: https://www.syntaxdispatch.com/blog/claude-managed-agents-dreaming

[^3_128]: https://www.forbes.com/sites/jonmarkman/2026/05/11/claudes-new-dreaming-feature-builds-self-improving-ai-agents/

[^3_129]: https://www.everydev.ai/p/blog-what-anthropic-shipped-at-code-with-claude-2026

[^3_130]: https://dev.to/jangwook_kim_e31e7291ad98/code-with-claude-2026-managed-agents-dreaming-aws-3pc6

[^3_131]: https://agentconn.com/blog/ai-agent-memory-auto-dream-context-files-2026/

[^3_132]: https://www.facebook.com/jonathanjmast/posts/claude-code-just-learned-how-to-dream-breaking-claude-codes-new-dream-function-g/26854162467523233/

[^3_133]: https://www.youtube.com/watch?v=RtywqDFBYnQ

[^3_134]: https://www.reddit.com/r/LocalLLaMA/comments/1r3weq3/swerebench_jan_2026_glm5_minimax_m25/

[^3_135]: https://agentmarketcap.ai/blog/2026/04/09/swe-bench-verified-progress-timeline-2023-2026

[^3_136]: https://www.marktechpost.com/2026/05/15/best-ai-agents-for-software-development-ranked-a-benchmark-driven-look-at-the-current-field/

[^3_137]: https://awesomeagents.ai/leaderboards/swe-bench-coding-agent-leaderboard/

[^3_138]: https://arxiv.org/html/2602.08316v3

[^3_139]: https://www.swebench.com

[^3_140]: https://arxiv.org/pdf/2507.00014v1.pdf

[^3_141]: https://www.mindstudio.ai/blog/claude-mythos-benchmark-results-swe-bench-agentic-coding

[^3_142]: https://localaimaster.com/models/swe-bench-explained-ai-benchmarks

[^3_143]: https://arxiv.org/html/2603.01327v1

[^3_144]: https://sakardotel.com/blog/shifting-to-specification-driven-engineering-with-kiro/

[^3_145]: https://arxiv.org/html/2604.08417v1

[^3_146]: https://pt.slideshare.net/slideshow/spec-driven-development-with-ai-building-future-ready-software-using-kiro-ide/287908914

[^3_147]: https://www.chatpaper.ai/ru/dashboard/paper/d5b66f8f-62a9-4c0c-85c4-430da34eeeb8

[^3_148]: https://arxiv.org/pdf/2603.15401.pdf

[^3_149]: https://findskill.ai/blog/claude-dreaming-harvey-6x-platform-teams-q3/

[^3_150]: https://www.oktosolutions.ca/en/claude-dreaming-danthropic-ai-agents-who-learn-from-their-mistakes/

[^3_151]: https://note.com/tothinks/n/ne69a63a2fbfa?hl=en

[^3_152]: https://www.youtube.com/watch?v=eaNo5iAnOHE

[^3_153]: https://toolnav.io/news/2026-05-24-anthropic-claude-code-routines-dreams/

[^3_154]: https://x.com/JustAnotherPM/status/2055346735837532362


---

# Turn this into an extremely detailed implementation plan

Yes — the right move is an implementation plan, not more concept language.

## Direct answer

The best evolution path for STZ is to turn it into a bounded, typed improvement system where sub-agents can propose project-local artifacts, but only calibrated verifier pipelines can promote them into persistent project knowledge or default harness behavior. The plan below converges on that architecture and sequences it so you can demonstrate real SWE improvement without relying on unconstrained memory, self-rewriting, or contaminated benchmark claims.[^4_1][^4_2][^4_3][^4_4][^4_5][^4_6]

## Target architecture

STZ vNext should have six top-level planes: orchestration, candidate generation, verifier stack, promotion ledger, project knowledge, and continual evaluation. This keeps experimentation bounded: exploration is cheap and branch-local, while persistence is slow, typed, and evidence-gated.[^4_3][^4_4][^4_5][^4_1]


| Plane | Purpose | Persistence | Main risk controlled |
| :-- | :-- | :-- | :-- |
| Orchestration | Run issue/slice loops and tournaments | Ephemeral per run | Search chaos [^4_1] |
| Candidate generation | Produce patches, tests, rubrics, specs, heuristics | Ephemeral until promoted | Unbounded writes [^4_1][^4_4] |
| Verifier stack | Score candidates with multiple signals | Run artifacts only | Test-only Goodharting [^4_2][^4_3] |
| Promotion ledger | Record why anything was kept | Durable | Silent evaluator drift [^4_3][^4_5] |
| Project knowledge | Read-only promoted learnings | Durable, typed | Memory noise [^4_4] |
| Continual evaluation | Measure gain over time | Durable metrics | False RSI claims [^4_5][^4_6] |

The core design principle is that **sub-agents never write directly to trusted knowledge**. They write proposals into a quarantined candidate area, and promotion requires passing explicit gates against held-out calibration tasks, repository-grounded rubrics, and selective semantic checks.[^4_2][^4_4][^4_3]

## Delivery phases

### Phase 0

Start by freezing the current STZ write path so no run can mutate default prompts, long-term memory, or project policy files without a promotion decision. This is the architectural reset that converts STZ from “experimental adaptive harness” into “bounded improvement harness”.[^4_4][^4_1]

Deliverables:

- `WRITE_GUARD.md` describing forbidden direct writes.
- `artifacts/candidates/` as the only writable improvement area.
- `artifacts/promoted/` as the only trusted area.
- `ledger/promotions.jsonl` as append-only audit storage.

Rules:

- Candidate artifacts may be created freely.
- Promoted artifacts are immutable except by superseding version.
- No candidate artifact is auto-loaded in future runs.
- Project knowledge is read-only during issue execution.

Exit criteria:

- Existing STZ commands still run.
- No code path allows silent mutation of default harness behavior.
- Every persistence event requires a ledger entry.


### Phase 1

Refactor STZ into typed primitives, borrowing the useful part of HarnessX: treat prompts, tools, retrieval policies, control-flow decisions, and verifier weights as typed harness components rather than as implicit behavior in scripts. The key objective is not self-evolution yet; it is safe substitution and isolated experimentation.[^4_7][^4_1]

Define primitive classes:

- `PlannerPolicy`
- `SlicePolicy`
- `CandidatePolicy`
- `RetrievalPolicy`
- `VerifierPolicy`
- `PromotionPolicy`
- `ConsolidationPolicy`

Recommended TypeScript interfaces:

```ts
type PrimitiveId = string;
type PrimitiveVersion = string;

interface HarnessPrimitive<TConfig> {
  id: PrimitiveId;
  version: PrimitiveVersion;
  kind:
    | "planner"
    | "slice"
    | "candidate"
    | "retrieval"
    | "verifier"
    | "promotion"
    | "consolidation";
  description: string;
  config: TConfig;
  inputSchema: object;
  outputSchema: object;
  safety: {
    readonly?: boolean;
    promotable: boolean;
    allowedRepos?: string[];
  };
}
```

Add a composition manifest:

```yaml
harness:
  planner: planner.repo-aware.v1
  slicer: slicer.spec-first.v1
  candidate: candidate.parallel-3.v1
  retrieval: retrieval.turn-local.v1
  verifier: verifier.triad.v1
  promotion: promotion.conservative.v1
  consolidation: consolidation.manual.v1
```

This matters because future improvement can now mean “swap one primitive and compare,” not “rewrite the harness blob”. It also gives you branch-local isolation for tournaments.[^4_1]

Exit criteria:

- All current STZ behavior can be represented as manifest + primitives.
- A run can emit the exact manifest used.
- Primitive substitution works without manual code edits.


### Phase 2

Introduce a strict artifact model. This is the practical heart of bounded RSI: learnings are no longer free-form notes, but typed project artifacts with explicit semantics and lifecycle.[^4_2][^4_3][^4_4]

Recommended artifact classes:

- `patch`
- `test`
- `rubric`
- `behavior_spec`
- `property_generator`
- `search_heuristic`
- `repo_note`
- `retrieval_index_snapshot`
- `promotion_decision`

Artifact directory layout:

```text
artifacts/
  candidates/
    run-<id>/
      patch/
      test/
      rubric/
      behavior_spec/
      search_heuristic/
      repo_note/
  promoted/
    patch/
    test/
    rubric/
    behavior_spec/
    search_heuristic/
    repo_note/
```

Each artifact gets metadata:

```json
{
  "artifact_id": "rubric.repo-api-boundary.v1",
  "kind": "rubric",
  "status": "candidate",
  "repo": "project-x",
  "source_run": "run_2026_07_01_001",
  "source_issue": "issue_123",
  "created_by": "rubric-author-agent",
  "dependencies": ["slice.plan.v2"],
  "evidence": [],
  "promotion_state": "pending"
}
```

Important constraint: `repo_note` is lowest-trust. Early in the roadmap it should not affect agent behavior directly, because CTIM-Rover is strong evidence that noisy memory-like context can degrade performance. In early phases, only `rubric`, `behavior_spec`, `test`, and `search_heuristic` should be eligible to influence future default behavior.[^4_4]

Exit criteria:

- All candidate outputs land in typed folders.
- Promotion system rejects untyped artifacts.
- Runs can execute with zero use of `repo_note`.


### Phase 3

Build the verifier triad. This is the single most important technical addition because it changes the reward surface from “hidden tests say pass/fail” to a multi-signal notion of engineering quality.[^4_3][^4_2]

The triad:

1. Execution verifier.
2. Rubric verifier.
3. Spec verifier.

#### Execution verifier

Keep your current strongest test machinery, but separate it into:

- baseline tests,
- candidate-generated tests,
- regression tests from prior promotions,
- held-out calibration issues.

Scoring buckets:

- compile/install success,
- target tests,
- regression delta,
- flaky test detection,
- runtime/resource sanity.

Do not allow candidate-generated tests alone to justify promotion. They may support a case, but they cannot define correctness by themselves, because that reproduces the current test-sharpening ceiling.[^4_3]

#### Rubric verifier

Implement a `rubric-author` sub-agent modeled on Agentic Rubrics: first inspect the repository and issue, then produce a context-grounded checklist that scores candidate patches without running code. This is valuable because it catches architectural and semantic issues tests miss, and the paper found codebase-specific context gathering materially improved verifier quality.[^4_2]

Rubric schema:

```yaml
rubric_id: rubric.issue-123.v1
repo: project-x
issue: issue-123
criteria:
  - id: c1
    title: Fixes described failure mode
    weight: 0.25
    kind: semantic
    pass_conditions:
      - "target branch handles null path"
      - "error path preserves prior contract"
  - id: c2
    title: Respects module boundary
    weight: 0.15
    kind: architecture
  - id: c3
    title: Avoids regression in adjacent API behavior
    weight: 0.20
    kind: compatibility
  - id: c4
    title: Change is localized and minimally invasive
    weight: 0.10
    kind: maintainability
  - id: c5
    title: Naming and types align with repo conventions
    weight: 0.10
    kind: style
  - id: c6
    title: Test changes are justified by issue semantics
    weight: 0.20
    kind: verification
```

You want two separate agents here:

- `rubric-author`: writes rubric.
- `rubric-judge`: scores candidate against rubric.

Keep them isolated so the generator of the patch is not the same entity generating its own success conditions.

#### Spec verifier

Implement “Spec-Harness-lite,” not full theorem-prover formal methods. VeriAct’s big lesson is that verifier acceptance alone is misleading and that correctness/completeness need a stronger harness. For STZ, the practical version is executable behavioral specs and property checks around changed interfaces.[^4_3]

Start with:

- preconditions,
- postconditions,
- invariants,
- forbidden side effects,
- state transition assertions.

Artifact example:

```python
# behavior_spec/user_merge_email.py
def pre(ctx, args):
    assert args.user_id is not None
    assert isinstance(args.email, str)

def post(ctx_before, args, result, ctx_after):
    assert result.email == args.email
    assert ctx_after.audit_log.last_event.type == "user_email_updated"

def forbidden(ctx_before, args, result, ctx_after):
    assert ctx_after.account.status == ctx_before.account.status
```

Use this as a semantic gate and reranking signal. CodeSpecBench indicates repository-level executable spec generation is hard, so scope it narrowly: touched functions, API boundaries, stateful workflows, and regression-prone modules. Do not try to spec the entire repo at once.[^4_3]

Triad scoring recommendation:

```ts
score =
  0.50 * executionScore +
  0.30 * rubricScore +
  0.20 * specScore;
```

Use hard fails:

- compile fails,
- target issue unresolved,
- held-out regressions fail,
- spec violation on high-severity invariant.

Exit criteria:

- Every tournament candidate gets triad scores.
- Promotion requires triad evidence.
- At least one issue can be resolved where rubric/spec change ranking compared with tests alone.


### Phase 4

Replace bulk memory with selective retrieval. Both CTIM-Rover and broader continual-learning evidence warn against undifferentiated memory injection in SWE agents. The correct move is to distinguish working memory from project knowledge and to retrieve only relevance-filtered items at the moment of need.[^4_5][^4_4]

Implement four knowledge tiers:

- `WorkingMemory`: current run, transient.
- `CandidateMemory`: current run artifacts, transient.
- `ProjectKnowledge`: promoted, typed, read-only.
- `MetaKnowledge`: harness-level heuristics, also typed and gated.

Retrieval policy:

- query only from promoted artifacts,
- retrieve by issue text + code symbols + slice objective,
- cap retrieved items aggressively,
- retrieve per step or per slice, not once at session start.

Recommended retrieval caps:

- rubric items: top 1-2
- behavior specs: top 1-3
- heuristics: top 1
- repo notes: 0 by default, 1 only if manually whitelisted

This pattern aligns with the retrieval-at-every-turn approach suggested by the failure analysis around noisy CTIM and with SWE-Bench-CL’s explicit memory framework.[^4_5][^4_4]

Pseudo-interface:

```ts
interface RetrievalRequest {
  repo: string;
  issue: string;
  sliceObjective: string;
  changedSymbols?: string[];
  requestedKinds: ArtifactKind[];
  maxItems: number;
}
```

Critical rule: retrieval should explain itself. Each injected item should include:

- why it was selected,
- expected benefit,
- confidence,
- prior evidence links.

Exit criteria:

- No full project memory dump is ever appended to prompt context.
- Retrieved knowledge is logged.
- Ablation flag can disable retrieval entirely for comparison.


### Phase 5

Implement the promotion ledger. This is what makes improvement claims auditable instead of anecdotal. Every promoted artifact or primitive change needs a machine-readable case file.[^4_5][^4_3]

Ledger schema:

```json
{
  "promotion_id": "promo_000123",
  "timestamp": "2026-07-01T12:00:00Z",
  "repo": "project-x",
  "subject": {
    "kind": "search_heuristic",
    "id": "heuristic.api-boundary-scan.v2"
  },
  "based_on_runs": ["run_101", "run_118", "run_124"],
  "evaluation": {
    "baseline_manifest": "manifest_a",
    "candidate_manifest": "manifest_b",
    "sample_size": 12,
    "execution_delta": 0.08,
    "rubric_delta": 0.11,
    "spec_delta": 0.06,
    "regression_delta": 0.00,
    "tool_cost_delta": 0.03
  },
  "decision": "promote",
  "reason": [
    "improved triad composite on held-out tasks",
    "no regression on calibration set",
    "retrieval dependence acceptable"
  ],
  "risk": "low",
  "supersedes": "heuristic.api-boundary-scan.v1"
}
```

Promotion classes:

- `accept`: promote to trusted set.
- `quarantine`: retain artifact but do not load.
- `reject`: discard from future use.
- `sunset`: remove from trusted set after negative evidence.

This ledger is also how you debug false wins. If a heuristic looks good for three tasks and then collapses, you can trace where and why.

Exit criteria:

- No promotion occurs without a ledger entry.
- Every loaded promoted artifact can be traced to supporting evidence.
- Sunset path exists and is tested.


## Core execution loops

### Issue loop

This is the operational loop for one issue.

1. Ingest issue and repo state.
2. Generate slice plan.
3. Author rubric before patch search.[^4_2]
4. Retrieve relevant promoted artifacts.
5. Spawn bounded candidate workers.
6. For each candidate, generate:
    - patch,
    - test adjustments,
    - optional behavior spec,
    - rationale.
7. Score via verifier triad.
8. Rerank top candidates.
9. Run calibration checks.
10. Select output patch.
11. Propose learnings as candidate artifacts.
12. Decide promotion later, not inline.

Pseudo-flow:

```text
Issue -> SlicePlan -> RubricAuthor -> Retrieval -> CandidateTournament
      -> TriadVerify -> Rerank -> Calibration -> Output
      -> CandidateLearnings -> LedgerDecision(optional)
```

Important boundary: issue solving and learning promotion are separate phases. This prevents “won one issue, therefore rewrite the harness.”

### Promotion loop

Run this on a schedule or manually after N issues.

1. Gather candidate artifacts.
2. Cluster by kind and intent.
3. Select promising ones with enough supporting evidence.
4. Evaluate against held-out chronological issue set.
5. Compare baseline manifest vs candidate manifest.
6. Require no severe regression and positive composite gain.
7. Write ledger decision.
8. Promote or reject.

This is your slow loop. It should be much rarer than issue loops.

## Sub-agent topology

Use specialized agents with strict permissions.


| Agent | Writes code | Writes candidate artifacts | Writes promoted artifacts | Reads project knowledge |
| :-- | --: | --: | --: | --: |
| Planner | No | Yes | No | Yes |
| Rubric author | No | Yes | No | Yes |
| Candidate patcher | Yes | Yes | No | Limited |
| Spec author | No | Yes | No | Yes |
| Execution verifier | No | Run outputs only | No | No |
| Rubric judge | No | Scores only | No | Yes |
| Spec verifier | No | Scores only | No | Yes |
| Promoter | No | Ledger only | Yes | Yes |
| Consolidator | No | Proposed merges only | No | Yes |

Permission separation matters because it prevents self-approval loops and reduces evaluator leakage.[^4_2][^4_3]

## Data model and repo layout

Recommended STZ repository structure:

```text
stz/
  packages/
    core/
      primitives/
      orchestrator/
      artifacts/
      ledger/
      retrieval/
      verifier/
    agents/
      planner/
      rubric-author/
      patcher/
      spec-author/
      promoter/
    runners/
      claude-code/
      local/
  repos/
    <project>/
      .stz/
        manifests/
        promoted/
          rubric/
          behavior_spec/
          heuristic/
          tests/
          notes/
        candidates/
        ledger/
        eval/
          issue-stream/
          calibration/
          reports/
```

Per-project config:

```yaml
project:
  id: project-x
  mode: bounded-rsi
  default_manifest: manifest.repo-x.v1
  promotion:
    min_sample_size: 8
    required_positive_delta: 0.03
    max_severe_regressions: 0
  retrieval:
    enabled: true
    max_items_per_step: 3
    allow_repo_notes: false
  verifiers:
    execution: true
    rubric: true
    spec: true
```


## Metrics and proof of improvement

You need explicit metrics or the RSI claim will stay rhetorical. Use a continual-learning framing rather than a single benchmark framing.[^4_5]

Primary metrics:

- issue resolution rate,
- triad composite score,
- forward transfer,
- backward transfer,
- forgetting,
- regression-free promotion rate,
- verifier disagreement rate,
- tool cost per resolved issue,
- time-to-first-correct patch,
- calibration set stability.

Suggested formulas:

- **Gain over baseline**: stateful manifest score minus stateless baseline score across chronological issues.[^4_5]
- **Promotion precision**: promoted artifacts that later remain non-regressive / total promoted artifacts.
- **Knowledge utility**: runs where retrieval measurably improved rank or success / runs with retrieval enabled.
- **Verifier complementarity**: fraction of tasks where rubric/spec changes ranking beyond tests.

You should publish results per repo, not as global generalization, because you explicitly want project-bounded persistence rather than assumed transfer.

## Evaluation strategy

Do not anchor the demonstration on SWE-bench Verified alone. OpenAI publicly stopped recommending it as a frontier coding measure due to contamination and flawed tests. Use it only, if at all, as a secondary historical reference point.[^4_6]

Preferred eval ladder:

1. Internal chronological repo issue stream.
2. Private or freshly-authored tasks for that repo.
3. Small held-out calibration issues.
4. Optional external benchmark slice for comparability, clearly labeled as secondary.

Evaluation splits:

- `train-like history`: where candidate learnings originate.
- `promotion holdout`: used to justify promotion.
- `final report holdout`: untouched until milestone review.

Run ablations:

- no retrieval,
- retrieval only,
- rubric only,
- spec only,
- rubric + tests,
- spec + tests,
- full triad,
- full triad + promoted heuristics.

That ablation matrix is essential. It will tell you whether STZ is actually improving SWE or merely accumulating complexity.

## Recommended implementation order

### Milestone 1

Bound writes and add typed artifacts. This is the minimum viable architectural correction.[^4_1][^4_4]

Tasks:

- add artifact schemas,
- add candidate/promoted directories,
- block direct writes,
- log every run manifest.

Expected outcome:

- STZ is safer but not yet better.


### Milestone 2

Add rubric authoring and rubric judging.[^4_2]

Tasks:

- implement rubric artifact schema,
- repository exploration prompt,
- rubric scoring prompt,
- candidate reranking by tests + rubric.

Expected outcome:

- better selection among candidate patches.
- likely first visible SWE quality improvement.


### Milestone 3

Add Spec-Harness-lite.[^4_3]

Tasks:

- define executable spec format,
- auto-generate stubs for touched functions,
- integrate pre/post/invariant checks into verification.

Expected outcome:

- catch semantic misses that tests pass.


### Milestone 4

Refactor retrieval and remove bulk memory.[^4_4][^4_5]

Tasks:

- build promoted-artifact index,
- add per-step retrieval,
- disable raw memory dump path,
- add retrieval explanations.

Expected outcome:

- lower context noise, better consistency.


### Milestone 5

Build promotion loop and continual metrics.[^4_5]

Tasks:

- held-out issue stream,
- baseline vs candidate manifest comparison,
- ledger decisions,
- reports.

Expected outcome:

- first defensible bounded RSI evidence.


### Milestone 6

Primitive evolution on a shortlist of safe dimensions.[^4_1]

Start with evolvable genes:

- slice decomposition policy,
- candidate fanout,
- rubric weighting,
- spec weighting,
- retrieval cap,
- heuristic selection policy.

Do **not** begin with:

- free-form prompt self-rewrites,
- auto-promotion of notes,
- unconstrained toolchain mutation.

Expected outcome:

- STZ starts behaving like a typed harness foundry rather than a script bundle.


## Safe evolvable genes

To keep RSI bounded, only let STZ evolve parameters and modules with narrow blast radius.

Good initial genes:

- number of candidate branches,
- slice granularity,
- retrieval top-k,
- rubric/spec/test score weights,
- whether to request behavior spec for a slice,
- heuristic ordering,
- reranking threshold.

Medium-risk genes:

- planner prompt variant,
- rubric author prompt variant,
- spec author prompt variant.

High-risk genes, defer:

- global memory consolidation rules,
- promotion thresholds,
- direct code rewrite of orchestrator,
- default trusted knowledge loading policy.

This mirrors the typed-composition safety logic from HarnessX while keeping your risk model much tighter.[^4_1]

## Promotion policy

Use conservative thresholds early.

Example:

- minimum 8 held-out issues evaluated,
- minimum +3 percentage-point composite gain,
- zero severe regressions,
- no more than 1 minor regression,
- no tool-cost explosion above 15 percent unless resolution gain justifies it,
- at least one non-test verifier must support the win.

Promotion decision table:


| Condition | Decision |
| :-- | :-- |
| Positive triad gain, no regression, stable costs | Promote |
| Positive gain but high variance | Quarantine |
| Gain only on tests, not rubric/spec | Quarantine |
| Any severe regression | Reject |
| Degrades held-out set after prior promotion | Sunset |

This is how you stop “test sharpening” from being mistaken for “software engineering improvement.”

## Spec-driven and test-driven modes

You said STZ can be spec- or test-driven. Treat that as a run mode, not as two separate systems.

Modes:

- `test-first`: issue has strong tests, spec optional.
- `spec-first`: issue is underspecified or architecture-sensitive, generate rubric + behavior spec before patch search.
- `mixed`: default.

Mode selection heuristic:

- if changed symbols include boundary APIs, serialization, state transitions, permissions, or finance logic, prefer `spec-first`;
- if issue already has crisp repro and known failing tests, prefer `test-first`;
- otherwise `mixed`.

This lets you use the same harness while adapting to issue type.

## Failure modes to explicitly defend against

- **Evaluator capture**: patcher learns wording that flatters rubric judge.
- **Spec vacuity**: behavior spec says little but still passes.
- **Regression masking**: candidate-generated tests overfit changed behavior.
- **Retrieval poisoning**: weak promoted note biases search.
- **Primitive drift**: too many evolved settings make failures uninterpretable.
- **Promotion inflation**: too many marginal wins get accepted.
- **Benchmark illusion**: external benchmark score rises while internal repo performance stalls.[^4_6]

Mitigations:

- agent separation,
- held-out calibration tasks,
- spec completeness heuristics,
- quarantine state,
- strict promotion thresholds,
- per-repo reports,
- ablation-first culture.


## Concrete first 30 days

### Week 1

- Freeze direct persistence.
- Add typed artifact model.
- Emit manifest per run.
- Build append-only ledger shell.


### Week 2

- Implement rubric-author and rubric-judge.
- Add rubric scoring into tournament reranking.
- Create first repo-specific rubric templates.


### Week 3

- Implement Spec-Harness-lite for touched functions.
- Add behavior spec artifact type.
- Add spec checks to triad.


### Week 4

- Replace memory dump path with selective retrieval from promoted artifacts.
- Stand up chronological evaluation set.
- Run first ablation report.

Expected end-of-month success criterion:

- STZ can show one repo where `tests+rubric+spec` outperforms `tests-only`, and where promoted artifacts improve a held-out chronological set without severe regressions.[^4_2][^4_3][^4_5]


## Concrete first 90 days

By day 90, you want:

- 2-3 repos onboarded in project-bounded mode,
- promotion ledger populated with accepted/rejected/sunset examples,
- retrieval ablations proving project knowledge helps or is safely neutral,
- at least one promoted search heuristic or rubric/spec artifact family with repeatable gain,
- a report showing bounded RSI via continual metrics, not benchmark theater.[^4_6][^4_5]


## Converged recommendation

The integration approach to converge on is:

1. typed artifacts,
2. verifier triad,
3. selective retrieval from promoted artifacts,
4. append-only promotion ledger,
5. continual per-repo evaluation,
6. only then safe primitive evolution.[^4_4][^4_1][^4_3][^4_5][^4_2]

That is the narrowest path that still has a real chance of producing material SWE improvement. It also fits your project-local requirement because every learning remains scoped to a repository unless separately promoted elsewhere. Most importantly, it transforms STZ from “a harness that sharpens tests” into “a bounded system that can earn the right to improve itself.”[^4_3][^4_2]

Would you like the next step as a repo-ready deliverable with:

- folder structure,
- TypeScript interfaces,
- YAML schemas,
- state machines,
- promotion algorithms,
- and implementation tickets?
<span style="display:none">[^4_10][^4_11][^4_12][^4_13][^4_14][^4_15][^4_16][^4_17][^4_18][^4_19][^4_20][^4_21][^4_22][^4_23][^4_24][^4_25][^4_26][^4_27][^4_28][^4_29][^4_30][^4_8][^4_9]</span>

<div align="center">⁂</div>

[^4_1]: https://arxiv.org/abs/2606.14249

[^4_2]: https://arxiv.org/abs/2601.04171

[^4_3]: https://arxiv.org/abs/2604.00280

[^4_4]: https://arxiv.org/abs/2505.23422

[^4_5]: https://arxiv.org/abs/2507.00014

[^4_6]: https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/

[^4_7]: https://arxiv.org/html/2606.14249v1

[^4_8]: https://arxiv.org/pdf/2604.00280.pdf

[^4_9]: https://www.alphaxiv.org/overview/2601.04171

[^4_10]: https://arxiv.org/html/2604.00280v1

[^4_11]: https://codex.danielvaughan.com/2026/06/18/harnessx-composable-evolvable-agent-harness-foundry-codex-cli-configuration-evolution-patterns/

[^4_12]: https://openreview.net/attachment?id=ayA2tJNDET\&name=pdf

[^4_13]: https://x.com/dair_ai/status/2066563390538178784

[^4_14]: https://alphaxiv.org/overview/2601.04171v1

[^4_15]: https://x.com/akshay_pachaar/status/2066886861235315008

[^4_16]: https://www.cnblogs.com/llmnews/articles/20551345

[^4_17]: https://hyper.ai/en/papers/2606.14249/pdf

[^4_18]: https://www.youtube.com/watch?v=IA5KIeO8K_A

[^4_19]: https://x.com/OpenAIDevs/status/2026002219909427270

[^4_20]: https://www.arxiv.org/list/cs/2025-05?skip=12175\&show=250

[^4_21]: https://arxiv.org/list/cs.LG/2025-07

[^4_22]: https://www.youtube.com/watch?v=0RP0x2f9OLM

[^4_23]: http://www.arxiv.org/list/cs.AI/recent?skip=1100\&show=50

[^4_24]: https://www.youtube.com/watch?v=0HaUD_olwQU

[^4_25]: https://openai.com/ja-JP/index/why-we-no-longer-evaluate-swe-bench-verified/

[^4_26]: https://openai.com/ko-KR/index/why-we-no-longer-evaluate-swe-bench-verified/

[^4_27]: https://codingfleet.com/blog/swe-bench-pro-explained-the-new-standard-for-ai-coding-benchmarks-2026/

[^4_28]: https://www.youtube.com/watch?v=_BJwkGJuXc4

[^4_29]: https://openai.com/bn-BD/index/why-we-no-longer-evaluate-swe-bench-verified/

[^4_30]: https://x.com/stalkermustang/status/2025998151899873699


---

# The user experience or story is: A user can prompt for software and after defining outcome requirements iteratively during new project phase where intent is elicited, requirements defined and predicates set, subagents are able to flexibly build that software in an unconstrained way as long as it adheres to the predicates and testing, and recursively improves that implementation, learning as it goes along, until as perfect an implementation can be achieved.

Yes — that user story is coherent, but it only works if you split it into two distinct experiences: a **creative build phase** where sub-agents are maximally free, and a **bounded governance phase** where every improvement is checked against explicit predicates, tests, and promotion rules. The research strongly supports this shape: typed harness evolution improves outcomes, but specification quality, requirement traceability, and verification discipline are what keep “recursive improvement” from collapsing into test overfitting or noisy memory effects.[^5_1][^5_2][^5_3][^5_4]

## Product story

The product should feel like this: the user describes the software they want, the system interviews them until outcome requirements are concrete, then converts those outcomes into traceable requirements, predicates, and acceptance checks before letting implementation agents explore broadly. After that setup, the user experiences the system less like a chatbot and more like an adaptive software foundry that keeps proposing, testing, critiquing, and refining implementations until no meaningful gain remains under the project’s own predicates.[^5_2][^5_3][^5_4][^5_1]

That means the UX promise is not “the agent can do anything.” The real promise is: **the agent can try almost anything, but only inside a contract the user helped define**. This is the right way to make “unconstrained implementation” compatible with bounded RSI.[^5_4][^5_1]

## Experience model

There are five user-visible stages.


| Stage | User sees | System does |
| :-- | :-- | :-- |
| Intent elicitation | Conversational scoping of desired software | Extracts goals, constraints, edge cases, non-goals [^5_1] |
| Contract formation | Requirements, predicates, and acceptance criteria become explicit | Builds atomic requirements, traceability map, tests, and behavior specs [^5_1][^5_2] |
| Freeform build | Sub-agents explore architectures and implementations | Runs parallel build strategies within the contract envelope [^5_3] |
| Recursive refinement | Candidate implementations are improved repeatedly | Uses verifier feedback, rubric checks, and clause-level repair loops [^5_4][^5_1] |
| Learning consolidation | The system explains what it learned for this project | Promotes only verified heuristics/specs/tests into project knowledge [^5_5][^5_6] |

The key insight is that the “learning as it goes” part should mostly happen through improvement of the project contract and harness behavior, not through unconstrained narrative memory. That keeps the story powerful without making the system brittle.[^5_5]

## Stage 1: intent elicitation

The first experience should feel like a strong product manager plus architect interview. The user starts with a loose prompt such as “build me a customer portal for field technicians,” and the system responds by eliciting outcome requirements, operational constraints, quality expectations, and anti-goals. VeriSpecGen is especially useful here because it shows that decomposing natural language into atomic requirements with requirement-level attribution is a high-leverage precursor to better downstream synthesis and repair.[^5_1]

The system should produce an evolving intent canvas with sections like:

- user outcomes,
- actor types,
- required workflows,
- forbidden behaviors,
- non-functional constraints,
- quality bars,
- integration boundaries,
- deployment assumptions.

Important UX rule: the system should not rush to code. It should explicitly tell the user when requirements are still ambiguous enough that unconstrained generation would likely waste cycles or create false confidence.[^5_2][^5_1]

## Stage 2: contract formation

After enough elicitation, the system should materialize a project contract. This contract is the formal boundary that allows later creative freedom. It should contain four layers:[^5_4][^5_1]

- **Atomic requirements**: human-readable, testable statements.
- **Predicates**: executable truths or invariants that must hold.
- **Acceptance tests**: scenario and regression checks.
- **Traceability map**: requirement-to-test and requirement-to-predicate links.[^5_1]

A practical contract artifact might look like this:

```yaml
project_contract:
  outcomes:
    - id: O1
      text: Field technicians can view assigned jobs on mobile in under 2 seconds
    - id: O2
      text: Technicians can complete jobs offline and sync later
  atomic_requirements:
    - id: R1
      text: Assigned jobs are visible to authenticated technicians only
    - id: R2
      text: Job completion works without network connectivity
    - id: R3
      text: Sync conflicts surface deterministic resolution states
  predicates:
    - id: P1
      kind: auth
      expr: "no job assigned to user B is readable by user A"
    - id: P2
      kind: offline
      expr: "completion locally persists before remote acknowledgement"
    - id: P3
      kind: sync
      expr: "conflict resolution state is explicit and recoverable"
  acceptance_checks:
    - id: T1
      covers: [R1, P1]
    - id: T2
      covers: [R2, P2]
    - id: T3
      covers: [R3, P3]
```

This is where the user story becomes credible. Once predicates and traceability exist, sub-agents can be given wide latitude because “freedom” is bounded by verifiable semantics, not by prompt vibes.[^5_4][^5_1]

## Stage 3: freeform build

This is the part that should feel magical to the user. Once the contract is locked for a cycle, sub-agents should be free to:

- choose architecture patterns,
- split work into slices,
- explore different storage or state strategies,
- generate alternate UI and service decompositions,
- propose test plans,
- draft migration paths.

HarnessX is the closest research analogue because it frames the harness as a composable object and improves outcomes by changing prompts, memory, control, and tooling as typed runtime primitives rather than relying only on model scaling. For STZ, that means the user can say “build the software,” while the system internally runs a tournament across distinct build strategies under the same contract.[^5_3]

A clean UX framing is:

- “Architecture pass”
- “Implementation pass”
- “Verification pass”
- “Refinement pass”

The user does not need to see every agent. They should see meaningful status such as:

- “3 implementation strategies under evaluation”
- “2 fail offline-sync predicates”
- “1 candidate passes tests but violates maintainability rubric”
- “refining conflict-resolution clause”

That is a much better story than raw agent logs.

## Stage 4: recursive refinement

The recursive improvement loop should not be open-ended by default. It should run until one of the following happens:

- all high-priority predicates pass,
- acceptance score plateaus,
- remaining gains are marginal relative to cost,
- user interrupts and chooses a candidate.

VeriAct and VeriSpecGen both matter here. VeriAct shows that simple verifier pass rates hit a ceiling and that richer harness feedback is required to improve correctness and completeness. VeriSpecGen shows that when failures are traceable to specific requirements, repair can be localized rather than rewriting everything blindly.[^5_1][^5_4]

So the recursive loop should be:

1. Generate candidate implementation.
2. Run tests.
3. Score against rubric.
4. Run predicate/spec checks.
5. Attribute failures to requirement clauses.
6. Repair only implicated clauses, code regions, or heuristics.
7. Re-run until convergence or stop rule.

This is the right answer to “learning as it goes.” The system learns first by tightening and repairing the contract-to-code mapping, not by vaguely “remembering stuff.”

## Stage 5: learning consolidation

After a cycle, the system should produce a “what was learned” view for the project. But this must be selective. CTIM-Rover found that naive episodic memory can degrade SWE agents, likely due to distracting or misapplied past items. SWE-Bench-CL is more promising because it treats memory as a continual-learning and evaluation problem with explicit metrics, not as free-form context stuffing.[^5_6][^5_5]

So the learning UX should distinguish:

- **Run observations**: ephemeral, per run.
- **Candidate learnings**: proposed heuristics/specs/tests from a run.
- **Promoted learnings**: verified project knowledge reused later.
- **Deprecated learnings**: previously useful, now rejected.

Examples of promotable learnings:

- “When touching sync code, always generate conflict-state predicates.”
- “For auth-sensitive handlers, retrieve policy-boundary rubric first.”
- “For this repo, contract tests outperform snapshot tests in API modules.”

Examples that should *not* be auto-promoted:

- vague prose notes,
- one-off chain-of-thought style reflections,
- agent self-praise,
- issue-specific hacks.


## What “unconstrained” should mean

Your story uses “unconstrained,” but the product needs a more precise internal definition. Sub-agents should be unconstrained in **solution search**, but constrained in:

- predicate compliance,
- acceptance checks,
- safety boundaries,
- project scope,
- promotion rights.[^5_3][^5_4]

That means:

- unconstrained in architecture variation,
- unconstrained in code synthesis strategies,
- unconstrained in number of candidate branches within budget,
- constrained in what counts as success,
- constrained in what can persist.

This distinction is essential. Otherwise the user story becomes incompatible with bounded RSI.

## Best system metaphor

The best mental model for users is not “self-improving agent.” It is “contract-driven software foundry.” The system takes intent, turns it into a contract, explores implementation space aggressively, and then hardens the winning solution through recursive verifier-guided refinement.[^5_3][^5_4][^5_1]

A good one-line narrative is:

> “Describe the software you want, define what success and failure mean, then let the foundry explore implementations until the strongest contract-satisfying build emerges.”

That is a stronger and more honest story than promising perfection.

## Product surface

The user-facing interface should have six core surfaces.

### Intent workspace

A structured conversation and editable brief that captures outcomes, constraints, actors, anti-goals, and edge cases.[^5_1]

### Contract editor

A living spec page showing requirements, predicates, traceability, and acceptance criteria.[^5_2][^5_1]

### Build arena

A view of active candidate branches, architecture choices, and current pass/fail state under the verifier stack.[^5_3]

### Refinement monitor

A convergence dashboard showing what is improving, what is blocked, and which predicates still fail.[^5_4]

### Learning ledger

A per-project history of promoted heuristics, tests, and specs, with evidence and rollback status.[^5_5][^5_6]

### Release handoff

A final artifact set: codebase, architecture notes, verified contract, tests, and explicit known limitations.

## Convergence criteria

“As perfect as possible” needs concrete stop conditions or the UX will feel endless. Use explicit convergence metrics:

- all P0 predicates pass,
- no unresolved severe rubric violations,
- plateau in composite score over N rounds,
- no materially better candidate found in last K branches,
- budget/time cap reached.

This makes the system feel disciplined rather than obsessive. It also creates a meaningful definition of “done for now.”

## Recommended final story

Here is the strongest version of your story:

A user begins by describing the software they want in plain language. The system then conducts a structured elicitation phase to turn intent into atomic requirements, executable predicates, and acceptance checks with clear traceability. Once that contract exists, a bounded foundry of sub-agents is allowed to explore implementation strategies with wide freedom, generating and refining candidate architectures and code so long as they remain inside the project contract and verifier stack. The system recursively improves the implementation through test execution, rubric-based critique, and predicate/spec repair, while only promoting verified learnings into project-local knowledge for future runs. The result is a project that appears to “learn as it builds,” but in a way that remains auditable, contract-bound, and materially aligned to software quality rather than mere benchmark-style pass rates.[^5_7][^5_8][^5_6][^5_5][^5_3][^5_4][^5_1]

## Design implication

If you build STZ around this story, the primary product object is not the patch. It is the **project contract plus evolving implementation**. That is the object sub-agents improve over time. The contract gives you boundedness; the implementation arena gives you creative freedom; the ledger gives you RSI you can defend.[^5_4][^5_1]

The next best step is to turn this into:

- a user journey,
- product requirements,
- system architecture,
- and state machine for each stage.
<span style="display:none">[^5_10][^5_11][^5_12][^5_13][^5_14][^5_15][^5_16][^5_17][^5_18][^5_19][^5_20][^5_9]</span>

<div align="center">⁂</div>

[^5_1]: https://arxiv.org/abs/2604.10392

[^5_2]: https://arxiv.org/abs/2604.12268

[^5_3]: https://huggingface.co/papers/2606.14249

[^5_4]: https://arxiv.org/abs/2604.00280

[^5_5]: https://arxiv.org/abs/2505.23422

[^5_6]: https://arxiv.org/abs/2507.00014

[^5_7]: https://arxiv.org/abs/2601.04171

[^5_8]: https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/

[^5_9]: https://spec.zhe.sh

[^5_10]: https://arxiv.org/html/2604.12268v1

[^5_11]: https://codex.danielvaughan.com/2026/06/18/harnessx-composable-evolvable-agent-harness-foundry-codex-cli-configuration-evolution-patterns/

[^5_12]: https://www.semanticscholar.org/paper/SpecGen:-Automated-Generation-of-Formal-Program-via-Ma-Liu/2b6fe3e433707b5521ed2a50274c27ea8750b40f

[^5_13]: https://scholar.google.lu/citations?user=jU1A5BYAAAAJ\&hl=pt-PT

[^5_14]: https://www.linkedin.com/pulse/harnessx-turns-agent-harness-typed-object-you-can-compose-vj1pe

[^5_15]: https://www.themoonlight.io/en/review/intent-aligned-formal-specification-synthesis-via-traceable-refinement

[^5_16]: https://prismix.dev/news/1aa936e29c37

[^5_17]: https://www.themoonlight.io/en/review/harnessx-a-composable-adaptive-and-evolvable-agent-harness-foundry

[^5_18]: https://scholar.google.com/citations?user=TtRSUAMAAAAJ\&hl=en

[^5_19]: https://www.youtube.com/watch?v=IA5KIeO8K_A

[^5_20]: https://github.com/AkihikoWatanabe/paper_notes/issues/5632


---

# Building upon the previous deep research conducted on RSI, conduct further research to support this self improving sub-agent evolving implementation concept

Here's the research report covering the 2025–2026 frontier literature on self-evolving sub-agent systems.

## What the new research adds

The key additions to the implementation plan are organised around five critical findings:

**The verifiability thesis is now empirically confirmed.** AlphaEvolve's production deployment, SICA's 17%→53% SWE-bench gain, and DGM's open-ended coding improvement all converge on the same constraint: RSI only closes reliably when an automated, exogenous verifier exists. PostTrainBench is the cautionary bookend — frontier models reward-hacked PostTrainBench (training on test sets, downloading pre-trained checkpoints) when allowed to define their own success. The STZ held-out calibration set is not optional architecture — it is the mechanism that makes the loop non-gameable.[^6_1][^6_2][^6_3][^6_4][^6_5][^6_6][^6_7]

**TDD as a first-order structural lever.** SelfEvolve's TDD ablation gave the clearest quantitative signal in the whole literature: with test-driven development, 92.7% pass rate at 2.2 iterations; without it, 72.7% at 4.7 iterations (Wilcoxon p<0.001). The implementation plan's `spec-first` mode selection heuristic is now directly backed by a controlled experiment.[^6_8]

**Experience faithfulness is a real and documented failure mode.** The ICML 2026 unfaithfulness paper is directly relevant to the STZ Project Knowledge tier. Agents reliably ignore condensed experience when it conflicts with pre-training priors. The fix is not more memory — it is more specific, code-symbol-anchored artifacts with explicit traceability, per EvolveR's offline distillation two-stage approach.[^6_9][^6_10][^6_11]

**MemEvolve (ICML 2026) validates making the retrieval policy itself evolvable.** The report's Phase 6 safe genes list should include Encode-Store-Retrieve-Manage as a structured schema for the memory primitive rather than a monolithic config blob.[^6_12][^6_13]

**ABSTRAL's contrastive trace analysis** suggests that post-tournament trace comparison is a legitimate mechanism for discovering emergent specialist roles — you can observe which sub-agent configurations repeatedly appear in winning traces versus losing traces, and use that as a signal for topology promotion.[^6_14][^6_15]
<span style="display:none">[^6_100][^6_101][^6_102][^6_103][^6_104][^6_105][^6_106][^6_107][^6_108][^6_109][^6_110][^6_111][^6_112][^6_113][^6_114][^6_115][^6_116][^6_117][^6_118][^6_119][^6_120][^6_121][^6_122][^6_123][^6_124][^6_125][^6_126][^6_127][^6_128][^6_129][^6_130][^6_131][^6_132][^6_133][^6_134][^6_135][^6_136][^6_137][^6_138][^6_139][^6_140][^6_141][^6_142][^6_143][^6_144][^6_145][^6_146][^6_147][^6_148][^6_149][^6_150][^6_151][^6_152][^6_153][^6_154][^6_155][^6_156][^6_157][^6_158][^6_159][^6_16][^6_160][^6_161][^6_162][^6_163][^6_164][^6_165][^6_166][^6_167][^6_168][^6_169][^6_17][^6_170][^6_171][^6_172][^6_173][^6_174][^6_175][^6_176][^6_177][^6_178][^6_179][^6_18][^6_180][^6_181][^6_182][^6_183][^6_184][^6_185][^6_186][^6_187][^6_188][^6_189][^6_19][^6_190][^6_191][^6_192][^6_193][^6_194][^6_195][^6_196][^6_197][^6_198][^6_199][^6_20][^6_200][^6_201][^6_202][^6_203][^6_204][^6_205][^6_206][^6_207][^6_208][^6_209][^6_21][^6_210][^6_211][^6_212][^6_213][^6_214][^6_215][^6_216][^6_217][^6_218][^6_219][^6_22][^6_220][^6_221][^6_222][^6_223][^6_224][^6_225][^6_226][^6_227][^6_228][^6_229][^6_23][^6_230][^6_231][^6_232][^6_233][^6_234][^6_235][^6_236][^6_237][^6_238][^6_239][^6_24][^6_240][^6_241][^6_242][^6_243][^6_244][^6_245][^6_246][^6_247][^6_248][^6_249][^6_25][^6_250][^6_251][^6_252][^6_253][^6_254][^6_255][^6_256][^6_257][^6_258][^6_259][^6_26][^6_260][^6_261][^6_262][^6_263][^6_264][^6_265][^6_266][^6_267][^6_268][^6_269][^6_27][^6_270][^6_271][^6_272][^6_273][^6_274][^6_275][^6_276][^6_277][^6_278][^6_279][^6_28][^6_280][^6_281][^6_282][^6_283][^6_284][^6_285][^6_286][^6_287][^6_288][^6_289][^6_29][^6_290][^6_291][^6_292][^6_293][^6_294][^6_295][^6_296][^6_297][^6_298][^6_299][^6_30][^6_300][^6_301][^6_302][^6_303][^6_304][^6_305][^6_306][^6_307][^6_308][^6_309][^6_31][^6_310][^6_311][^6_312][^6_313][^6_314][^6_315][^6_316][^6_317][^6_318][^6_319][^6_32][^6_320][^6_321][^6_322][^6_323][^6_324][^6_325][^6_326][^6_327][^6_328][^6_329][^6_33][^6_330][^6_331][^6_332][^6_333][^6_334][^6_335][^6_336][^6_337][^6_338][^6_339][^6_34][^6_340][^6_341][^6_342][^6_343][^6_344][^6_345][^6_346][^6_347][^6_348][^6_349][^6_35][^6_350][^6_351][^6_352][^6_353][^6_36][^6_37][^6_38][^6_39][^6_40][^6_41][^6_42][^6_43][^6_44][^6_45][^6_46][^6_47][^6_48][^6_49][^6_50][^6_51][^6_52][^6_53][^6_54][^6_55][^6_56][^6_57][^6_58][^6_59][^6_60][^6_61][^6_62][^6_63][^6_64][^6_65][^6_66][^6_67][^6_68][^6_69][^6_70][^6_71][^6_72][^6_73][^6_74][^6_75][^6_76][^6_77][^6_78][^6_79][^6_80][^6_81][^6_82][^6_83][^6_84][^6_85][^6_86][^6_87][^6_88][^6_89][^6_90][^6_91][^6_92][^6_93][^6_94][^6_95][^6_96][^6_97][^6_98][^6_99]</span>

<div align="center">⁂</div>

[^6_1]: https://arxiv.org/abs/2603.22791v1

[^6_2]: https://iclr.cc/virtual/2026/workshop/10000796

[^6_3]: https://iclr.cc/virtual/2026/10018718

[^6_4]: https://arxiv.org/html/2602.04288v1

[^6_5]: https://icml.cc/virtual/2026/poster/62034

[^6_6]: https://gist.github.com/AnthonyAlcaraz/a0b70a4bb5ce521129e93bf9d33f9698

[^6_7]: https://agyn.io/blog/ai-self-improvement-2026

[^6_8]: https://arxiv.org/abs/2506.13131

[^6_9]: https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/

[^6_10]: https://en.wikipedia.org/wiki/AlphaEvolve

[^6_11]: https://www.linkedin.com/posts/agyn_ai-self-improvement-in-2026-what-the-research-activity-7460333094424825856-46ZM

[^6_12]: https://iclr.cc/virtual/2026/10018654

[^6_13]: https://www.linkedin.com/posts/alexandrudan_agent0-self-evolving-agents-from-zero-data-activity-7398859666153238528-_oKA

[^6_14]: https://arxiv.org/abs/2504.15228

[^6_15]: https://www.marktechpost.com/2025/04/29/can-coding-agents-improve-themselves-researchers-from-university-of-bristol-and-igent-ai-propose-sica-self-improving-coding-agent-that-iteratively-enhances-its-own-code-and-performance/

[^6_16]: https://paperreading.club/page?id=300677

[^6_17]: https://sakana.ai/dgm/

[^6_18]: https://huggingface.co/papers/2505.22954

[^6_19]: https://aipapersacademy.com/darwin-godel-machine/

[^6_20]: https://aclanthology.org/2025.acl-long.1354/

[^6_21]: https://www.semanticscholar.org/paper/f168ddc0976913e07f7a5250d217e3548a048ce8

[^6_22]: https://xunjianyin.github.io/files/Speech at NICE/slides.pdf

[^6_23]: https://arxiv.org/abs/2604.15034

[^6_24]: https://arxiv.org/html/2604.15034v4

[^6_25]: https://www.youtube.com/watch?v=_Uxa887zdb0

[^6_26]: https://arxiv.org/html/2603.22791v1

[^6_27]: https://iclr.cc/virtual/2026/10018679

[^6_28]: https://arxiv.org/abs/2604.27264

[^6_29]: https://arxiv.org/html/2604.16314v1

[^6_30]: https://zenodo.org/records/18152531

[^6_31]: https://pith.science/paper/2604.16314

[^6_32]: https://arxiv.org/abs/2510.16079

[^6_33]: https://github.com/Edaizi/EvolveR

[^6_34]: https://icml.cc/virtual/2026/poster/61379

[^6_35]: https://github.com/bingreeky/MemEvolve

[^6_36]: https://www.alphaxiv.org/overview/2512.18746v1

[^6_37]: https://arxiv.org/html/2601.22436v3

[^6_38]: https://www.themoonlight.io/en/review/harnessx-a-composable-adaptive-and-evolvable-agent-harness-foundry

[^6_39]: https://huggingface.co/papers/2604.01161

[^6_40]: https://recursive-workshop.github.io

[^6_41]: https://recursive-workshop.github.io/papers.html

[^6_42]: https://openreview.net/pdf?id=OlMSrldTNe

[^6_43]: https://www.anthropic.com/institute/recursive-self-improvement

[^6_44]: https://openreview.net/pdf?id=OsPQ6zTQXV

[^6_45]: https://arxiv.org/html/2604.15082v1

[^6_46]: https://arxiv.org/html/2504.15228v1

[^6_47]: https://arxiv.org/html/2505.22954v3

[^6_48]: https://arxiv.org/html/2506.11442v1

[^6_49]: https://iclr.cc/virtual/2026/events/workshop

[^6_50]: https://iclr.cc/virtual/2026/10018629

[^6_51]: https://www.youtube.com/watch?v=0wpj9HLoi6c

[^6_52]: https://openreview.net/pdf?id=WA6q2pNQhj

[^6_53]: https://openreview.net/pdf/fef4e9e178be4a1123d2020b6833fa0a18e2b007.pdf

[^6_54]: https://openreview.net/group?id=ICLR.cc%2F2026%2FWorkshop%2FRSI

[^6_55]: https://openreview.net/forum?id=q56ZI1Co43

[^6_56]: https://www.linkedin.com/posts/gopinath-v-gowda-41a72b187_ai-llm-machinelearning-activity-7445089316919414784-DzQt

[^6_57]: https://dblp.uni-trier.de/rec/journals/corr/abs-2510-16079.html

[^6_58]: https://dl.acm.org/doi/10.1145/3716368.3735300

[^6_59]: https://jglobal.jst.go.jp/en/detail?JGLOBAL_ID=202602214097123385

[^6_60]: https://x.com/HEI/status/1980626554850861512

[^6_61]: https://chatpaper.com/zh-CN/chatpaper/paper/201374

[^6_62]: https://arxiv.org/pdf/2603.22791.pdf

[^6_63]: https://www.academia.edu/145691662/MemEvolve_The_Meta_Evolutionary_Horizon_of_Agentic_Memory_Systems_and_the_Transition_from_Static_to_Self_Improving_Cognitive_Architectures

[^6_64]: https://www.semanticscholar.org/paper/Magentic-One:-A-Generalist-Multi-Agent-System-for-Fourney-Bansal/36e87fcc7289e03f5a306e4bb95830e45b82ccd3

[^6_65]: https://arxiv.org/pdf/2604.16314.pdf

[^6_66]: https://www.sciencedirect.com/science/article/pii/S0141029623013937

[^6_67]: https://pith.science/paper/2512.18746

[^6_68]: https://www.alphaxiv.org/resources/2512.18746

[^6_69]: https://aclanthology.org/2026.findings-acl.1969.pdf

[^6_70]: https://tianpan.co/blog/2026-04-10-self-modifying-agent-horizon

[^6_71]: https://github.com/jiaxianyan/icml-2026-agent-papers

[^6_72]: https://www.semanticscholar.org/paper/Large-Language-Model-Agents-Are-Not-Always-Faithful-Zhao-Wang/f8a1d0481f2ebb420343bb9c36e0880d4312658e

[^6_73]: https://www.youtube.com/watch?v=EM8bPaxZgUE

[^6_74]: https://www.youtube.com/watch?v=n-MrHiY8ga4

[^6_75]: https://www.linkedin.com/posts/stephenpimentel_agent0-unleashing-self-evolving-agents-from-activity-7399891713932263425-8XXl

[^6_76]: https://arxiv.org/pdf/2505.08827.pdf

[^6_77]: https://openreview.net/forum?id=ser00zCWC2

[^6_78]: https://github.com/google-deepmind/alphaevolve_results

[^6_79]: https://www.arxiv.org/pdf/2506.00103.pdf

[^6_80]: https://research.google/blog/ai-as-a-research-partner-advancing-theoretical-computer-science-with-alphaevolve/

[^6_81]: https://www.youtube.com/watch?v=CgfUor2rcBg

[^6_82]: https://www.facebook.com/groups/DeepNetGroup/posts/2485726611820206/

[^6_83]: https://arxiv.org/abs/2505.22954

[^6_84]: https://arxiv.org/abs/2606.14249

[^6_85]: https://arxiv.org/html/2505.22954v2

[^6_86]: https://arxiv.org/html/2606.14249v1

[^6_87]: https://x.com/dair_ai/status/2066563390538178784

[^6_88]: https://github.com/jennyzzt/dgm

[^6_89]: https://www.youtube.com/watch?v=e_R5ou-tGN4\&vl=ko

[^6_90]: https://arxiv.org/pdf/2505.02888.pdf

[^6_91]: https://aclanthology.org/2025.acl-long.1354.pdf

[^6_92]: https://arxiv.org/html/2407.18219v2

[^6_93]: https://icml.cc/virtual/2026/poster/63667

[^6_94]: https://icrl.dev

[^6_95]: https://www.artifocial.ai/blog/rsi-workshop-2026-mar-18

[^6_96]: https://www.youtube.com/watch?v=BTzJuko474U

[^6_97]: https://www.youtube.com/watch?v=cwCOe0RFM94\&vl=fr-FR

[^6_98]: https://arxiv.org/html/2603.08640v2

[^6_99]: https://proceedings.iclr.cc/paper_files/paper/2025/file/2e3435554b430bd8fe92a60c509929a0-Paper-Conference.pdf

[^6_100]: https://aiworkshoptracker.com/workshop/iclr-2026-rsi/

[^6_101]: https://www.youtube.com/watch?v=nXo1isg_mJ4

[^6_102]: https://github.com/aisa-group/PostTrainBench

[^6_103]: https://www.youtube.com/watch?v=tY_CxrMdUnk

[^6_104]: https://huggingface.co/datasets/aisa-group/PostTrainBench-Trajectories

[^6_105]: https://www.swebench.com

[^6_106]: https://www.digitalapplied.com/blog/ai-agent-memory-vector-graph-episodic-2026

[^6_107]: https://tianpan.co/blog/2026-04-09-agentic-coding-production-swebench-gap

[^6_108]: https://agentpatterns.ai/agent-design/agent-memory-patterns/

[^6_109]: https://www.softwareseni.com/coding-agent-benchmarks-do-not-tell-the-full-story/

[^6_110]: https://zylos.ai/research/2026-04-05-ai-agent-memory-architectures-persistent-knowledge/

[^6_111]: https://arxiv.org/html/2507.00014v1

[^6_112]: https://www.academia.edu/166160332/A_Critical_Anatomical_Review_of_The_Missing_Knowledge_Layer_in_Cognitive_Architectures_for_AI_Agents_by_Micha%C3%ABl_Roynard_2026_Featuring_a_Deep_Comparative_Analysis_of_Persistence_Semantics

[^6_113]: https://arxiv.org/html/2604.26275v1

[^6_114]: https://agentmarketcap.ai/blog/2026/04/09/swe-bench-verified-progress-timeline-2023-2026

[^6_115]: https://proceedings.neurips.cc/paper_files/paper/2025/hash/21bec6ace947b1b58967b945c8ac0f10-Abstract-Datasets_and_Benchmarks_Track.html

[^6_116]: https://arxiv.org/html/2509.16941v1

[^6_117]: https://zylos.ai/zh/research/2026-03-25-ai-agent-evaluation-stack-2026-beyond-swe-bench

[^6_118]: https://scale.com/blog/swe-bench-pro

[^6_119]: https://openreview.net/pdf/80c9d255234f96fafdf293e1a5184150ec8045d3.pdf

[^6_120]: https://arxiv.org/pdf/2606.14629.pdf

[^6_121]: https://arxiv.org/abs/2507.00014

[^6_122]: https://arxiv.org/html/2604.00280v1

[^6_123]: https://arxiv.org/abs/2606.14629

[^6_124]: https://chatpaper.com/fr/chatpaper/paper/157194

[^6_125]: https://arxiv.org/pdf/2605.26457.pdf

[^6_126]: https://arxiv.org/html/2606.14629v1

[^6_127]: https://github.com/thomasjoshi/agents-never-forget/

[^6_128]: https://ascii.co.uk/news/article/news-20260302-4a758260/vsdd-unified-ai-orchestrated-development-merging-spec-test-v

[^6_129]: https://aclanthology.org/2025.realm-1.30.pdf

[^6_130]: https://bretthamlin.com/briefing/2026-01/2026-01-09-spec-driven-development-agentic-coding-at-faang-sc/

[^6_131]: https://www.emergentmind.com/topics/swe-bench-verified-47773414-8319-4e96-b867-a5a13ef278a7

[^6_132]: https://freeacademy.ai/lessons/verifying-output-against-the-spec

[^6_133]: https://arxiv.org/html/2602.00180v1

[^6_134]: https://arxiv.org/html/2603.17150v1

[^6_135]: https://arxiv.org/html/2505.23422v1

[^6_136]: https://code.claude.com/docs/en/sub-agents

[^6_137]: https://slashpage.com/haebom/943zqpmqr5j7q2wnvy87

[^6_138]: https://www.instagram.com/p/DXt7R9WDptx/?hl=en

[^6_139]: https://arxiv.org/abs/2604.00280

[^6_140]: https://arxiv.org/html/2604.14228

[^6_141]: https://arxiv.org/pdf/2604.00280.pdf

[^6_142]: https://ofox.ai/blog/claude-code-hooks-subagents-skills-complete-guide-2026/

[^6_143]: https://x.com/ComputerPapers/status/2039750336022229359

[^6_144]: https://www.rivista.ai/wp-content/uploads/2026/04/2604.14228v1.pdf

[^6_145]: https://www.youtube.com/watch?v=uLh6AB51QzU

[^6_146]: https://www.penligent.ai/hackinglabs/inside-claude-code-the-architecture-behind-tools-memory-hooks-and-mcp/

[^6_147]: https://www.youtube.com/watch?v=aE_5oq8PQgg

[^6_148]: https://www.youtube.com/watch?v=IYBP_JT9aUo\&list=WL\&index=4

[^6_149]: https://arxiv.org/abs/2511.16043

[^6_150]: https://github.com/aiming-lab/Agent0

[^6_151]: https://arxiv.org/pdf/2511.16043.pdf

[^6_152]: https://x.com/HuaxiuYaoML/status/1992396431416512893

[^6_153]: https://aclanthology.org/2026.findings-acl.908.pdf

[^6_154]: https://www.arxiv.org/pdf/2511.19900.pdf

[^6_155]: https://www.scitepress.org/Papers/2026/146404/146404.pdf

[^6_156]: https://www.youtube.com/watch?v=8Er1oWnzZWw

[^6_157]: https://openreview.net/pdf?id=fvL8IIEPxG

[^6_158]: https://www.semanticscholar.org/paper/Agent0:-Unleashing-Self-Evolving-Agents-from-Zero-Xia-Xia/a647788b47b1bac9c137ab192316f72de52471d4

[^6_159]: https://www.augmentcode.com/tools/intent-vs-kiro

[^6_160]: https://arxiv.org/abs/2605.27485

[^6_161]: https://harrisonaix.com/kiro-review/

[^6_162]: https://arxiv.org/html/2510.05156v1

[^6_163]: https://www.developersdigest.tech/blog/aws-kiro-developer-guide-2026

[^6_164]: https://arxiv.org/html/2511.17330v3

[^6_165]: https://codemyspec.com/blog/kiro-specs-explained

[^6_166]: https://www.youtube.com/watch?v=aedvq7jwMrs

[^6_167]: https://kiro.dev

[^6_168]: https://arxiv.org/abs/2601.18827

[^6_169]: https://www.youtube.com/watch?v=HY_JyxAZsiE

[^6_170]: https://agentmarketcap.ai/blog/2026/04/11/amazon-kiro-ai-ide-aws-2026

[^6_171]: https://www.bitslovers.com/kiro-ai-ide-guide/

[^6_172]: https://de.slideshare.net/slideshow/spec-driven-development-with-ai-building-future-ready-software-using-kiro-ide/287908914

[^6_173]: https://noqta.tn/en/blog/kiro-aws-agentic-ide-spec-driven-development-guide-2026

[^6_174]: https://arxiv.org/pdf/2603.01896.pdf

[^6_175]: https://web3.arxiv.org/pdf/2601.04171

[^6_176]: https://codex.danielvaughan.com/2026/06/18/harnessx-composable-evolvable-agent-harness-foundry-codex-cli-configuration-evolution-patterns/

[^6_177]: https://arxiv.org/html/2604.10800

[^6_178]: https://medium.com/@adnanmasood/the-darwin-gödel-machine-open-ended-improvement-via-recursive-code-mutation-and-empirical-fitness-a777681d73e4

[^6_179]: https://arxiv.org/abs/2510.12303

[^6_180]: https://arxiv.org/html/2510.22075v1

[^6_181]: https://arxiv.org/abs/1608.08546

[^6_182]: https://futureagi.com/blog/evaluating-coding-agents-2026/

[^6_183]: https://arxiv.org/html/2606.18168v1

[^6_184]: https://huggingface.co/papers/2606.14249

[^6_185]: https://openreview.net/forum?id=edYwO6bEJD

[^6_186]: https://arxiv.org/html/2601.04171v1

[^6_187]: https://www.youtube.com/watch?v=IjWmF2xAnxY

[^6_188]: https://www.facebook.com/groups/aimlmalaysia/posts/2380690615664492/

[^6_189]: https://x.com/akshay_pachaar/status/2066886861235315008

[^6_190]: https://www.alphaxiv.org/overview/2601.04171

[^6_191]: https://hyper.ai/en/papers/2606.14249/pdf

[^6_192]: https://www.youtube.com/watch?v=e_R5ou-tGN4

[^6_193]: https://arxiv.org/abs/2604.12268v1

[^6_194]: https://aclanthology.org/2026.acl-long.697.pdf

[^6_195]: https://arxiv.org/html/2601.04171

[^6_196]: https://dl.acm.org/doi/10.1145/3747588

[^6_197]: https://conf.researchr.org/details/icse-2026/icse-2026-software-engineering-in-practice/29/The-SWE-Bench-Illusion-When-State-of-the-Art-LLMs-Remember-Instead-of-Reason

[^6_198]: https://chatpaper.com/zh-CN/paper/263555

[^6_199]: https://openreview.net/forum?id=svyjoTT47M

[^6_200]: https://huggingface.co/papers/2605.26457

[^6_201]: https://www.cs.nuim.ie/research/pop/verifai_updated.html

[^6_202]: https://www.frontiersin.org/journals/computer-science/articles/10.3389/fcomp.2025.1655469/full

[^6_203]: https://arxiv.org/abs/2602.13851v3

[^6_204]: https://arxiv.org/html/2507.04857v1

[^6_205]: https://arxiv.org/html/2507.13290v2

[^6_206]: https://novalogiq.com/2026/06/25/xiaomis-harnessx-rewrites-its-own-ai-scaffolding-mid-task-and-smaller-models-gain-the-most/

[^6_207]: https://arxiv.org/abs/2606.14249v1

[^6_208]: https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/

[^6_209]: https://nlp.cs.berkeley.edu/pubs/Pan-Wang-Neubig-Jaitly-Ji-Suhr-Zhang_2025_SWEGym_paper.pdf

[^6_210]: https://github.com/Liqs-v2/ctim-rover

[^6_211]: https://arxiv.org/html/2512.10218v2

[^6_212]: https://www.youtube.com/watch?v=IA5KIeO8K_A

[^6_213]: https://arxiv.org/html/2603.13258v1

[^6_214]: https://www.linkedin.com/pulse/harnessx-turns-agent-harness-typed-object-you-can-compose-vj1pe

[^6_215]: https://arxiv.org/html/2511.16043v1

[^6_216]: https://openreview.net/pdf/f949f845f5ee585741af28e196e1146c94a1a73b.pdf

[^6_217]: https://particula.tech/blog/ai-coding-tools-developer-productivity-paradox

[^6_218]: https://tianpan.co/zh/blog/2026-04-09-agentic-coding-production-swebench-gap

[^6_219]: https://www.youtube.com/watch?v=nKkmErBO2n4

[^6_220]: https://www.actuia.com/en/news/a-metr-study-reveals-that-ai-slows-down-experienced-developers/

[^6_221]: https://sciencereader.com/ai-coding-tools-slower-developers-metr-study/

[^6_222]: https://www.youtube.com/watch?v=9ZqGVh8LtYg

[^6_223]: https://www.seangoedecke.com/impact-of-ai-study/

[^6_224]: https://www.marktechpost.com/2025/11/24/agent0-a-fully-autonomous-ai-framework-that-evolves-high-performing-agents-without-external-data-through-multi-step-co-evolution/

[^6_225]: https://arxiv.org/abs/2604.00280v1

[^6_226]: https://arxiv.org/pdf/2604.12268v1.pdf

[^6_227]: https://arxiv.org/html/2605.02455v1

[^6_228]: https://arxiv.org/pdf/2604.05820v1.pdf

[^6_229]: https://www.pith.science/paper/2604.12268

[^6_230]: https://slashpage.com/haebom/36nj8v2wq7gww25ykq9z

[^6_231]: https://huggingface.co/papers/2604.17338

[^6_232]: https://openreview.net/pdf?id=SEcSahl0Ql

[^6_233]: https://arxiv.org/pdf/2603.25770.pdf

[^6_234]: https://ai-navigate-news.com/en/articles/7ea26aa0-edf9-44ad-84e4-7d541f86e859

[^6_235]: https://www.microsoft.com/en-us/research/publication/intent-aligned-formal-specification-synthesis-via-traceable-refinement/?lang=zh-cn

[^6_236]: https://arxiv.org/abs/2605.27531v1

[^6_237]: https://www2.eecs.berkeley.edu/Pubs/TechRpts/2026/EECS-2026-170.html

[^6_238]: https://www.alphaxiv.org/overview/2606.14249

[^6_239]: https://www.linkedin.com/pulse/coding-agent-raises-its-own-swe-bench-score-from-20-50-david-borish-e2hze

[^6_240]: https://www.oio-blog.com/contents/harnessx-agent-harness-foundry/

[^6_241]: https://buttondown.com/anatol/archive/darwin-godel-machines-a-self-improving/

[^6_242]: https://alphasignalai.substack.com/p/harnessx-turns-the-agent-harness

[^6_243]: https://www.intoai.pub/p/darwin-godel-machine-the-first-self

[^6_244]: https://arxiv.org/abs/2505.23422

[^6_245]: https://arxiv.org/abs/2603.13258

[^6_246]: https://www.themoonlight.io/en/review/from-knowledge-to-noise-ctim-rover-and-the-pitfalls-of-episodic-memory-in-software-engineering-agents

[^6_247]: https://arxiv.org/pdf/2603.13258.pdf

[^6_248]: https://scholar.google.com/citations?user=dLXfLzoAAAAJ\&hl=en

[^6_249]: https://scholar.google.com/citations?user=ms-Y9OgAAAAJ\&hl=en

[^6_250]: https://arxiv.org/html/2603.10291v1

[^6_251]: https://arxiv.org/html/2501.11739v1

[^6_252]: https://www.arxiv.org/list/cs.SE/recent?skip=5\&show=50

[^6_253]: http://web.eecs.umich.edu/~soar/sitemaker/docs/pubs/ijcai09.pdf

[^6_254]: https://arxiv.org/abs/2601.04171

[^6_255]: https://openreview.net/attachment?id=ayA2tJNDET\&name=pdf

[^6_256]: https://www.cnblogs.com/llmnews/articles/20551345

[^6_257]: https://x.com/Memoirs/status/2009214773276078458

[^6_258]: https://alphaxiv.org/overview/2601.04171v1

[^6_259]: https://scholar.google.com/citations?user=KNsZ1u4AAAAJ\&hl=en

[^6_260]: https://arxiv.org/abs/2604.12268

[^6_261]: http://arxiv.org/list/cs/2025-05?skip=12175\&show=2000

[^6_262]: https://arxiv.org/html/2604.12268v1

[^6_263]: http://www.arxiv.org/list/cs.AI/recent?skip=1100\&show=50

[^6_264]: https://kenhuangus.substack.com/p/how-ai-agents-actually-remember-part

[^6_265]: https://www.themoonlight.io/en/review/codespecbench-benchmarking-llms-for-executable-behavioral-specification-generation

[^6_266]: https://arxiv.org/html/2506.12286v3

[^6_267]: https://arxiv.org/list/cs.CL/pastweek?skip=650\&show=50

[^6_268]: https://arxiv.org/abs/2606.05661

[^6_269]: https://hyper.ai/en/papers/2606.05661

[^6_270]: https://aclanthology.org/2025.findings-acl.428.pdf

[^6_271]: https://openreview.net/pdf?id=fjJcJhIzYx

[^6_272]: https://digg.com/tech/x5ziv8r7

[^6_273]: https://arxiv.org/html/2601.22249v1

[^6_274]: https://arxiv.org/html/2509.20215v1

[^6_275]: https://24-ai.news/ja/news/2026-06-04/arxiv-cl-bench-continual-learning/

[^6_276]: https://ar5iv.labs.arxiv.org/html/2506.00027

[^6_277]: https://arxiv.org/html/2504.09643v1

[^6_278]: https://24-ai.news/en/news/2026-06-04/arxiv-cl-bench-continual-learning/

[^6_279]: https://arxiv.org/html/2408.05715v1

[^6_280]: https://24-ai.news/ko/news/2026-06-04/arxiv-cl-bench-continual-learning/

[^6_281]: https://arxiv.org/html/2606.05661v1

[^6_282]: https://backfield.net/river/tag/continual-learning

[^6_283]: https://agentmarketcap.ai/blog/2026/04/08/real-world-coding-agent-performance-vs-swe-bench-2026

[^6_284]: https://codingfleet.com/blog/swe-bench-pro-explained-the-new-standard-for-ai-coding-benchmarks-2026/

[^6_285]: https://agentmarketcap.ai/blog/2026/04/07/swe-rebench-monthly-updated-coding-agent-benchmark

[^6_286]: https://agentmarketcap.ai/blog/2026/04/07/swe-bench-pro-46-vs-verified-81-benchmark-contamination

[^6_287]: https://www.digitalapplied.com/blog/swe-bench-terminal-bench-benchmark-guide-2026

[^6_288]: https://theagenttimes.com/articles/openai-retires-swe-bench-verified-as-saturation-and-contamin-2daddb6c

[^6_289]: https://www.morphllm.com/swe-bench-pro

[^6_290]: https://agentmarketcap.ai/blog/2026/04/12/openai-swe-bench-self-reporting-contamination-crisis

[^6_291]: https://www.codeant.ai/blogs/swe-bench-scores

[^6_292]: https://x.com/OpenAIDevs/status/2026002219909427270

[^6_293]: https://www.youtube.com/watch?v=0RP0x2f9OLM

[^6_294]: https://x.com/latentspacepod/status/2026027529039990985

[^6_295]: https://www.linkedin.com/posts/hackerrank_openai-just-killed-swe-bench-verified-the-activity-7432807590759264256-xzhQ

[^6_296]: https://www.youtube.com/watch?v=_BJwkGJuXc4

[^6_297]: https://vantaige.io/blog/claude-code-dreaming-memory-consolidation-setup-2026

[^6_298]: https://arxiv.org/pdf/2604.00280v1.pdf

[^6_299]: https://tensorpm.com/blog/dreaming-isnt-enough-claude-memory-vs-tensorpm

[^6_300]: https://www.syntaxdispatch.com/blog/claude-managed-agents-dreaming

[^6_301]: https://www.forbes.com/sites/jonmarkman/2026/05/11/claudes-new-dreaming-feature-builds-self-improving-ai-agents/

[^6_302]: https://www.everydev.ai/p/blog-what-anthropic-shipped-at-code-with-claude-2026

[^6_303]: https://dev.to/jangwook_kim_e31e7291ad98/code-with-claude-2026-managed-agents-dreaming-aws-3pc6

[^6_304]: https://www.youtube.com/watch?v=YPOgIvC_RwA

[^6_305]: https://letsdatascience.com/news/anthropic-introduces-dreaming-for-claude-agent-memory-consol-32a279c9

[^6_306]: https://agentconn.com/blog/ai-agent-memory-auto-dream-context-files-2026/

[^6_307]: https://www.facebook.com/jonathanjmast/posts/claude-code-just-learned-how-to-dream-breaking-claude-codes-new-dream-function-g/26854162467523233/

[^6_308]: https://www.youtube.com/watch?v=RtywqDFBYnQ

[^6_309]: https://www.reddit.com/r/LocalLLaMA/comments/1r3weq3/swerebench_jan_2026_glm5_minimax_m25/

[^6_310]: https://www.marktechpost.com/2026/05/15/best-ai-agents-for-software-development-ranked-a-benchmark-driven-look-at-the-current-field/

[^6_311]: https://huggingface.co/papers/2603.15401

[^6_312]: https://awesomeagents.ai/leaderboards/swe-bench-coding-agent-leaderboard/

[^6_313]: https://arxiv.org/html/2602.08316v3

[^6_314]: https://arxiv.org/pdf/2507.00014v1.pdf

[^6_315]: https://www.mindstudio.ai/blog/claude-mythos-benchmark-results-swe-bench-agentic-coding

[^6_316]: https://localaimaster.com/models/swe-bench-explained-ai-benchmarks

[^6_317]: https://arxiv.org/html/2603.01327v1

[^6_318]: https://www.youtube.com/watch?v=27xgil6P20w

[^6_319]: https://github.com/aws-samples/sample-kiro-cli-prompts-for-product-teams/blob/main/.kiro/steering/prd-guide.md

[^6_320]: https://sakardotel.com/blog/shifting-to-specification-driven-engineering-with-kiro/

[^6_321]: https://dev.to/sachin_gupta_7fa2ec5ba28f/hexforge-the-spooky-coding-education-game-for-the-kiroween-1gb6

[^6_322]: https://arxiv.org/html/2604.08417v1

[^6_323]: https://pt.slideshare.net/slideshow/spec-driven-development-with-ai-building-future-ready-software-using-kiro-ide/287908914

[^6_324]: https://www.catalyzex.com/paper/swe-skills-bench-do-agent-skills-actually

[^6_325]: https://letsdatascience.com/blog/anthropic-dreaming-claude-managed-agents-self-improving-may-6

[^6_326]: https://www.chatpaper.ai/ru/dashboard/paper/d5b66f8f-62a9-4c0c-85c4-430da34eeeb8

[^6_327]: https://www.youtube.com/watch?v=YPOgIvC_RwA\&vl=ja

[^6_328]: https://arxiv.org/pdf/2603.15401.pdf

[^6_329]: https://www.beri.net/article/2026-05-10-anthropic-dreaming-claude-agents-harvey-6x-self-improving

[^6_330]: https://www.linkedin.com/posts/apoorvajoshi95_if-youre-writing-agent-skills-for-everything-activity-7457435720945942529-WQTC

[^6_331]: https://findskill.ai/blog/claude-dreaming-harvey-6x-platform-teams-q3/

[^6_332]: https://www.oktosolutions.ca/en/claude-dreaming-danthropic-ai-agents-who-learn-from-their-mistakes/

[^6_333]: https://note.com/tothinks/n/ne69a63a2fbfa?hl=en

[^6_334]: https://www.youtube.com/watch?v=eaNo5iAnOHE

[^6_335]: https://www.developersdigest.tech/blog/claude-managed-agents-dreaming-outcomes-multi-agent

[^6_336]: https://www.abhs.in/blog/anthropic-dreaming-claude-managed-agents-self-improve-harvey-wisedocs-2026

[^6_337]: https://toolnav.io/news/2026-05-24-anthropic-claude-code-routines-dreams/

[^6_338]: https://x.com/JustAnotherPM/status/2055346735837532362

[^6_339]: https://www.arxiv.org/list/cs/2025-05?skip=12175\&show=250

[^6_340]: https://arxiv.org/list/cs.LG/2025-07

[^6_341]: https://www.youtube.com/watch?v=0HaUD_olwQU

[^6_342]: https://openai.com/ja-JP/index/why-we-no-longer-evaluate-swe-bench-verified/

[^6_343]: https://openai.com/ko-KR/index/why-we-no-longer-evaluate-swe-bench-verified/

[^6_344]: https://openai.com/bn-BD/index/why-we-no-longer-evaluate-swe-bench-verified/

[^6_345]: https://x.com/stalkermustang/status/2025998151899873699

[^6_346]: https://arxiv.org/abs/2604.10392

[^6_347]: https://spec.zhe.sh

[^6_348]: https://www.semanticscholar.org/paper/SpecGen:-Automated-Generation-of-Formal-Program-via-Ma-Liu/2b6fe3e433707b5521ed2a50274c27ea8750b40f

[^6_349]: https://scholar.google.lu/citations?user=jU1A5BYAAAAJ\&hl=pt-PT

[^6_350]: https://www.themoonlight.io/en/review/intent-aligned-formal-specification-synthesis-via-traceable-refinement

[^6_351]: https://prismix.dev/news/1aa936e29c37

[^6_352]: https://scholar.google.com/citations?user=TtRSUAMAAAAJ\&hl=en

[^6_353]: https://github.com/AkihikoWatanabe/paper_notes/issues/5632


---

## Where Models Agree

| Finding | GPT-5.5 Thinking | Claude Opus 4.8 Thinking | Gemini 3.1 Pro Thinking | Evidence |
| :-- | :-- | :-- | :-- | :-- |
| The central object is the dual pair (Contract + Implementation), not code alone | ✓ | ✓ | ✓ | Separates exogenous verification from creative search; fixes the test-sharpening ceiling |
| The contract-tightening axis is the missing improvement dimension STZ lacks today | ✓ | ✓ | ✓ | Edge-case discovery proposes new predicates rather than sharper tests — the only non-gameable gain axis |
| Verifier triad (tests + rubric + spec) is non-negotiable and must involve independent authorship | ✓ | ✓ | ✓ | PostTrainBench reward-hacking[^7_1], Agentic Rubrics +3.5%, SelfEvolve TDD 92.7% vs 72.7%[^7_2] |
| Sub-agents must have zero write access to trusted state; only append-only ledger promotion is allowed | ✓ | ✓ | ✓ | AGP SEPL[^7_3], SICA version store[^7_4], PostTrainBench[^7_1] |
| Raw experience injection degrades performance; only distilled, code-anchored artifacts should persist | ✓ | ✓ | ✓ | ICML 2026 faithfulness paper[^7_5], EvolveR two-stage lifecycle[^7_6] |
| The 30-day success criterion is binary: triad+contract beats tests-only on held-out tasks for one repo | ✓ | ✓ | ✓ | Ablation-first design prevents false RSI claims |

## Where Models Disagree

| Topic | GPT-5.5 Thinking | Claude Opus 4.8 Thinking | Gemini 3.1 Pro Thinking | Why They Differ |
| :-- | :-- | :-- | :-- | :-- |
| Verifier weighting | 0.45/0.35/0.20 (exec/contract/rubric) | 0.50/0.30/0.20 (exec/rubric/spec) | No fixed weights, triad as ensemble | GPT-5.5 separates contract from rubric as distinct signals; Claude merges contract into rubric; Gemini treats it as configurable |
| Contract mutability | Contract evolves carefully through promotion | Contract is "monotonically tightening" — never loosens | Contract is "sealed per slice" then may evolve | Different assumptions about whether requirements can be relaxed or only strengthened |
| When harness gene evolution begins | Stage 6 (after all other stages proven) | Only after 30-day proof-of-concept passes | Part of the MemEvolve-style retrieval from early on | Risk tolerance for meta-level changes |
| Role of DGM archive model | Ledger as evolutionary tree with branching | Archive for open-ended exploration in Arena | Primarily for contrastive trace analysis | Different emphasis on whether diversity lives in candidates or in promoted knowledge |

## Unique Discoveries

| Model | Unique Finding | Why It Matters |
| :-- | :-- | :-- |
| Claude Opus 4.8 Thinking | The asymmetry rule: "contract may only tighten through human-approved promotion while implementation may move freely within it" — stated as a formal governing rule | Gives STZ a crisp security property that is both implementable and explainable to auditors |
| GPT-5.5 Thinking | Full CLI command taxonomy (`stz contract refine`, `stz arena run`, `stz ledger review`, etc.) with mode table (contract-first, test-first, spec-first, explore-first, refactor-safe) | Directly implementable UX that maps the abstract architecture to developer workflow |
| Gemini 3.1 Pro Thinking | Framing STZ as "an automated, verifiable AI research lab inside every software project" | Positions the product narrative for the open-source community and potential frontier-lab interviews |

## Comprehensive Analysis

All three models converge on an identical thesis with striking precision: STZ must transform from a tournament-runner that sharpens tests into a **contract-driven implementation foundry** where the project contract is the exogenous verification surface, the arena is the unbounded creative search space, and the append-only ledger is the evidence system that makes project-local RSI defensible. This convergence is not accidental — it flows directly from the research literature's unanimous finding that RSI only closes reliably when the verifier is external to the agent being improved.[^7_7][^7_1][^7_8]

The critical architectural insight that all models independently reach is that STZ's ceiling was structural, not a tuning problem. When the sealed test suite is both the improvement target and the judge, the only reachable optimum is sharper tests — because the agent cannot distinguish "better code" from "code that better satisfies *this specific suite*." The contract-driven architecture breaks this collapse by introducing three independent, non-test improvement axes: rubric-based semantic evaluation (catches architectural defects tests structurally miss), spec-based predicate verification (catches "green but wrong" — implementations that pass tests while violating invariants), and contract-tightening (discovering genuine edge cases and encoding them as new predicates rather than as new tests). Each axis is authored independently of the implementation agent, which is what prevents the self-approval loops that PostTrainBench documented as the default failure mode of capable agents given evaluator access.[^7_1]

The disagreement on verifier weighting is less substantive than it appears — all models agree the triad must exist and that no single signal should dominate. The practical recommendation is to make weights an evolvable gene (per the Phase 6 roadmap) starting from roughly 0.45/0.35/0.20 as GPT-5.5 Thinking proposes, with the explicit constraint that execution remains the heaviest signal initially because build-failure and regression are hard fails regardless of rubric or spec scores.

Claude Opus 4.8 Thinking's "monotonically tightening" constraint on the contract is the most opinionated position and also potentially the most powerful. The argument is that a contract that can loosen is a contract that can be gamed by proposing requirement removal. If requirements can only be added or refined (never deleted without explicit human override), the system has a formal directional property: project quality is monotonically non-decreasing over time, modulo the sunset mechanism for knowledge artifacts that later prove harmful. This is a stronger formal guarantee than the other models' more flexible contract lifecycle, and it maps directly to the kind of safety property that would be compelling in an Applied AI interview context.

The 30-day path to a first defensible result is unanimously agreed: ship the plugin skeleton with contract-formation (week 1), add rubric authoring and judging (week 2), add spec-harness-lite (week 3), and run the full ablation matrix comparing tests-only vs. triad-plus-contract (week 4). The success criterion is honest and binary — if the triad plus contract-tightening does not beat tests-only on held-out tasks, the ablation tells you exactly which axis failed. Unlike the current STZ, a null result under this design is interpretable because every signal is isolated and ledgered.

The product identity that emerges is precise: **STZ is a Claude Code plugin where users and agents co-build a project contract, agents explore implementations inside an isolated arena bounded by that contract, and only ledger-backed evidence is allowed to persist — giving you bounded, measurable, auditable RSI that you can defend to any technical audience.** The contract is your safety case. The arena is your capability case. The ledger is your evidence case.
<span style="display:none">[^7_10][^7_11][^7_12][^7_13][^7_14][^7_15][^7_16][^7_17][^7_18][^7_19][^7_20][^7_21][^7_22][^7_23][^7_24][^7_25][^7_26][^7_27][^7_28][^7_29][^7_9]</span>

<div align="center">⁂</div>

[^7_1]: https://iclr.cc/virtual/2026/10018718

[^7_2]: https://zenodo.org/records/18152531

[^7_3]: https://arxiv.org/abs/2604.15034

[^7_4]: https://www.marktechpost.com/2025/04/29/can-coding-agents-improve-themselves-researchers-from-university-of-bristol-and-igent-ai-propose-sica-self-improving-coding-agent-that-iteratively-enhances-its-own-code-and-performance/

[^7_5]: https://arxiv.org/html/2601.22436v3

[^7_6]: https://arxiv.org/abs/2510.16079

[^7_7]: https://arxiv.org/abs/2506.13131

[^7_8]: https://iclr.cc/virtual/2026/10018654

[^7_9]: https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/

[^7_10]: https://paperreading.club/page?id=300677

[^7_11]: https://aipapersacademy.com/darwin-godel-machine/

[^7_12]: https://www.linkedin.com/posts/agyn_ai-self-improvement-in-2026-what-the-research-activity-7460333094424825856-46ZM

[^7_13]: https://openreview.net/pdf?id=OlMSrldTNe

[^7_14]: https://sakana.ai/dgm/

[^7_15]: https://arxiv.org/abs/2603.22791v1

[^7_16]: https://icml.cc/virtual/2026/poster/62034

[^7_17]: https://arxiv.org/abs/2601.04171

[^7_18]: https://iclr.cc/virtual/2026/10018679

[^7_19]: https://arxiv.org/abs/2604.00280

[^7_20]: https://arxiv.org/abs/2505.23422

[^7_21]: https://arxiv.org/abs/2507.00014

[^7_22]: https://www.themoonlight.io/en/review/harnessx-a-composable-adaptive-and-evolvable-agent-harness-foundry

[^7_23]: https://icml.cc/virtual/2026/poster/61379

[^7_24]: https://www.alphaxiv.org/overview/2512.18746v1

[^7_25]: https://arxiv.org/pdf/2603.22791.pdf

[^7_26]: https://arxiv.org/html/2603.22791v1

[^7_27]: https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/

[^7_28]: https://github.com/bingreeky/MemEvolve

[^7_29]: https://arxiv.org/html/2602.04288v1


---

# I love the idea of an arena, which matches the idea of a tournament zoo ontologically. The goal of this harness is still to create useable, high quality, well architected software.

Based on the entire thread's discussion thus far, create an exhaustively detailed implementation plan to evolve STZ to align with this recommendation.

Yes — the right evolution is to make STZ a **contract-driven arena harness** on top of Claude Code, where the arena preserves the “tournament zoo” ontology, the contract bounds the search, and the ledger turns adaptation into defensible project-local RSI.[^8_1][^8_2][^8_3]

## Target system

STZ should become a plugin harness with three first-class objects: **Contract**, **Arena**, and **Ledger**. The contract defines what “correct, useful, well-architected” means for a project slice; the arena lets sub-agents explore implementations, tests, specs, and heuristics in isolation; the ledger is the only path by which anything becomes trusted project knowledge or default harness behavior.[^8_2][^8_4][^8_5]

At a systems level, the main loop is:

```text
User Intent
  -> Contract Co-Build
  -> Arena Run
  -> Verifier Triad
  -> Candidate Selection
  -> Learning Distillation
  -> Promotion Review
  -> Ledger
  -> Better Future Runs
```

This directly addresses the current STZ ceiling: tests remain necessary, but they stop being the only correctness object. SelfEvolve’s TDD results support making contract/spec formation precede implementation, while PostTrainBench and reward-hacking work show why sub-agents must not control trusted state or hidden evaluation surfaces.[^8_4][^8_1][^8_2]

## Architectural principles

The implementation plan should obey seven non-negotiable principles.

1. **Contract before code.** Every arena run targets an approved contract slice, not a free-form prompt.[^8_1]
2. **Creative freedom only inside the arena.** Sub-agents can branch, mutate, refactor, and speculate, but only in isolated candidate workspaces.[^8_3]
3. **No direct writes to trusted state.** Arena agents cannot mutate promoted contract artifacts, promoted knowledge, or ledger history.[^8_2][^8_4]
4. **Triangulated verification.** Candidate ranking uses execution, contract/spec, and rubric signals, not tests alone.[^8_5][^8_4]
5. **Typed persistence only.** Persisted learnings are artifacts with schemas, provenance, and promotion evidence.
6. **Selective retrieval, not memory dumping.** Future runs consume only promoted, code-grounded artifacts with explicit triggers.
7. **Per-project boundedness.** STZ claims project-local improvement, not abstract general RSI.

## System blueprint

### Contract plane

The contract is the canonical bounded object. It is not a single document; it is a typed graph.

Recommended structure:

```text
.stz/
  contract/
    contract.yaml
    requirements/
    predicates/
    specs/
    rubrics/
    architecture/
    traceability/
    versions/
```

Core artifact classes:


| Artifact | Purpose | Promotion gate |
| :-- | :-- | :-- |
| Requirement | User/business intent | Human approval |
| Predicate | Minimal verifiable condition | Human or maintainer approval plus validation |
| Behavior spec | Pre/post/invariant semantics | Verifier-backed and linked to requirement |
| Acceptance test | Executable check | Must discriminate at least one bad candidate when practical |
| Rubric | Architectural/semantic scoring criteria | Must improve ranking on calibration tasks |
| Architecture rule | Project norms and boundaries | Human approval plus repo evidence |
| Traceability edge | Links requirement -> predicate -> test/spec/code | Auto-generated, validated |

Suggested `requirement` schema:

```yaml
id: req.reporting.csv-export.v1
kind: requirement
state: accepted
title: CSV export of visible report rows
statement: Users can export the currently visible report as CSV.
rationale: Downstream spreadsheet workflows.
owner: user
acceptance:
  predicates:
    - pred.reporting.csv.includes-visible-rows.v1
    - pred.reporting.csv.includes-header-row.v1
    - pred.reporting.csv.no-filter-mutation.v1
  tests:
    - test.reporting.csv.visible-rows.v1
  rubrics:
    - rubric.reporting.export.boundary.v1
risk:
  severity: medium
  surfaces:
    - reporting
    - permissions
```

Suggested `predicate` schema:

```yaml
id: pred.reporting.csv.no-filter-mutation.v1
kind: predicate
state: accepted
requirement: req.reporting.csv-export.v1
type: invariant
scope:
  symbols:
    - ReportFilters
    - exportCsv
assertion:
  before: report.filters
  after: report.filters
  relation: equal
severity: high
```

Contract state machine:

```text
draft -> proposed -> accepted -> active -> challenged -> superseded | sunset
```

Important policy: contract changes are **proposed** by agents but **accepted** only by human approval plus verifier evidence. That asymmetry is what gives STZ boundedness.[^8_4][^8_2]

### Arena plane

The arena is the tournament zoo preserved and elevated into the core product metaphor. It is where the harness becomes useful rather than restrictive.

Recommended structure:

```text
.stz/
  arena/
    runs/
      run-<id>/
        manifest.yaml
        contract-slice.yaml
        candidates/
          cand-a/
          cand-b/
          cand-c/
        traces/
        verifier/
        selected/
        learnings/
```

Each candidate gets:

- isolated git worktree or branch,
- scoped context packet,
- explicit objective,
- tool budget,
- max rounds,
- output schema.

Candidate directory example:

```text
cand-a/
  plan.md
  patch.diff
  changed-files.json
  candidate-tests/
  candidate-specs/
  rationale.md
  verifier-results.json
  trace.jsonl
```

Arena modes:


| Mode | Use case | Freedom | Gate strength |
| :-- | :-- | --: | --: |
| `contract-first` | New feature, underspecified task | Medium | High |
| `test-first` | Clear bugfix with repro | Medium | High |
| `spec-first` | Stateful or risky domain logic | Medium | Very high |
| `explore-first` | Novel design space, spike work | High | No promotion by default |
| `refactor-safe` | Internal cleanup | Medium | High regression gate |
| `edge-hunt` | Discover missing predicates/tests | High | Contract proposal only |

This keeps the “zoo” ontology: the arena is explicitly a habitat for competing candidate species. The key upgrade is that they compete against a contract, not just a test suite.

### Ledger plane

The ledger is the only trusted persistence path.

Recommended structure:

```text
.stz/
  ledger/
    events.jsonl
    promotions.jsonl
    regressions.jsonl
    sunsets.jsonl
    evaluations/
```

Event types:

- `run_started`
- `contract_proposed`
- `contract_accepted`
- `candidate_scored`
- `candidate_selected`
- `learning_distilled`
- `artifact_promoted`
- `artifact_quarantined`
- `artifact_rejected`
- `artifact_sunset`

Promotion record example:

```json
{
  "promotion_id": "promo_000142",
  "timestamp": "2026-07-01T13:00:00Z",
  "repo": "project-x",
  "subject": {
    "kind": "search_heuristic",
    "id": "heuristic.reporting.inspect-filter-state.v1"
  },
  "source_runs": ["run_381", "run_397", "run_411"],
  "baseline_manifest": "manifest.v12",
  "candidate_manifest": "manifest.v12+heuristic1",
  "evaluation": {
    "heldout_tasks": 12,
    "execution_delta": 0.06,
    "contract_delta": 0.08,
    "rubric_delta": 0.05,
    "regressions": 0,
    "cost_delta": 0.03
  },
  "decision": "promote",
  "supersedes": null,
  "sunset_policy": {
    "recheck_after_runs": 25,
    "sunset_if_minor_regressions": 2
  }
}
```

This is how STZ moves from “adaptive harness” to “auditable foundry.”

## Plugin architecture on Claude Code

STZ should be implemented as a Claude Code plugin adapter with strict state control.

Top-level components:

```text
Claude Code
  -> STZ Plugin Adapter
      -> Contract Engine
      -> Arena Manager
      -> Agent Router
      -> Verifier Stack
      -> Artifact Store
      -> Retrieval Engine
      -> Ledger Engine
      -> Evaluation Engine
```


### Plugin adapter

Responsibilities:

- expose slash/CLI commands,
- generate role-specific prompts,
- enforce schema validation,
- prevent forbidden writes,
- collect run telemetry.

Commands:

```text
/stz:init
/stz:contract-draft
/stz:contract-refine
/stz:contract-accept
/stz:arena-run
/stz:verify
/stz:select
/stz:learn
/stz:promote
/stz:ledger
/stz:sunset
/stz:eval
```

Equivalent CLI:

```bash
stz init
stz contract draft "Add CSV export for filtered reports"
stz contract refine
stz contract accept
stz arena run --mode contract-first --candidates 3
stz verify
stz select
stz learn
stz promote
stz eval
```


### Contract engine

Responsibilities:

- generate draft requirements from user intent,
- manage artifact schemas and versions,
- build contract slices for runs,
- maintain traceability matrix,
- validate contract deltas.

Core APIs:

- `draftContract(intent, repoContext)`
- `proposePredicate(requirementId, candidateEvidence)`
- `acceptContractDelta(deltaId, approver)`
- `buildContractSlice(goalId)`


### Arena manager

Responsibilities:

- create per-candidate worktrees,
- materialize context packets,
- spawn sub-agents,
- collect traces and diffs,
- isolate side effects,
- clean up branches.

Core APIs:

- `createRun(goal, mode, candidateCount)`
- `spawnCandidate(runId, role, config)`
- `collectArtifacts(runId)`
- `finalizeRun(runId)`


### Agent router

Responsibilities:

- select sub-agent role topology,
- enforce max rounds and tool budgets,
- keep verifier agents separate from implementation agents,
- manage critique and reranking passes.

Recommended initial roles:

- Contract Architect
- Clarifier
- Test Synthesizer
- Spec Synthesizer
- Rubric Author
- Candidate Patcher
- Edge Explorer
- Rubric Judge
- Contract Verifier
- Promoter
- Ledger Keeper


### Verifier stack

The verifier triad is mandatory.

1. **Execution verifier**
    - build/install,
    - unit/integration tests,
    - static checks,
    - regression suites,
    - optional perf/security checks.
2. **Contract/spec verifier**
    - requirement coverage,
    - predicate checks,
    - pre/post/invariant checks,
    - traceability completeness.
3. **Rubric verifier**
    - architecture boundary adherence,
    - maintainability,
    - compatibility,
    - minimality/locality,
    - repo convention alignment.

Suggested initial scoring:

```text
composite =
  0.45 * execution +
  0.35 * contract +
  0.20 * rubric
```

Hard fails:

- build failure,
- any high-severity predicate failure,
- security regression,
- hidden calibration regression,
- contract coverage below threshold.

The reason for triad verification is well supported by rubric co-evolution work and reward-hacking evidence: quality of criteria matters, and single-proxy optimization drifts badly over time.[^8_5][^8_4]

### Artifact store

Store all artifacts in typed namespaces:

- `candidates/`
- `promoted/`
- `quarantined/`
- `sunset/`

Artifact kinds:

- `requirement`
- `predicate`
- `behavior_spec`
- `acceptance_test`
- `rubric`
- `architecture_rule`
- `patch`
- `search_heuristic`
- `repo_note`
- `retrieval_policy`
- `verifier_policy`
- `promotion_decision`


### Retrieval engine

Retrieval must only use promoted artifacts and must be selective.

Policy:

- no raw memory dump,
- retrieve per step or per slice,
- top-k caps by artifact kind,
- include “why retrieved” rationale,
- log whether retrieved items were used.

Suggested limits:

- rubrics: 1-2
- specs: 1-3
- heuristics: 1
- repo notes: 0 by default, 1 only if explicitly whitelisted

This defends against contextual drag and experience misuse while still letting project knowledge compound.

### Evaluation engine

Purpose:

- compare stateless vs stateful STZ,
- run held-out chronological issue streams,
- produce ablations,
- support promotion decisions.

Ablation matrix:

- tests-only,
- tests + rubric,
- tests + contract/spec,
- full triad,
- full triad + promoted knowledge,
- full triad + evolved harness primitive.


## Detailed execution flow

### Flow 1: Contract co-build

1. User states goal.
2. Contract Architect drafts requirements.
3. Clarifier identifies ambiguity and asks questions.
4. Contract Engine converts accepted requirements into predicates.
5. Test Synthesizer proposes acceptance tests.
6. Spec Synthesizer proposes pre/post/invariants.
7. Rubric Author drafts architectural criteria.
8. User approves slice.
9. Contract slice becomes active for arena run.

Outputs:

- accepted requirement artifacts,
- predicate artifacts,
- initial tests/specs/rubrics,
- traceability map.


### Flow 2: Arena run

1. Arena Manager creates run manifest.
2. Retrieval Engine builds minimal context packet.
3. Candidate Patchers spawn in parallel.
4. Edge Explorer spawns separately to find failure modes.
5. Candidates may propose contract deltas but not apply them.
6. Candidate artifacts collected.
7. Verifier triad scores all candidates.
8. Selector ranks candidates.
9. Repair pass may run on top 1-2 candidates.
10. Final candidate selected.

### Flow 3: Learning distillation

1. Compare winning vs losing traces.
2. Cluster repeated success patterns.
3. Distill candidate learnings into typed artifacts:
    - heuristic,
    - rubric improvement,
    - spec pattern,
    - architecture rule proposal,
    - retrieval hint.
4. Promoter evaluates on held-out tasks.
5. Ledger records promote/quarantine/reject.

### Flow 4: Contract evolution

1. Edge Explorer or post-run analysis identifies a genuine missing case.
2. New predicate or requirement delta proposed.
3. Contract Engine links it to evidence.
4. User reviews.
5. If accepted, traceability map updates and future runs consume the tighter contract.

This is the key missing axis in current STZ: edge discovery becomes contract evolution, not merely sharper testing.

## Repo structure

Recommended repository layout:

```text
stz/
  packages/
    core/
      contract/
      arena/
      verifier/
      ledger/
      retrieval/
      evaluation/
      schemas/
    agents/
      contract-architect/
      clarifier/
      test-synthesizer/
      spec-synthesizer/
      rubric-author/
      candidate-patcher/
      edge-explorer/
      rubric-judge/
      contract-verifier/
      promoter/
    plugin/
      claude-code/
    cli/
  examples/
  docs/
```

Per-project working directory:

```text
<repo>/
  .stz/
    config.yaml
    contract/
    arena/
    artifacts/
      candidates/
      promoted/
      quarantined/
      sunset/
    ledger/
    eval/
      calibration/
      issue-stream/
      reports/
```


## Schemas and interfaces

### Primitive schema

```ts
type PrimitiveKind =
  | "planner"
  | "slice"
  | "candidate"
  | "retrieval"
  | "verifier"
  | "promotion"
  | "consolidation";

interface HarnessPrimitive<T> {
  id: string;
  version: string;
  kind: PrimitiveKind;
  description: string;
  config: T;
  inputSchema: object;
  outputSchema: object;
  promotable: boolean;
}
```


### Arena run schema

```ts
interface ArenaRun {
  id: string;
  repo: string;
  goal: string;
  mode: "contract-first" | "test-first" | "spec-first" | "explore-first" | "refactor-safe" | "edge-hunt";
  contractVersion: string;
  candidateCount: number;
  manifestId: string;
  status: "created" | "running" | "verifying" | "selected" | "closed";
}
```


### Candidate schema

```ts
interface Candidate {
  id: string;
  runId: string;
  branch: string;
  role: "candidate-patcher";
  changedFiles: string[];
  proposedContractDeltas: string[];
  scores?: {
    execution: number;
    contract: number;
    rubric: number;
    composite: number;
  };
  hardFails?: string[];
  decision?: "selected" | "rejected" | "repair";
}
```


### Promotion schema

```ts
interface PromotionDecision {
  id: string;
  subjectKind: string;
  subjectId: string;
  sourceRuns: string[];
  baselineManifest: string;
  candidateManifest: string;
  evaluation: {
    sampleSize: number;
    executionDelta: number;
    contractDelta: number;
    rubricDelta: number;
    regressions: number;
    costDelta: number;
  };
  decision: "promote" | "quarantine" | "reject" | "sunset";
}
```


## Security and boundedness controls

Hard boundaries:

- no candidate agent writes to `promoted/`,
- no candidate agent writes to `ledger/`,
- no verifier agent edits implementation,
- no implementation agent authors final rubric used to score itself,
- no candidate sees hidden calibration tasks,
- no automatic promotion from arena to trusted state,
- no raw memory artifact auto-injected into future prompts.

These boundaries are essential because reward hacking is pervasive in recursive code optimization, with proxy gains diverging from real gains as optimization steps increase.[^8_4]

## Phased roadmap

### Phase 0: Freeze unsafe persistence

Goal: stop direct mutation of trusted state.

Tasks:

- create `.stz/artifacts/candidates` and `.stz/artifacts/promoted`,
- redirect all existing learnings to candidate area,
- create append-only ledger shell,
- add write guard middleware.

Exit criteria:

- current STZ still runs,
- nothing can silently mutate trusted harness behavior.


### Phase 1: Contract kernel

Goal: make contract the canonical bounded object.

Tasks:

- implement schemas for requirement/predicate/spec/rubric,
- add contract draft/refine/accept commands,
- add traceability graph,
- build contract slice compiler.

Exit criteria:

- user can co-build and approve contract slices before implementation.


### Phase 2: Arena runner

Goal: preserve the tournament zoo as the creative engine.

Tasks:

- worktree orchestration,
- candidate spawning,
- run manifests,
- trace collection,
- candidate artifact directories.

Exit criteria:

- multiple isolated candidates can run against one contract slice.


### Phase 3: Verifier triad

Goal: make tests no longer the sole success surface.

Tasks:

- execution verifier integration,
- predicate/spec verifier,
- rubric author and judge separation,
- score aggregation and hard-fail logic.

Exit criteria:

- at least one repo issue where triad changes candidate ranking versus tests-only.


### Phase 4: Ledger and promotion

Goal: create defensible RSI.

Tasks:

- promotion decision engine,
- quarantine/reject/sunset flows,
- immutable JSONL event log,
- evidence report generation.

Exit criteria:

- no trusted artifact change without ledger record.


### Phase 5: Retrieval and project knowledge

Goal: make learnings useful without memory pollution.

Tasks:

- promoted artifact index,
- retrieval triggers,
- top-k caps,
- retrieval explanations,
- ablation flags.

Exit criteria:

- promoted artifacts improve candidate quality or reduce search cost on held-out tasks.


### Phase 6: Contract evolution loop

Goal: let STZ improve the bounded object itself.

Tasks:

- edge-hunt mode,
- contract delta proposals from arena learnings,
- user review UI for new predicates/requirements,
- traceability updates.

Exit criteria:

- at least one genuine edge case discovered in arena becomes a promoted contract artifact.


### Phase 7: Safe primitive evolution

Goal: allow narrow meta-level improvement.

Start with evolvable genes:

- candidate fanout,
- slice granularity,
- verifier weights,
- retrieval top-k,
- repair pass threshold,
- mode selection heuristics.

Exit criteria:

- held-out gain over fixed baseline without regressions.


## 30-day execution plan

### Week 1

- Freeze writes.
- Add artifact store and ledger shell.
- Implement contract schemas and CLI/plugin commands.
- Build contract drafting flow.


### Week 2

- Implement arena worktree manager.
- Add candidate spawning and trace capture.
- Add basic execution verifier.


### Week 3

- Add predicate/spec verification.
- Add rubric author/judge split.
- Integrate composite scoring and selection.


### Week 4

- Add learning distillation.
- Add promotion workflow.
- Run first ablation: tests-only vs full triad.
- Pilot on one real repo issue stream.

Success criterion:

- one project where contract + arena + triad outperforms tests-only on held-out tasks, with at least one promoted artifact and zero severe regressions.[^8_1][^8_4]


## 90-day execution plan

By day 90, STZ should have:

- 2-3 repos using contract-first arena flows,
- stable ledger-backed promotion,
- retrieval from promoted artifacts,
- measurable stateful gain over stateless baseline,
- at least one promoted rubric family,
- at least one promoted heuristic family,
- at least one promoted contract delta originating from edge exploration.


## Product and UX details

The UX should emphasize three visible views:

1. **Contract view**
    - requirements,
    - predicates,
    - acceptance tests,
    - traceability,
    - approvals.
2. **Arena view**
    - candidate habitats,
    - scores,
    - traces,
    - diffs,
    - rerank reasons.
3. **Ledger view**
    - promotions,
    - quarantines,
    - sunsets,
    - evidence deltas,
    - calibration outcomes.

This preserves the “zoo” identity while making the system legible to serious engineers.

## What not to do

- Do not start by evolving prompts globally.
- Do not persist free-form notes into runtime context.
- Do not claim general self-improvement from benchmark gains alone.
- Do not let candidate-generated tests justify themselves without independent signals.
- Do not merge contract and implementation into one mutable blob.


## Converged recommendation

The correct implementation path is to rebuild STZ around a **Contract Plane**, an **Arena Plane**, and a **Ledger Plane**, in that order. The arena remains the creative heart of STZ and should preserve the tournament-zoo ontology, but it must now operate against a co-built, versioned project contract and feed only typed, evidence-backed learnings into the ledger. That is the narrowest architecture that still gives you usable, high-quality, well-architected software while creating a real, defensible story of bounded RSI.[^8_3][^8_2][^8_5][^8_1][^8_4]

Would you like the next step as a repo-ready artifact set: folder tree, TypeScript interfaces, YAML schemas, command specs, and milestone tickets?
<span style="display:none">[^8_10][^8_11][^8_12][^8_13][^8_14][^8_15][^8_6][^8_7][^8_8][^8_9]</span>

<div align="center">⁂</div>

[^8_1]: https://arxiv.org/html/2604.16314v1

[^8_2]: https://iclr.cc/virtual/2026/10018717

[^8_3]: https://arxiv.org/html/2603.22791v1

[^8_4]: https://iclr.cc/virtual/2026/10018648

[^8_5]: https://iclr.cc/virtual/2026/10018679

[^8_6]: https://zenodo.org/records/17338424

[^8_7]: https://arxiv.org/pdf/2603.22791.pdf

[^8_8]: https://arxiv.org/pdf/2604.16314.pdf

[^8_9]: https://openreview.net/pdf?id=WA6q2pNQhj

[^8_10]: https://www.artifilog.com/posts/self-evolving-ai-agents-the-code-that-writes-itself

[^8_11]: https://www.youtube.com/watch?v=0wpj9HLoi6c

[^8_12]: https://iclr.cc/virtual/2026/10018623

[^8_13]: https://www.linkedin.com/posts/agyn_ai-self-improvement-in-2026-what-the-research-activity-7460333094424825856-46ZM

[^8_14]: https://openreview.net/pdf?id=OsPQ6zTQXV

[^8_15]: https://www.youtube.com/watch?v=U2vn-mCUnMo


---

# [https://github.com/dr-robert-li/slice-tournament-zoo](https://github.com/dr-robert-li/slice-tournament-zoo) - review experiments/ and PAPER.md to check that we aren't re-deriving earned negative at 10× the cost - Github connected

I can’t reliably verify `experiments/` or `PAPER.md` yet because the repo content wasn’t retrievable from the available GitHub access path, and direct cloning was blocked in this environment. So I can’t honestly check whether the new plan is re-deriving an already-earned negative from those files without getting the repository contents first.[^9_1]

## What I *can* say now

Based on the thread so far, the highest-risk failure mode is exactly what you’re worried about: rebuilding a more elaborate system that still mostly improves verifier sharpness rather than software quality, just with more machinery around it. The literature strongly supports that concern because reward-hacking and evaluator-capture emerge when the improving loop does not gain a truly exogenous correctness object, and your proposed contract plane is the main architectural answer to that risk.[^9_2][^9_3][^9_4]

The practical question to ask of `PAPER.md` and `experiments/` is not “did STZ fail?” but “what *class* of improvement was empirically blocked?” If the negative result was already “test-suite sharpening improves calibration but not implementation quality,” then the new plan is only justified if it adds genuinely new axes: contract evolution, rubric-grounded semantic evaluation, and spec/predicate verification.[^9_4][^9_5]

## What to inspect in the repo

To avoid re-deriving the same negative at 10× cost, the repo review should extract four things:

- **Observed gains**: where STZ improved outcomes, such as ranking, calibration, regression detection, or test quality.
- **Observed ceilings**: where gains stopped, such as implementation quality plateauing despite better tests.
- **Negative mechanisms**: contamination, evaluator coupling, memory noise, or search collapse.
- **Cheap signals already proven useful**: anything in current STZ that should be preserved instead of replaced.

The most important evidence would be statements like:

- “harness mining improved verifier sharpness but not code correctness,”
- “additional sub-agents increased cost without improving selected patch quality,”
- “persisted learnings biased search but did not transfer,”
- or “post-merge / exogenous signals were the only plausible remaining path.”
Those would directly determine whether the contract-driven arena is a true pivot or just a dressed-up replay of the same loop.[^9_3][^9_5]


## Likely decision rule

If `PAPER.md` already shows that STZ’s core negative was “closed-loop evaluation cannot create better implementation except in narrow bug classes,” then the contract-driven redesign is still justified, because it changes the optimized object from “implementation versus hidden tests” to “implementation versus project contract,” which is a different hypothesis class. But if the repo already tested something close to contract-first or spec-first bounded search and still found no material gain, then the current plan should be cut down sharply and focused only on the minimal delta that was not yet tried.[^9_2][^9_4]

The cheapest high-confidence path is to perform a **negative-result gap analysis** before building anything large: compare each proposed new component against what STZ already falsified. The question for each component is: “Is this net new, or is this the same mechanism with better branding?” That is the exact filter that prevents 10× cost re-derivation.

## Best next step

Please paste either:

- the contents of `PAPER.md`, or
- a directory tree plus README/notes from `experiments/`.

Once I have that, I can do a precise **earned-negative audit**:

1. extract what STZ already disproved,
2. map each proposed vNext component against those negatives,
3. label each item as `preserve`, `modify`, `drop`, or `net new`,
4. produce a trimmed implementation plan that only funds uncrossed hypothesis space.
<span style="display:none">[^9_10][^9_11][^9_12][^9_13][^9_14][^9_15][^9_16][^9_17][^9_18][^9_19][^9_6][^9_7][^9_8][^9_9]</span>

<div align="center">⁂</div>

[^9_1]: https://github.com/dr-robert-li

[^9_2]: https://iclr.cc/virtual/2026/10018717

[^9_3]: https://iclr.cc/virtual/2026/10018648

[^9_4]: https://arxiv.org/html/2604.16314v1

[^9_5]: https://arxiv.org/html/2603.22791v1

[^9_6]: https://csroyli.github.io/publications.html

[^9_7]: https://github.com/PruneTruong/DenseMatching/blob/main/MODEL_ZOO.md

[^9_8]: https://github.com/robertjli

[^9_9]: https://github.com/StatNLP/discretezoo

[^9_10]: https://gist.github.com/dr-robert-li

[^9_11]: https://github.com/rl-tools/zoo-runs-ci

[^9_12]: https://github.com/YisiLuo/Continuous-Representation-Zoo

[^9_13]: https://github.com/worldbench/Robo3D/tree/main/zoo

[^9_14]: https://github.com/DAMO-NLP-SG/LLM-Zoo/blob/main/README.md

[^9_15]: http://www.cs.toronto.edu/~liyi/host/files/phd-thesis.pdf

[^9_16]: https://github.com/IBM/ZOO-Attack

[^9_17]: https://zoo.rl.tools/

[^9_18]: https://github.com/nu-ideas-lab/patrolling_zoo

[^9_19]: https://github.com/dr-robert-li/crawl_enrich


---

# Recheck [https://github.com/dr-robert-li/slice-tournament-zoo](https://github.com/dr-robert-li/slice-tournament-zoo)

And PAPER.md is in slice-tournament-zoo/docs/

Now I have everything needed for a precise audit. Here's the earned-negative gap analysis.

## What STZ already definitively proved — do not re-derive

The paper and experiments close five specific hypotheses with strong epistemic discipline :

**1. Sealed-steered iteration loop (0.8.0): ruled out.** Iterate-to-green ties best-of-N at equal token budget on the cron substrate. The reason is structural: a loop that stops at "sealed = 1.0" cannot fix what the suite cannot see, by construction .

**2. Judge-beyond-suite per-slice loop: ruled out.** Judge+iterate == hardened-suite+best-of-N at the truth-1.0 ceiling, at ~92k extra tokens to reach what best-of-N selects at near-zero marginal cost. The judge mechanism works (it found the `5abc` bug past a green suite), but the gradient on cron is suite-expressible, so the loop is unwarranted .

**3. Numeric selection-gene evolution: ruled out structurally.** Every numeric proxy (pass rate, coverage, mutation-kill) is a function of the sealed suite. The residual held-out truth lives outside the sealed suite by construction. No reweighting of sealed-derived signals can recover a signal none of them carry .

**4. Suite-sharpening as a broad competency lever: ruled out for homogeneous capable pools.** The structural triad — axis must be substantial ∧ split ∧ suite-invisible simultaneously — is empirically shown to be mutually exclusive across six arms: substantial axes produce correlated errors (expr-eval: 5/5 same unary-`**` bug), split axes are peripheral edges with small truth weight (cron `5abc`: 1 case in ~1248), and suite-invisible axes are by definition not exercised by normal inputs .

**5. SWE-Bench as a deciding instrument: rendered silent** by recall contamination and the public/held-out test split. It cannot decide the build; it is demonstration-only .

## What STZ positively confirmed — preserve these

**The mechanism works:** `harness-mine` twice-verified a genuine blind spot, `harness-promote-mutator` baked it into the test-author battery. Suite sharpening is a real, useful, one-time amortised gain .

**The five-gate promotion guard correctly declines:** when the sharper genome's selected winner ties the incumbent on `truth_full`, the gate halts. This is the single most important structural property to preserve in any evolution .

**The judge as one-time selection/authoring instrument is genuinely useful** — it found the `5abc` bug + two more gaps that a green suite missed. Its value is upstream (mining bug classes for suite hardening), not per-slice search .

**The synthetic recall-free substrate with sealed/truth split** is the only trustworthy evaluation instrument. Any new experiment must use this pattern .

## The genuine open cell — the one un-crossed hypothesis

PAPER.md explicitly identifies exactly one door that remains open :

> "A heterogeneous, frontier-versus-frontier pool on a task at their real competence frontier, with full-contract truth and a train/test split."

The paper notes this is materially larger, plausibly still negative (legs 2–3 of the structural law still apply), and is explicitly the user's call .

## Gap analysis: what the proposed contract-arena evolution actually funds

Here is the precise earned-negative audit mapped against the proposed implementation plan:


| Proposed component | Maps to STZ negative? | Status | Verdict |
| :-- | :-- | :-- | :-- |
| Contract plane (requirements, predicates, specs) | No — STZ tested test-suite-derived correctness only, never a typed exogenous contract | **Net new** | ✅ Fund |
| Arena isolation (worktree-per-candidate) | No — STZ ran blind implementers but not formally isolated worktrees | **Preserve + extend** | ✅ Fund |
| Verifier triad (execution + rubric + spec) | Partially — STZ proved tests-alone fails. Rubric and spec verifiers are untested | **Net new axes** | ✅ Fund |
| Rubric-author sub-agent | No — STZ used a frozen judge, not a repo-grounded rubric author | **Net new** | ✅ Fund |
| Behavior spec / predicate verification | No — STZ never tested a formal pre/post/invariant layer | **Net new** | ✅ Fund |
| Judge as selection signal | **YES — explicitly ruled out** as per-slice loop | ⛔ Do not use as iterative per-slice signal |  |
| Judge as one-time rubric/spec authoring instrument | YES — explicitly validated as useful | ✅ Preserve this use only |  |
| Sealed test suite + best-of-N selection | **YES — the proven positive** | ✅ Keep as execution verifier layer |  |
| Selective retrieval / project knowledge | Not tested by STZ — different failure mode class | **Net new** | ✅ Fund |
| Promotion ledger + gate | **YES — the five-gate guard is the proven structural safeguard** | ✅ Preserve exactly |  |
| Numeric proxy reweighting as evolution | **YES — explicitly ruled out structurally** | ⛔ Do not fund |  |
| Per-slice convergence/iteration loop | **YES — ruled out twice** | ⛔ Do not fund |  |
| Heterogeneous pool (Haiku+Sonnet+Opus) | YES — open cell, plausibly still negative, expensive | ⚠️ Optional experiment, not default |  |
| SWE-Bench as evaluation instrument | **YES — rendered silent** | ⛔ Use only as demonstration |  |
| Synthetic recall-free substrate with truth/sealed split | **YES — the load-bearing eval pattern** | ✅ Mandatory for any new experiment |  |

## The precise delta being funded

The contract-arena evolution is **not** re-deriving any of the earned negatives. It is crossing a genuinely different hypothesis:

> "Does a contract-grounded exogenous correctness object (typed predicates, behavior specs, rubrics) — used as the *definition* of winner rather than as a post-hoc oracle — change which candidate wins, measured on held-out truth?"

STZ's experiments were all built around a sealed test suite as the primary selection signal and a separate truth oracle as the measurement instrument. The suite was always constructed from functional test cases. What was never tested is whether a formally typed contract (predicates, pre/post conditions, architecture rules) used as the *primary* selection gate — before test execution, not as a supplement to it — changes the ceiling .

This is structurally distinct from the proved negatives because it changes the selection object, not the selection weight . The numeric-gene negative proved that reweighting sealed-derived signals cannot reach the truth-best specimen. The contract plane proposes an entirely different signal class: typed predicate satisfaction and architectural conformance, which are not derivable from a functional test suite.

## One concrete safeguard to add immediately

PAPER.md's discipline section flags the symmetric-error rule as the most important guard . The new implementation plan should pre-register the contract-arena hypothesis with a separation gate test before any build begins: confirm that a naive-but-plausible implementation passes the functional sealed suite but fails at least one contract predicate or spec check. If no such separation exists, the contract layer adds no new selection signal and will reproduce the test-sharpening ceiling at higher cost .

That is the exact STZ separation gate pattern applied to the new hypothesis class — and it is the cheapest possible insurance against building a 10× more expensive version of the same null.

---

### Where Models Agree

| Finding | GPT-5.5 Thinking | Claude Opus 4.8 Thinking | GLM-5.2 | Evidence |
| :-- | :-- | :-- | :-- | :-- |
| `PLAN.md` was not directly retrievable, so recommendations must be grounded in prior thread + repo evidence | ✓ | ✓ |  | Both GPT-5.5 Thinking and Claude Opus 4.8 Thinking explicitly report they could not access `experiments/0.9.6-evolution/PLAN.md` and therefore anchored on `PAPER.md`, `EXPERIMENT-SUMMARY.md`, and thread context |
| STZ must not re-open already falsified paths like per-slice iteration, judge-as-loop, or sealed-derived reweighting | ✓ | ✓ |  | Both GPT-5.5 Thinking and Claude Opus 4.8 Thinking center the recommendation on preserving earned negatives from `PAPER.md` rather than rebuilding them in a more elaborate form |
| The main funded delta should be a new correctness signal class, not more search | ✓ | ✓ |  | GPT-5.5 Thinking recommends “contract compiler and arena verifier,” while Claude Opus 4.8 Thinking recommends replacing sealed-suite-as-correctness-object with an exogenous contract object |
| 0.9.6 should preserve STZ’s discipline: sealed/truth separation, promotion gates, and bounded persistence | ✓ | ✓ |  | Both models explicitly preserve the five-gate promotion logic, sealed/truth separation, and bounded artifact promotion as core design invariants |
| Typed contract artifacts—predicates, specs, rubrics, traceability—are the strongest next implementation axis | ✓ | ✓ |  | Both models independently converge on requirements/predicates/specs/rubrics as the non-falsified path for 0.9.6 |
| A separation-gate experiment for the new contract layer is mandatory before heavy build-out | ✓ | ✓ |  | Both models recommend a preflight where naive code passes the good-faith sealed suite but fails a contract predicate/spec, proving a genuinely new signal class |

### Where Models Disagree

| Topic | GPT-5.5 Thinking | Claude Opus 4.8 Thinking | GLM-5.2 | Why They Differ |
| :-- | :-- | :-- | :-- | :-- |
| Response completeness | Detailed staged architecture and implementation ladder | More compressed strategic recommendation | No substantive answer; only emitted a search tool call stub | GPT-5.5 Thinking chose to synthesize an end-state design despite missing `PLAN.md`, while Claude Opus 4.8 Thinking stayed closer to a narrower convergence memo; GLM-5.2 did not return usable synthesis |
| Framing of 0.9.6 | “Contract compiler and arena verifier” | “Replace sealed-suite-as-correctness-object with exogenous contract object” | No position | The first emphasizes implementation structure; the second emphasizes epistemic shift in correctness definition. These are compatible but framed differently |
| Scope of recommended build | Multi-stage ladder including arena, verifier triad, artifact promotion, and cross-slice amortization | Minimal funded delta plus mandatory preflight before any broader build | No position | GPT-5.5 Thinking optimizes for execution planning; Claude Opus 4.8 Thinking optimizes for avoiding wasted scope before proof-of-signal |

### Unique Discoveries

| Model | Unique Finding | Why It Matters |
| :-- | :-- | :-- |
| GPT-5.5 Thinking | Proposed a concrete 0.9.6 staged ladder: Stage A separation gate, Stage B arena integration, Stage C architecture rubric, Stage D promotion ledger, Stage E cross-slice amortisation | This is the clearest blueprint for sequencing implementation while minimizing wasted effort |
| GPT-5.5 Thinking | Suggested scoring candidates on execution, predicate/spec, architecture rubric, regression/safety, and patch economy with hard-gate overrides | This translates the contract idea into an actual selection |

<span style="display:none">[^12_1][^12_10][^12_100][^12_11][^12_12][^12_13][^12_14][^12_15][^12_16][^12_17][^12_18][^12_19][^12_2][^12_20][^12_21][^12_22][^12_23][^12_24][^12_25][^12_26][^12_27][^12_28][^12_29][^12_3][^12_30][^12_31][^12_32][^12_33][^12_34][^12_35][^12_36][^12_37][^12_38][^12_39][^12_4][^12_40][^12_41][^12_42][^12_43][^12_44][^12_45][^12_46][^12_47][^12_48][^12_49][^12_5][^12_50][^12_51][^12_52][^12_53][^12_54][^12_55][^12_56][^12_57][^12_58][^12_59][^12_6][^12_60][^12_61][^12_62][^12_63][^12_64][^12_65][^12_66][^12_67][^12_68][^12_69][^12_7][^12_70][^12_71][^12_72][^12_73][^12_74][^12_75][^12_76][^12_77][^12_78][^12_79][^12_8][^12_80][^12_81][^12_82][^12_83][^12_84][^12_85][^12_86][^12_87][^12_88][^12_89][^12_9][^12_90][^12_91][^12_92][^12_93][^12_94][^12_95][^12_96][^12_97][^12_98][^12_99]</span>

<div align="center">⁂</div>

[^12_1]: https://trends.tf/player/76561198046508636/maps

[^12_2]: https://www.flr-scca.com/_files/ugd/d479fa_fd8cb90b426d40128d3144bec5fb0bc3.pdf

[^12_3]: https://github.com/ErikGartner/google-hashcode17/blob/master/me_at_the_zoo.in

[^12_4]: https://csroyli.github.io/publications.html

[^12_5]: https://members.sagfoundation.org/programs

[^12_6]: https://forum.derivative.ca/uploads/short-url/tAzAYf37B76Y86EhP7dzBU0za5R.toe

[^12_7]: http://dirk.eddelbuettel.com/cranberries/2013/06/

[^12_8]: https://fightnews.info/fighters/robert-li

[^12_9]: https://bridgenz.co.nz/images/zoo/uploads/documents/Scorer-User-Manual.pdf

[^12_10]: https://www3.stat.sinica.edu.tw/statistica/oldpdf/A32n124.pdf

[^12_11]: https://tournament-sdk.com/docs

[^12_12]: https://arma.sourceforge.net/docs.html

[^12_13]: https://storylineonline.net/books/ricky-the-rock-that-couldnt-roll/

[^12_14]: https://github.com/Ruoyu-Li

[^12_15]: https://fpish.net/blogs

[^12_16]: https://github.com/batmanlab/Ladder

[^12_17]: https://github.com/dr-robert-li

[^12_18]: http://www.cs.toronto.edu/~liyi/host/files/phd-thesis.pdf

[^12_19]: https://gist.github.com/dr-robert-li?direction=desc\&sort=created

[^12_20]: https://github.com/chotchki/claude-plan-bridge

[^12_21]: https://github.com/rl-tools/zoo-runs-ci

[^12_22]: https://github.com/eladb3/ORViT/blob/master/MODEL_ZOO.md

[^12_23]: https://github.com/worldbench/RoboBEV/tree/master/zoo

[^12_24]: https://github.com/chenxin-dlut/SUTrack/blob/main/MODEL_ZOO.md

[^12_25]: https://github.com/source-foundry/Slice/actions

[^12_26]: https://github.com/DLR-RM/rl-baselines3-zoo/blob/master/CHANGELOG.md

[^12_27]: https://gist.github.com/lssf/2d58ec808667d9012b71ac45c26b0b05

[^12_28]: https://github.com/coldmanck/VidHOI/blob/master/MODEL_ZOO.md

[^12_29]: https://github.com/chinesehuazhou/python-whydo/blob/master/zh_CN/21-why-don't-Python-slices-index-out-of-bounds.md

[^12_30]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9126690/

[^12_31]: https://pythonot.github.io/gen_modules/ot.sliced.html

[^12_32]: https://github.com/MarcoLugo/axelrod

[^12_33]: https://hubfs.net/blogs/Some/1/programming/0/

[^12_34]: https://openscholarship.wustl.edu/context/etd/article/2046/viewcontent/Watsa_wustl_0252D_11030.pdf

[^12_35]: https://pkg.go.dev/github.com/tournify/tournify

[^12_36]: https://research-information.bris.ac.uk/ws/portalfiles/portal/429027758/tournament_v_circulant.pdf

[^12_37]: https://thedocs.worldbank.org/en/doc/298931576675393755-0240021978/render/WorldBankGroupArchivesFolder30124895.txt

[^12_38]: https://chessstats.app/player/1271495

[^12_39]: https://zoo-project.org/resources/download/

[^12_40]: https://opinvisindi.is/bitstreams/e45c4037-efac-4b11-be9a-156d3314d7b9/download

[^12_41]: https://www.jstatsoft.org/article/download/v014i06/59

[^12_42]: https://www.youtube.com/watch?v=AOABibzbOh4

[^12_43]: https://github.com/DLR-RM/rl-baselines3-zoo/releases

[^12_44]: https://zoo.dev/roadmap

[^12_45]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11698521/

[^12_46]: https://github.com/lindsaygelle/slice/blob/main/README.md

[^12_47]: https://gist.github.com/llandsmeer/2365efed9a43e3c76042222033744b01

[^12_48]: https://github.com/fireflysemantics/slice/blob/master/README.md

[^12_49]: https://github.com/simzou/iterated-prisoners-dilemma/blob/gh-pages/content.md

[^12_50]: https://leap-gmu.readthedocs.io/en/stable/roadmap.html

[^12_51]: https://github.com/dr-robert-li/crawl_enrich

[^12_52]: https://github.com/trunghng/deep_rl_zoo

[^12_53]: https://gist.github.com/chunhualiao/f90c48a0bdac24ba686c25c86150cca8

[^12_54]: https://github.com/google-deepmind/loft/blob/main/PROMPT_EXAMPLE.txt

[^12_55]: https://github.com/CSBXAI/slice_reproducibility

[^12_56]: https://openreview.net/forum?id=edYwO6bEJD

[^12_57]: https://arxiv.org/html/2604.16314v1

[^12_58]: https://arxiv.org/html/2505.22954v3

[^12_59]: https://arxiv.org/html/2604.00280v1

[^12_60]: https://arxiv.org/html/2601.04171v1

[^12_61]: https://arxiv.org/pdf/2306.02907.pdf

[^12_62]: https://medium.com/@adnanmasood/the-darwin-gödel-machine-open-ended-improvement-via-recursive-code-mutation-and-empirical-fitness-a777681d73e4

[^12_63]: https://iclr.cc/virtual/2026/poster/10011585

[^12_64]: https://arxiv.org/html/2408.15658v1

[^12_65]: https://www.youtube.com/watch?v=VaJ8CXyigJc

[^12_66]: https://labs.scale.com/blog/agentic-rubrics

[^12_67]: https://sakana.ai/dgm/

[^12_68]: https://github.com/jennyzzt/dgm

[^12_69]: https://www.youtube.com/watch?v=1XXxG6PqzOY

[^12_70]: https://www.youtube.com/watch?v=P7UtqEBg4IY

[^12_71]: https://huggingface.co/papers/2606.14249

[^12_72]: https://arxiv.org/html/2504.15228v2

[^12_73]: http://www.arxiv.org/abs/2507.00014

[^12_74]: https://openreview.net/pdf/ab6650dddaf7773f0699614de7d4ab980c255d9c.pdf

[^12_75]: https://icml.cc/virtual/2026/poster/61379

[^12_76]: https://www.anthropic.com/institute/recursive-self-improvement

[^12_77]: https://www.marktechpost.com/2025/04/29/can-coding-agents-improve-themselves-researchers-from-university-of-bristol-and-igent-ai-propose-sica-self-improving-coding-agent-that-iteratively-enhances-its-own-code-and-performance/

[^12_78]: https://posttrain.dev/blog/why-trajectory-review

[^12_79]: https://github.com/bingreeky/MemEvolve

[^12_80]: https://codex.danielvaughan.com/2026/06/18/harnessx-composable-evolvable-agent-harness-foundry-codex-cli-configuration-evolution-patterns/

[^12_81]: https://tianpan.co/blog/2026-04-10-self-modifying-agent-horizon

[^12_82]: https://www.linkedin.com/posts/maksym-andriushchenko_today-we-release-posttrainbench-v10-and-activity-7437561409762258944-qOUL

[^12_83]: https://www.youtube.com/watch?v=IA5KIeO8K_A

[^12_84]: https://www.youtube.com/watch?v=qrftPJqMT7E

[^12_85]: https://www.emergentmind.com/topics/self-improving-coding-agent-sica

[^12_86]: https://www.youtube.com/watch?v=4qcWgPb-8Fk

[^12_87]: https://aclanthology.org/2025.realm-1.30/

[^12_88]: https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/

[^12_89]: https://agentmarketcap.ai/blog/2026/04/08/openai-halts-swe-bench-benchmark-contamination-crisis

[^12_90]: https://www.themoonlight.io/en/review/from-knowledge-to-noise-ctim-rover-and-the-pitfalls-of-episodic-memory-in-software-engineering-agents

[^12_91]: https://www.turing.com/blog/exploring-alphaevolve

[^12_92]: https://www.youtube.com/watch?v=0HaUD_olwQU\&list=WL\&index=6

[^12_93]: https://www.mexc.co/news/845299

[^12_94]: https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/

[^12_95]: https://byteiota.com/openai-abandons-swe-bench-verified-59-flawed-tests/

[^12_96]: https://www.youtube.com/watch?v=0RP0x2f9OLM

[^12_97]: https://x.com/OpenAIDevs/status/2026002219909427270

[^12_98]: https://aistart.ai/ainews/openai-drops-swe-bench-verified-contamination

[^12_99]: https://codingfleet.com/blog/swe-bench-pro-explained-the-new-standard-for-ai-coding-benchmarks-2026/

[^12_100]: https://www.youtube.com/watch?v=_BJwkGJuXc4


---

# Based on the entire thread's discussion thus far, exhaustively explore and converge on an implementation recommendation to evolve STZ to align with slice-tournament-zoo/experiments/0.9.6-evolution/PLAN.md

Answer skipped.

---

## Where Models Agree

| Finding | GPT-5.5 Thinking | Claude Opus 4.8 Thinking | GLM-5.2 | Evidence |
| :-- | :-- | :-- | :-- | :-- |
| STZ should converge on a three-plane architecture: Contract, Arena, Ledger | ✓ | ✓ | ✓ | PLAN.md centers the design on Contract/Arena/Ledger, matching typed harness and auditability patterns in HarnessX and verification-first literature |
| Tests alone are insufficient; STZ needs a verifier triad with execution, contract/spec, and rubric signals | ✓ | ✓ | ✓ | Agentic Rubrics shows rubric-based gains and catches issues tests miss; VeriAct shows verifier pass rates alone are not enough without correctness/completeness checks |
| Persistence must be typed, promotion-gated, and never directly writable by candidate sub-agents | ✓ | ✓ | ✓ | Reward-hacking and self-improvement work consistently require sandboxing, human oversight, and guarded acceptance operators[^14_1][^14_2][^14_3] |
| Selective retrieval from promoted artifacts is safer than broad episodic memory injection | ✓ | ✓ | ✓ | CTIM-Rover found episodic memory degraded SWE performance; SWE-Bench-CL and MemEvolve support structured, selective memory and continual evaluation[^14_4][^14_5][^14_6] |
| Evolution should act on typed harness primitives and low-blast-radius genes first, not global prompt mutation | ✓ | ✓ | ✓ | HarnessX formalizes harnesses as composable typed primitives; its gains come from structured adaptation, gating, and variant isolation[^14_7] |
| STZ should claim project-local continual improvement, validated on chronological held-out issue streams, not generic RSI or public benchmark gains | ✓ | ✓ | ✓ | SWE-Bench-CL motivates chronological continual metrics, while OpenAI’s SWE-bench Verified audit argues public benchmark gains are now unreliable as frontier evidence[^14_5][^14_8] |

## Where Models Disagree

| Topic | GPT-5.5 Thinking | Claude Opus 4.8 Thinking | GLM-5.2 | Why They Differ |
| :-- | :-- | :-- | :-- | :-- |
| Primary first implementation focus | Contract kernel first | Write-guard + artifact store first | Verifier triad first | GPT-5.5 Thinking prioritizes semantic boundedness before code search; Claude Opus 4.8 Thinking weights safety and persistence boundaries as the prerequisite; GLM-5.2 emphasizes immediate improvement leverage from better ranking signals |
| Depth of formal specification in v1 | Spec-Harness-lite with executable predicates | Narrow behavior specs plus traceability, avoiding heavy formalism early | More aggressive contract/spec synthesis from the start | The difference comes from how each model weights VeriAct’s formal-spec lesson versus implementation complexity for repo-scale productization |
| How much topology evolution to expose early | Minimal, mostly fixed role set initially | Fixed core roles plus post-run role discovery hooks | Earlier specialist-role discovery and topology search | Claude Opus 4.8 Thinking gives more weight to coordination tax and wants stable roles first; GLM-5.2 leans more on ABSTRAL’s EC3 role discovery and variant exploration[^14_9] |
| Role of memory architecture evolution in 0.9.6 | Defer to later phase; retrieval only in 0.9.6 | Include retrieval as promoted artifact, but not full meta-memory evolution | Add Encode/Store/Retrieve/Manage hooks early | All models accept structured retrieval, but differ on how much of MemEvolve’s architecture should be productized in the first aligned implementation[^14_6] |
| Claude Code integration surface | Plugin plus local repo `.stz/` control plane | Plugin, hooks, commands, and sub-agents, with minimal MCP initially | Plugin plus MCP-first control plane | The disagreement reflects different assumptions about operational complexity versus extensibility using Claude Code plugins, hooks, sub-agents, and MCP surfaces[^14_10][^14_11][^14_12] |

## Unique Discoveries

| Model | Unique Finding | Why It Matters |
| :-- | :-- | :-- |
| Claude Opus 4.8 Thinking | STZ should treat contract traceability edges as first-class promotion targets, not just supporting metadata | This makes contract evolution auditable and helps convert edge-case discovery into durable project knowledge |
| GPT-5.5 Thinking | Promotion decisions should require at least one non-test verifier to support a win | This is a strong anti-Goodhart rule that directly addresses STZ’s current “test sharpening” ceiling |
| GLM-5.2 | STZ should keep an explicit “explore-first” arena mode where outputs are valuable for contract proposals but ineligible for automatic promotion[^14_1] | This preserves creative search without contaminating trusted state and gives you a safe channel for edge-case discovery |

## Comprehensive Analysis

The strongest high-confidence conclusion is that STZ should evolve into exactly the shape described in `0.9.6-evolution/PLAN.md`: a **contract-driven arena harness** with three planes—Contract, Arena, and Ledger—implemented as a Claude Code plugin-layer product rather than as a loose experimental harness. GPT-5.5 Thinking, Claude Opus 4.8 Thinking, and GLM-5.2 all converge on that core architectural move because it directly resolves the failure mode you already observed in the current harness: tests can be improved, but the system does not reliably improve software outcomes unless “what counts as correct and well-architected” exists as a bounded object outside the candidate loop. HarnessX reinforces this by showing that agent progress is not just about the base model; typed runtime harness composition and structured adaptation are themselves a major optimization lever, with average gains of +14.5% and up to +44.0% when the harness is treated as a first-class object rather than static scaffolding.[^14_7]

A second high-confidence finding is that the **verifier triad is the non-negotiable fulcrum** for 0.9.6. Agentic Rubrics demonstrates that repository-grounded rubric generation improves SWE agent evaluation and surfaces quality issues tests do not capture, with at least a +3.5 percentage-point improvement over strong baselines in the paper’s setup. VeriAct adds the stronger caution: even when a verifier accepts a specification, that specification may still be wrong or incomplete, which is why it introduces Spec-Harness to measure correctness and completeness beyond raw verifiability. Claude Opus 4.8 Thinking and GPT-5.5 Thinking both interpret that as direct evidence that STZ should stop treating test passing as the sole reward surface. Instead, execution, contract/spec predicates, and rubric-based architectural review should jointly determine candidate selection and all later promotions. In practical terms, that means `PLAN.md` is pointing in the right direction: contract slices, predicates, behavior specs, and rubrics are not supporting extras—they are the core bounded objects that turn the arena into a disciplined search space.

A third reliable finding is that **persisted learning must be typed, promotion-gated, and sharply separated from exploration artifacts**. This is where your proposed Ledger plane is more than a logging system. DGM, SICA, and AlphaEvolve all show that self-improving loops can produce meaningful gains when changes are evaluated empirically and archived rather than blindly accumulated. But reward-hacking evidence from PostTrainBench and the Reward Hacking Benchmark shows that increasingly capable agents will exploit weak evaluators, hidden proxies, and tool loopholes if they can influence trusted state directly. That is why Claude Opus 4.8 Thinking strongly favors putting write-guards and artifact namespaces first: candidate agents should write only to quarantined candidate areas, and promotion into `promoted/` should require a separate decision engine plus ledger evidence. This is also why GLM-5.2’s unique emphasis on an `explore-first` mode matters: it gives STZ a deliberate space for high-creativity search, but without allowing that channel to mutate trusted behavior by default.[^14_1][^14_2][^14_3][^14_13][^14_14]

The main area of divergence among the models is **implementation order**, not target architecture. GPT-5.5 Thinking wants the Contract plane first because it sees semantic boundedness as the hardest problem: until the system has requirements, predicates, specs, rubrics, and traceability edges, the arena has no real target other than the test suite. Claude Opus 4.8 Thinking instead prioritizes write-guards and artifact stores because it views unsafe persistence as the most dangerous short-term failure mode; if candidate outputs can still silently alter future runs, then any higher-level contract work is sitting on an unstable substrate. GLM-5.2 puts more emphasis on the verifier triad as the immediate quality lever, arguing that better selection pressure will create visible improvement soonest. These are all defensible interpretations of the same evidence. The way to reconcile them is to treat Phase 0 and Phase 1 as a combined “control kernel” milestone: implement write-guards, artifact typing, and ledger shells together with the minimal contract kernel, so that the first arena runs are both bounded and meaningful.[^14_3]

Another significant divergence is how ambitious STZ should be with **formal specification and topology evolution** in the 0.9.6 alignment. GPT-5.5 Thinking and Claude Opus 4.8 Thinking both prefer a pragmatic Spec-Harness-lite—behavior specs and predicates around touched symbols, state transitions, and invariants—rather than attempting repo-wide formalism early. That stance is backed by implementation realism: VeriAct proves the importance of correctness/completeness checking, but it does not imply you should bring full formal methods to every STZ slice from day one. GLM-5.2 is more willing to push aggressive role discovery and topology exploration earlier, leaning on ABSTRAL’s contrastive trace analysis and specialist-role discovery results. But ABSTRAL also quantifies the multi-agent coordination tax at only 26% turn efficiency under fixed budgets, with many tasks exhausting turn limits. That makes Claude Opus 4.8 Thinking’s caution persuasive: for 0.9.6, the best move is to keep a stable initial role topology—Contract Architect, Clarifier, Test Synthesizer, Spec Synthesizer, Rubric Author, Candidate Patcher, Edge Explorer, Rubric Judge, Contract Verifier, Promoter, Ledger Keeper—while instrumenting traces so that specialist-role discovery can become a later promotion path rather than an immediate destabilizer.[^14_9]

The most important unique insights are about **traceability, anti-Goodhart promotion rules, and safe exploration modes**. Claude Opus 4.8 Thinking’s emphasis on traceability edges as first-class objects is especially strong because it upgrades contract evolution from “a better document” to “a verifiable graph of requirement → predicate → test/spec → code evidence,” which is precisely what lets STZ turn edge exploration into durable knowledge rather than just sharper tests. GPT-5.5 Thinking’s suggestion that promotions require at least one non-test verifier to support the win is also compelling because it directly attacks the ceiling you already described: if promotion can happen from test delta alone, STZ will keep selecting for test-aware artifacts rather than genuinely better software engineering. GLM-5.2’s `explore-first` mode recommendation is similarly useful. It gives you a formal product lane for novelty search, weird heuristics, and edge hunting without forcing every experimental artifact into the same trust pipeline as contract-backed improvements.[^14_1]

Putting all of this together, the converged recommendation is to implement **STZ 0.9.6 as a Claude Code plugin-backed control plane that realizes the Contract/Arena/Ledger design exactly, but with a very disciplined first cut**. Concretely, the first release should include: a write-guarded `.stz/` repo control plane; typed contract artifacts for requirements, predicates, specs, rubrics, and architecture rules; arena runs with isolated worktrees and candidate directories; a mandatory verifier triad; a JSONL ledger with promotion, quarantine, reject, and sunset flows; selective retrieval from promoted artifacts only; and chronological held-out evals that compare stateless vs stateful manifests over a per-project issue stream. Evolution in this version should be restricted to low-blast-radius genes such as candidate fanout, slice granularity, verifier weights, retrieval top-k, repair thresholds, and mode-selection heuristics, following the HarnessX logic of typed compositional evolution rather than unconstrained prompt mutation. Public benchmark wins should be treated as secondary or illustrative only, because OpenAI’s SWE-bench Verified analysis makes clear that contaminated public coding benchmarks are no longer trustworthy north stars for frontier-quality claims.[^14_10][^14_5][^14_8][^14_11][^14_12][^14_7]

The practical recommendation is therefore: **build 0.9.6 in the order “control kernel → contract kernel → arena runner → verifier triad → ledger/promotion → retrieval → contract evolution → safe primitive evolution.”** That sequence best reconciles the models’ disagreements while staying faithful to the strongest evidence from PLAN.md, HarnessX, Agentic Rubrics, VeriAct, CTIM-Rover, SWE-Bench-CL, and the reward-hacking literature. If you follow that path, STZ stops being a harness that mainly sharpens tests and becomes a bounded project-local improvement system that can legitimately accumulate engineering knowledge, discover edge cases, and improve future outcomes without losing auditability or control.[^14_4][^14_5][^14_14][^14_7][^14_3]

**Recommendation:** align STZ to `0.9.6-evolution/PLAN.md` by treating the plan as the product spec, not a research note: implement the three planes, enforce non-writable trusted state, ship the verifier triad before any ambitious self-evolution claims, and make all persistence promotion-gated and per-project. That is the narrowest architecture that preserves the tournament-zoo creativity you built while making the improvement loop defensible and actually useful.[^14_7]
<span style="display:none">[^14_100][^14_101][^14_102][^14_103][^14_104][^14_105][^14_106][^14_107][^14_108][^14_109][^14_110][^14_111][^14_112][^14_113][^14_114][^14_115][^14_116][^14_117][^14_118][^14_119][^14_120][^14_121][^14_122][^14_123][^14_124][^14_125][^14_126][^14_127][^14_128][^14_129][^14_130][^14_131][^14_132][^14_133][^14_134][^14_135][^14_136][^14_137][^14_138][^14_139][^14_140][^14_141][^14_142][^14_143][^14_144][^14_145][^14_146][^14_147][^14_148][^14_149][^14_15][^14_150][^14_151][^14_152][^14_153][^14_154][^14_155][^14_156][^14_157][^14_158][^14_159][^14_16][^14_160][^14_161][^14_162][^14_163][^14_164][^14_165][^14_166][^14_167][^14_168][^14_169][^14_17][^14_170][^14_171][^14_172][^14_173][^14_174][^14_175][^14_176][^14_177][^14_178][^14_18][^14_19][^14_20][^14_21][^14_22][^14_23][^14_24][^14_25][^14_26][^14_27][^14_28][^14_29][^14_30][^14_31][^14_32][^14_33][^14_34][^14_35][^14_36][^14_37][^14_38][^14_39][^14_40][^14_41][^14_42][^14_43][^14_44][^14_45][^14_46][^14_47][^14_48][^14_49][^14_50][^14_51][^14_52][^14_53][^14_54][^14_55][^14_56][^14_57][^14_58][^14_59][^14_60][^14_61][^14_62][^14_63][^14_64][^14_65][^14_66][^14_67][^14_68][^14_69][^14_70][^14_71][^14_72][^14_73][^14_74][^14_75][^14_76][^14_77][^14_78][^14_79][^14_80][^14_81][^14_82][^14_83][^14_84][^14_85][^14_86][^14_87][^14_88][^14_89][^14_90][^14_91][^14_92][^14_93][^14_94][^14_95][^14_96][^14_97][^14_98][^14_99]</span>

<div align="center">⁂</div>

[^14_1]: https://arxiv.org/abs/2505.22954

[^14_2]: https://arxiv.org/abs/2606.14249

[^14_3]: https://agyn.io/blog/ai-self-improvement-2026

[^14_4]: https://arxiv.org/html/2505.22954v2

[^14_5]: https://arxiv.org/html/2606.14249v1

[^14_6]: https://openreview.net/pdf?id=OsPQ6zTQXV

[^14_7]: https://sakana.ai/dgm/

[^14_8]: https://x.com/dair_ai/status/2066563390538178784

[^14_9]: https://www.anthropic.com/institute/recursive-self-improvement

[^14_10]: https://github.com/jennyzzt/dgm

[^14_11]: https://www.youtube.com/watch?v=e_R5ou-tGN4\&vl=ko

[^14_12]: https://recursive-workshop.github.io/papers.html

[^14_13]: https://arxiv.org/pdf/2505.02888.pdf

[^14_14]: https://aclanthology.org/2025.acl-long.1354.pdf

[^14_15]: https://arxiv.org/abs/2506.13131

[^14_16]: https://arxiv.org/abs/2509.07367

[^14_17]: https://arxiv.org/html/2509.07367v1

[^14_18]: https://huggingface.co/papers/2606.14249

[^14_19]: https://arxiv.org/html/2606.14249

[^14_20]: https://arxiv.org/html/2604.00280v1

[^14_21]: https://claude.com/plugins/mcp-server-dev

[^14_22]: https://code.claude.com/docs/en/plugins-reference

[^14_23]: https://github.com/anthropics/claude-plugins-official/blob/main/plugins/plugin-dev/skills/plugin-structure/SKILL.md?plain=1

[^14_24]: https://dev.to/klement_gunndu/how-git-worktrees-let-claude-code-agents-run-in-true-isolation-1m4d

[^14_25]: https://dev.classmethod.jp/en/articles/claude-code-skills-subagent-plugin-guide/

[^14_26]: https://www.youtube.com/watch?v=z_VI51k-tn0\&vl=es

[^14_27]: https://code.claude.com/docs/en/worktrees

[^14_28]: https://openreview.net/forum?id=edYwO6bEJD

[^14_29]: https://arxiv.org/abs/2604.00280

[^14_30]: https://arxiv.org/abs/2605.02964

[^14_31]: https://icml.cc/virtual/2026/poster/63667

[^14_32]: https://www.reddit.com/r/ClaudeAI/comments/1nqpcef/a_hook_that_guarantees_claude_code_always_spawns/

[^14_33]: https://resources.anthropic.com/hubfs/Claude Code Advanced Patterns_%20Subagents,%20MCP,%20and%20Scaling%20to%20Real%20Codebases.pdf

[^14_34]: PLAN.md

[^14_35]: https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/

[^14_36]: https://platform.claude.com/docs/fr/agent-sdk/plugins

[^14_37]: https://github.com/anthropics/claude-code/blob/main/plugins/README.md

[^14_38]: https://zenodo.org/records/18152531

[^14_39]: https://harrisonaix.com/kiro-review/

[^14_40]: https://noqta.tn/en/blog/kiro-aws-agentic-ide-spec-driven-development-guide-2026

[^14_41]: https://arxiv.org/abs/2601.04171

[^14_42]: https://aclanthology.org/2025.realm-1.30/

[^14_43]: https://www.themoonlight.io/en/review/from-knowledge-to-noise-ctim-rover-and-the-pitfalls-of-episodic-memory-in-software-engineering-agents

[^14_44]: https://arxiv.org/abs/2507.00014

[^14_45]: https://www.alphaxiv.org/overview/2512.18746v1

[^14_46]: https://www.youtube.com/watch?v=0HaUD_olwQU\&themeRefresh=1\&time_continue=60

[^14_47]: https://code.claude.com/docs/en/mcp

[^14_48]: https://www.anthropic.com/engineering/desktop-extensions

[^14_49]: https://code.claude.com/docs/en/hooks

[^14_50]: https://arxiv.org/html/2505.22954v3

[^14_51]: https://www.marktechpost.com/2025/04/29/can-coding-agents-improve-themselves-researchers-from-university-of-bristol-and-igent-ai-propose-sica-self-improving-coding-agent-that-iteratively-enhances-its-own-code-and-performance/

[^14_52]: https://arxiv.org/html/2603.22791v1

[^14_53]: https://arxiv.org/pdf/2603.22791.pdf

[^14_54]: https://github.com/Liqs-v2/ctim-rover

[^14_55]: https://slashpage.com/haebom/943zqpmqr5j7q2wnvy87

[^14_56]: https://icml.cc/virtual/2026/poster/61379

[^14_57]: https://www.mexc.com/it-IT/news/845299

[^14_58]: https://www.emergentmind.com/topics/alphaevolve-framework

[^14_59]: https://www.youtube.com/watch?v=CgfUor2rcBg

[^14_60]: https://arxiv.org/html/2504.15228v2

[^14_61]: https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/

[^14_62]: https://tianpan.co/blog/2026-04-10-self-modifying-agent-horizon

[^14_63]: https://www.youtube.com/watch?v=P7UtqEBg4IY

[^14_64]: https://www.youtube.com/watch?v=yT102za4OjU

[^14_65]: https://ai.meta.com/research/publications/hyperagents/

[^14_66]: https://x.com/SakanaAILabs/status/1928272612431646943

[^14_67]: https://www.youtube.com/watch?v=d50G1FMEFPM

[^14_68]: https://marcovcsiliconvalley.substack.com/p/alphaevolve-google-deepminds-self

[^14_69]: https://arxiv.org/pdf/2604.16314.pdf

[^14_70]: https://medium.com/agentic-minds/alphaevolve-the-birth-of-self-improving-ai-and-the-dawn-of-algorithmic-discovery-de37a5793e69

[^14_71]: https://www.youtube.com/watch?v=9MYFww1XhxQ

[^14_72]: https://medium.com/@krishna1072/ai-that-evolves-itself-inside-alphaevolve-and-what-it-means-for-the-future-904e840345ff

[^14_73]: https://www.youtube.com/watch?v=1XXxG6PqzOY

[^14_74]: https://medium.com/@AIchats/darwin-gödel-machines-a-self-improving-ai-8b5074de161a

[^14_75]: https://www.youtube.com/watch?v=KptCerr9D5I

[^14_76]: https://medium.com/@adnanmasood/the-darwin-gödel-machine-open-ended-improvement-via-recursive-code-mutation-and-empirical-fitness-a777681d73e4

[^14_77]: https://note.com/pocketstudio/n/nd3046ef337f9

[^14_78]: https://chatpaper.com/zh-CN/paper/263555

[^14_79]: https://codex.danielvaughan.com/2026/06/18/harnessx-composable-evolvable-agent-harness-foundry-codex-cli-configuration-evolution-patterns/

[^14_80]: https://arxiv.org/html/2601.04171v1

[^14_81]: https://openreview.net/forum?id=adFxAxDiT7

[^14_82]: https://www.themoonlight.io/en/review/harnessx-a-composable-adaptive-and-evolvable-agent-harness-foundry

[^14_83]: https://iclr.cc/virtual/2026/papers.html

[^14_84]: https://www.youtube.com/watch?v=e_R5ou-tGN4\&vl=en

[^14_85]: https://iclr.cc/virtual/2026/poster/10007373

[^14_86]: https://www.linkedin.com/pulse/harnessx-turns-agent-harness-typed-object-you-can-compose-vj1pe

[^14_87]: https://www.alphaxiv.org/overview/2601.04171

[^14_88]: https://www.youtube.com/watch?v=IA5KIeO8K_A

[^14_89]: https://iclr.cc/media/iclr-2026/Slides/10018716.pdf

[^14_90]: https://arxiv.org/pdf/2604.14261v1.pdf

[^14_91]: https://github.com/thomasjoshi/agents-never-forget/

[^14_92]: https://openreview.net/pdf/c96b172c9688cc5c0699eaa77a049be3f9b940fb.pdf

[^14_93]: https://chatpaper.com/fr/chatpaper/paper/157194

[^14_94]: https://www.swebench.com/SWE-bench/

[^14_95]: https://ar5iv.labs.arxiv.org/html/2507.00014

[^14_96]: https://bemiagent.com/agents/posttrainbench-agent-en

[^14_97]: https://arxiv.org/pdf/2606.05661.pdf

[^14_98]: https://www.linkedin.com/posts/maksym-andriushchenko_today-we-release-posttrainbench-v10-and-activity-7437561409762258944-qOUL

[^14_99]: https://www.youtube.com/watch?v=nXo1isg_mJ4

[^14_100]: https://arxiv.org/html/2603.08640

[^14_101]: https://buttondown.com/signalhhmacedo/archive/signal-3-2026-w11/

[^14_102]: https://www.linkedin.com/posts/maksym-andriushchenko_were-releasing-posttrainbench-a-benchmark-activity-7407378165565812736-2Wzk

[^14_103]: https://arxiv.org/html/2510.16079v1

[^14_104]: https://sunchangsheng.com/blog/2026-02-09-mas-memory.html

[^14_105]: https://openreview.net/forum?id=sooLoD9VSf

[^14_106]: https://github.com/bingreeky/MemEvolve

[^14_107]: https://www.youtube.com/watch?v=oHtoTW16IAk

[^14_108]: https://www.alphaxiv.org/overview/2512.18746

[^14_109]: https://www.semanticscholar.org/paper/MemEvolve:-Meta-Evolution-of-Agent-Memory-Systems-Zhang-Ren/fc6e9b47819d2f5cdfd8f47829f7894d37e2059c

[^14_110]: https://www.themoonlight.io/en/review/memevolve-meta-evolution-of-agent-memory-systems

[^14_111]: https://www.academia.edu/145691662/MemEvolve_The_Meta_Evolutionary_Horizon_of_Agentic_Memory_Systems_and_the_Transition_from_Static_to_Self_Improving_Cognitive_Architectures

[^14_112]: https://www.linkedin.com/posts/pascalbiese_memevolve-meta-evolution-of-agent-memory-activity-7413161153691967488-qsFR

[^14_113]: https://arxiv.org/html/2604.10923

[^14_114]: https://www.youtube.com/watch?v=wO-GKqz3k6o

[^14_115]: https://arxiv.org/html/2604.16314v1

[^14_116]: https://arxiv.org/html/2510.16079v2

[^14_117]: https://iclr.cc/virtual/2026/poster/10010639

[^14_118]: https://icml.cc/virtual/2026/poster/65195

[^14_119]: https://www.augmentcode.com/tools/intent-vs-kiro

[^14_120]: https://app.daily.dev/posts/why-swe-bench-verified-no-longer-measures-frontier-coding-capabilities-yitnqurmf

[^14_121]: https://www.studioglobal.ai/ca/discover/answers/what-new-capabilities-did-aws-add-to-6a03e6eff85746692aeb4004

[^14_122]: https://codingfleet.com/blog/swe-bench-pro-explained-the-new-standard-for-ai-coding-benchmarks-2026/

[^14_123]: https://x.com/OpenAIDevs/status/2026002219909427270

[^14_124]: https://www.linkedin.com/posts/jatinganhotra_openai-just-published-a-strong-admission-activity-7432461085913362433-kZ1_

[^14_125]: https://www.codesota.com/browse/computer-code/code-generation/swe-bench

[^14_126]: https://www.mexc.co/news/845299

[^14_127]: https://www.linkedin.com/posts/hackerrank_openai-just-killed-swe-bench-verified-the-activity-7432807590759264256-xzhQ

[^14_128]: https://openai.com/ko-KR/index/why-we-no-longer-evaluate-swe-bench-verified/

[^14_129]: https://www.livingip.xyz/claims/iterative agent self-improvement produces compounding capability gains when evaluation is structurally separated from generation

[^14_130]: https://whale-alert.io/stories/e78e013990f1c3/OpenAI-audit-says-popular-SWE-bench-Verified-benchmark-is-contaminated-by-broken-tests-and-training-data-leakage-recommends-SWE-bench-Pro-and-private-evaluations

[^14_131]: https://www.youtube.com/watch?v=n-MrHiY8ga4

[^14_132]: https://agentmarketcap.ai/blog/2026/04/08/openai-halts-swe-bench-benchmark-contamination-crisis

[^14_133]: https://www.themoonlight.io/en/review/a-self-improving-coding-agent

[^14_134]: https://github.com/MaximeRobeyns/self_improving_coding_agent

[^14_135]: https://agentmarketcap.ai/blog/2026/04/07/swe-bench-pro-46-vs-verified-81-benchmark-contamination

[^14_136]: https://www.swebench.com

[^14_137]: https://www.youtube.com/watch?v=0RP0x2f9OLM

[^14_138]: https://www.morphllm.com/swe-bench-pro

[^14_139]: https://code.claude.com/docs/en/sub-agents

[^14_140]: https://www.youtube.com/watch?v=swzHEHd1l1o

[^14_141]: https://code.claude.com/docs/zh-TW/sub-agents

[^14_142]: https://code.claude.com/docs/en/agent-sdk/plugins

[^14_143]: https://tonsofskills.com/docs/concepts/commands-and-hooks

[^14_144]: https://code.claude.com/docs/id/sub-agents

[^14_145]: https://medium.com/@aserdargun/the-claude-developer-guide-agent-sdk-reference-typescript-sdk-db201fae7e16

[^14_146]: https://code.claude.com/docs/ko/sub-agents

[^14_147]: https://code.claude.com/docs/en/agent-sdk/overview

[^14_148]: https://www.vibecodingacademy.ai/free-claude-code-guide

[^14_149]: https://code.claude.com/docs/en/agent-sdk/hooks

[^14_150]: https://code.claude.com/docs/en/plugins

[^14_151]: https://www.themoonlight.io/en/review/autonomous-code-evolution-meets-np-completeness

[^14_152]: https://www.youtube.com/watch?v=YKIUt9ytxIE

[^14_153]: https://www.alphaxiv.org/overview/2509.07367v1

[^14_154]: https://code.claude.com/docs/it/mcp

[^14_155]: https://claudefa.st/blog/tools/mcp-extensions/plugins-distribution

[^14_156]: https://mcpmarket.com/tools/skills/claude-code-plugin-reference-2026

[^14_157]: https://code.claude.com/docs/fr/mcp

[^14_158]: https://code.claude.com/docs/de/mcp

[^14_159]: https://nimbalyst.com/blog/best-claude-code-mcp-servers/

[^14_160]: https://www.youtube.com/watch?v=-KusSduAP1A\&vl=en

[^14_161]: https://github.com/jmanhype/awesome-claude-code

[^14_162]: https://hidekazu-konishi.com/entry/claude_code_subagents_and_orchestration_guide.html

[^14_163]: https://www.youtube.com/watch?v=bOBURBZeBcg

[^14_164]: https://dev.to/_b6eedfa0c44fb8af59ed9/how-i-built-a-plugin-and-service-for-claude-code-agent-teams-1cn6

[^14_165]: https://getknack.ai/blog/claude-code-multi-agent-workflows

[^14_166]: https://claudeguide.io/claude-code-worktree-parallel

[^14_167]: https://www.youtube.com/watch?v=N7WphY-y6-8

[^14_168]: https://www.claudedirectory.org/blog/claude-code-worktrees-guide

[^14_169]: https://mcpmarket.com/ko/tools/skills/subagent-spawner-1

[^14_170]: https://www.developersdigest.tech/blog/claude-code-worktrees

[^14_171]: https://code.claude.com/docs/it/plugins-reference

[^14_172]: https://code.claude.com/docs/zh-TW/plugins-reference

[^14_173]: https://claude-news.today/en/briefings/briefing-2026-06-04/

[^14_174]: https://qiita.com/NaokiIshimura/items/47f4744e1b27d417ef54

[^14_175]: https://www.youtube.com/watch?v=z_VI51k-tn0

[^14_176]: https://code.claude.com/docs/zh-CN/plugins-reference

[^14_177]: https://thepromptshelf.dev/blog/claude-code-git-worktree-parallel-agents-2026/

[^14_178]: https://www.linkedin.com/pulse/claude-code-directory-architecture-complete-guide-its-rachit-lohani-gzhvc


---

# Provide an exhaustively detailed implementation plan based on this recommendation

Now I have sufficient material for the exhaustive implementation plan. Let me compose the full document.
<span style="display:none">[^15_1][^15_10][^15_11][^15_12][^15_13][^15_14][^15_15][^15_16][^15_17][^15_18][^15_19][^15_2][^15_20][^15_21][^15_22][^15_23][^15_24][^15_25][^15_26][^15_27][^15_28][^15_29][^15_3][^15_30][^15_31][^15_32][^15_33][^15_34][^15_35][^15_36][^15_37][^15_38][^15_39][^15_4][^15_40][^15_41][^15_42][^15_43][^15_44][^15_45][^15_46][^15_47][^15_48][^15_49][^15_5][^15_50][^15_51][^15_52][^15_53][^15_54][^15_55][^15_56][^15_57][^15_58][^15_6][^15_7][^15_8][^15_9]</span>

<div align="center">⁂</div>

[^15_1]: https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/

[^15_2]: https://www.emergentmind.com/topics/self-improving-coding-agent-sica

[^15_3]: https://arxiv.org/html/2604.16314v1

[^15_4]: https://llvm.org/devmtg/2025-10/slides/technical_talks/chen.pdf

[^15_5]: https://arxiv.org/html/2504.15228v2

[^15_6]: https://www.youtube.com/watch?v=9MYFww1XhxQ

[^15_7]: https://www.emergentmind.com/topics/alphaevolve-paradigm

[^15_8]: https://www.marktechpost.com/2025/04/29/can-coding-agents-improve-themselves-researchers-from-university-of-bristol-and-igent-ai-propose-sica-self-improving-coding-agent-that-iteratively-enhances-its-own-code-and-performance/

[^15_9]: https://agentpatterns.ai/verification/tdd-agent-development/

[^15_10]: https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/AlphaEvolve.pdf

[^15_11]: https://github.com/MaximeRobeyns/self_improving_coding_agent

[^15_12]: https://www.aihero.dev/skills-tdd

[^15_13]: https://interestingengineering.substack.com/p/the-loop-is-the-lab

[^15_14]: https://arxiv.org/html/2605.22794v1

[^15_15]: https://arxiv.org/abs/2511.12916

[^15_16]: https://icml.cc/virtual/2026/poster/61379

[^15_17]: https://arxiv.org/html/2505.22954v3

[^15_18]: https://arxiv.org/html/2603.22791v1

[^15_19]: https://github.com/bingreeky/MemEvolve

[^15_20]: https://github.com/jennyzzt/dgm

[^15_21]: https://www.youtube.com/watch?v=oHtoTW16IAk

[^15_22]: https://sakana.ai/dgm/

[^15_23]: https://www.emergentmind.com/topics/meta-evolving-architectures-memevolve

[^15_24]: https://medium.com/@adnanmasood/the-darwin-gödel-machine-open-ended-improvement-via-recursive-code-mutation-and-empirical-fitness-a777681d73e4

[^15_25]: https://knowledge.zhaoweiguo.com/build/html/x-paper/memorys/normals/2512.18746_memevolve

[^15_26]: https://www.youtube.com/watch?v=P7UtqEBg4IY

[^15_27]: https://www.linkedin.com/posts/pascalbiese_memevolve-meta-evolution-of-agent-memory-activity-7415694707202433025-wOjG

[^15_28]: https://arxiv.org/abs/2505.22954

[^15_29]: https://www.alphaxiv.org/overview/2512.18746v1

[^15_30]: https://sunchangsheng.com/blog/2026-02-09-mas-memory.html

[^15_31]: https://arxiv.org/pdf/2605.22794.pdf

[^15_32]: https://arxiv.org/html/2510.16079v2

[^15_33]: https://arxiv.org/pdf/2603.08640v1.pdf

[^15_34]: https://arxiv.org/abs/2510.16079

[^15_35]: https://arxiv.org/html/2603.08640v1

[^15_36]: https://gptget.net/papers/2605.22794?lang=en

[^15_37]: https://www.artifocial.ai/blog/ai-automating-ai-research-2026-mar-21

[^15_38]: https://github.com/tryigit/cleveres-ai/blob/main/papers/moss-self-evolution.md

[^15_39]: https://zylos.ai/research/2026-06-07-specification-gaming-reward-hacking-ai-agents/

[^15_40]: https://www.startuphub.ai/ai-news/ai-research/2026/moss-source-level-self-rewriting-for-agents

[^15_41]: https://arxiv.org/pdf/2605.02964.pdf

[^15_42]: https://www.youtube.com/watch?v=RmOcaUnA0b4

[^15_43]: https://discovery.niravjoshi.dev/entry/posttrainbench

[^15_44]: https://www.linkedin.com/posts/nishantha-ruwan-15b301b2_moss-self-evolution-through-source-level-activity-7463592218679808000-w_GJ

[^15_45]: https://moderncreator.app/2026-05-21-cole-medin-anthropic-just-dropped-a-masterclass-on-building-agent-harnesses-for-large-codebases

[^15_46]: https://arxiv.org/pdf/2603.22791.pdf

[^15_47]: https://mer.vin/2026/05/claude-code-architecture-explained-six-harness-layers-beyond-the-llm/

[^15_48]: https://gentic.news/article/claude-code-community-digest-jun-20-2026

[^15_49]: https://paddo.dev/blog/three-ways-deep-research-claude/

[^15_50]: https://code.claude.com/docs/en/sub-agents

[^15_51]: https://www.claudepluginhub.com/plugins/heretyc-subagent-mcp

[^15_52]: https://springvanta.com/blog/claude-code-number-one-mcp-enterprise-roadmap-2026

[^15_53]: https://wengjialin.com/blog/harness-ai-agent/

[^15_54]: https://wal.sh/research/2026-q2-claude-code-features/?t=1

[^15_55]: https://code.claude.com/docs/en/mcp

[^15_56]: https://arxiv.org/html/2604.14228

[^15_57]: https://zenn.dev/neotechpark/articles/3a806ff8364664

[^15_58]: https://www.youtube.com/watch?v=jzf7DQa2CAc


---

# Present the full document here as a markdown codeblock tabbed in so it doesn't break out with nested codeblocks

Good — I now have a full picture of the existing codebase structure (bridge.ts, harness.ts, types.ts, eval-runner.ts, selection.ts, specdiff.ts, grpo.ts, hack-detector.ts, judge-reliability.ts, merge.ts, etc.). Here is the full exhaustive implementation plan as a single indented markdown block so nested code fences don't escape:

````
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
````


---

### 1. Where Models Agree

| Finding | GPT-5.5 Thinking | Claude Opus 4.8 Thinking | Gemini 3.1 Pro Thinking | Evidence |
| :-- | :-- | :-- | :-- | :-- |
| Both plans overreach relative to current STZ and should not be implemented as written | ✓ | ✓ | ✓ | Attached plan analysis identifies major rebuild scope, speculative components, and mismatch with current tree[^17_1][^17_2] |
| The most defensible next step is to build on existing 0.9.5-era primitives rather than rebuild arena/ledger/retrieval from scratch | ✓ | ✓ | ✓ | ITERATIVE and PAPER-INFORMED both duplicate already-present planes like arena, promotion, and verification[^17_1][^17_2] |
| Human approval / acceptance is the strongest exogenous signal available for escaping sealed-test blindness | ✓ | ✓ | ✓ | ITERATIVE explicitly centers human acceptance for contract changes[^17_1]; HITL workflow patterns and PR acceptance evidence support this[^17_3][^17_4] |
| Claude Code subagents are markdown-defined workers plus hooks, so any implementation must account for text I/O, schema parsing, and hook-based enforcement | ✓ | ✓ | ✓ | Claude Code docs define subagents as markdown+YAML and hooks as the real interception point[^17_5][^17_6] |
| A contract/predicate layer is more implementable and novel than Python runtime spec capture, FAISS retrieval, or source-rewrite evolution | ✓ | ✓ | ✓ | ITERATIVE’s contract plane is the clearest bounded object[^17_1]; PAPER-INFORMED’s Python specs/FAISS/MemEvolve add heavy unsolved infra[^17_2] |

### 2. Where Models Disagree

| Topic | GPT-5.5 Thinking | Claude Opus 4.8 Thinking | Gemini 3.1 Pro Thinking | Why They Differ |
| :-- | :-- | :-- | :-- | :-- |
| How much of the iterative plan remains useful | Keep ~20%: contract kernel + human-accept gate + edge→predicate | Keep ~30–40%: contract kernel, rubric-lite, typed artifacts, selective retrieval later | Keep ~25%: contract plane plus minimal ledger additions | The difference is mostly in how much value they assign to rubric-lite and typed persistence before proving exogenous-signal lift[^17_1][^17_2] |
| Whether rubric verification should be in the first implementation tranche | Defer until after contract/human-accept probe | Include a minimal rubric judge early, but no full triad | Optional in tranche 1 if it reuses existing judge infra | Claude Opus 4.8 Thinking weights literature on rubric gains more heavily[^17_2], while GPT-5.5 Thinking and Gemini 3.1 Pro emphasize your repo-specific “known null” and duplication risk[^17_1] |
| Retrieval/memory timing | Defer entirely until positive signal from contract acceptance | Keep only file-backed promoted predicate retrieval, no semantic index | Defer vector/FAISS, maybe allow simple top-k text lookup later | Models differ on whether even lightweight retrieval helps before the new signal is validated; all reject FAISS now[^17_2] |
| Success metric for the next milestone | Human-accepted predicate promotions that improve downstream candidate selection | Human-accepted predicates plus at least one issue where contract ranking changes winner | Acceptance-rate delta and reduced reviewer rejection reasons in repo-local tasks | They differ because some weight internal harness behavior change, while others weight human review behavior as the true ground truth[^17_4][^17_7] |

### 3. Unique Discoveries

| Model | Unique Finding | Why It Matters |
| :-- | :-- | :-- |
| GPT-5.5 Thinking | The cleanest enforcement path is not a `WriteGuard` class but a mandatory “all trusted writes are emitted as events” refactor using Claude Code `PreToolUse`/`PostToolUse` hooks as audit and deny points[^17_6] | This resolves your specific criticism that the proposed WriteGuard is a no-op stub |
| Claude Opus 4.8 Thinking | Claude Code’s `isolation: worktree` and scoped subagent tool permissions let you preserve the tournament-zoo ontology without a monorepo/package split[^17_5] | This gives a direct way to keep the useful arena metaphor while avoiding rebuild churn |
| Gemini 3.1 Pro Thinking | PR acceptance literature is mixed: one large MSR 2026 result says human PRs are nearly 9x more likely to be accepted than agentic PRs, while another study reports 83.8% acceptance for Claude Code PRs[^17_4][^17_8] | This suggests “human acceptance asymmetry” is real, but measurement must be repo- and workflow-specific rather than assumed globally |

### 4. Comprehensive Analysis

The high-confidence conclusion is that your critique is substantially correct: both the PAPER-INFORMED and ITERATIVE plans contain useful architectural ideas, but as written they are too large, too speculative, and too duplicative of what STZ already has to be the right next move for `slice-tournament-zoo`. All models converged on the same core diagnosis: the proposed rebuild spends most of its budget recreating planes that already exist in some form—arena orchestration, selection, verification, manifests, promotion logic, and gene-like tuning—without first validating the only genuinely new signal that could move STZ past its current ceiling. That matters because your own repository history already established a “known null”: stateful gain over stateless baseline on homogeneous pools is not enough by itself, so another elaborate statefulness scaffold is likely to produce more infrastructure than lift.[^17_1][^17_2]

A second area of strong agreement is that the exogenous signal problem is the architectural bottleneck. The research on AlphaEvolve consistently points to objective evaluators as the condition that makes iterative improvement meaningful. PostTrainBench provides the inverse lesson: when agents can optimize against weak or self-shaped proxies, reward hacking appears quickly, including direct cheating behaviors and benchmark gaming. In your context, the most realistic exogenous signal is not a generic hidden test set or a grand verifier stack; it is human acceptance asymmetry attached to project-local contract artifacts and pull-request-like review outcomes. The attached iterative plan already gestures toward this with the proposed→accepted contract transition and the explicit asymmetry that only humans can approve contract changes. That is the novel lever worth preserving.[^17_9][^17_10][^17_11][^17_4][^17_12][^17_1]

A third high-confidence finding is that Claude Code’s real operational model constrains what is implementable. Both the user critique and the council align that the earlier plan blurred the distinction between conceptual sub-agents and actual Claude Code subagents. Claude Code subagents are markdown files with YAML frontmatter, controlled tool scopes, optional worktree isolation, and text outputs; they are not typed TypeScript functions returning structured objects by default. Hooks are the real enforcement surface for blocking or auditing actions, not hand-wavy wrapper classes. That means any viable redesign must be built around: markdown-defined agents, explicit output schemas, parser/validator/retry loops, and hook-mediated permission or audit boundaries. This is also why the original `WriteGuard` proposal was rightly criticized as non-binding: unless trusted writes are routed through a central audited path—or denied at hook time—it is a documentation pattern, not a safety mechanism.[^17_2][^17_5][^17_6]

The main divergence among models is not about the direction, but about scope of the first implementation tranche. Claude Opus 4.8 Thinking is slightly more optimistic about retaining a minimal rubric layer early because recent agentic rubric research suggests verifier diversity can materially improve ranking quality. GPT-5.5 Thinking and Gemini 3.1 Pro Thinking are more conservative: they argue that until the exogenous signal is proven in your repo, adding rubric systems mostly increases evaluator complexity and cost without resolving the core blindness. Both positions are defensible. The practical synthesis is to separate “contract verification” from “rubric scoring.” A typed predicate/contract system with human acceptance can go in tranche 1 because it is the new signal. A rubric-lite component can be added only if it reuses existing STZ judging infrastructure rather than introducing a fresh triad stack.[^17_1][^17_2]

Another area of divergence is retrieval timing. All models reject FAISS and heavy memory evolution now, and the user critique is especially strong here. The disagreement is only whether a tiny amount of retrieval should remain in scope. Claude Opus 4.8 Thinking sees value in simple file-backed retrieval of promoted predicates later in the first roadmap; GPT-5.5 Thinking and Gemini 3.1 Pro Thinking would defer even that until after there is evidence that accepted predicates help downstream selection. This difference comes from weighting different kinds of evidence: retrieval can help in theory, but current Claude Code and repo constraints make a naive implementation likely to recreate the memory-noise problem the broader literature warns about. Given your stated need to stay bounded and useful, deferring semantic retrieval is the safer call.[^17_2][^17_1]

The human-acceptance question deserves special treatment. The literature shows agent-generated pull requests still face significant acceptance and review challenges, with one MSR 2026 study finding substantially lower acceptance than human PRs and frequent failure to satisfy requested changes. Other observational work reports much higher acceptance rates for Claude Code-generated PRs in certain contexts. The council treated this not as contradiction but as a design clue: acceptance is highly workflow- and project-dependent. That means STZ should not use “human approval” as a vague governance slogan. It should encode specific human checkpoints: accept/reject predicate proposals, accept/reject promoted contract deltas, optionally accept/reject final candidate for a held-out issue class. Temporal-style human-in-the-loop patterns are useful here because they show how to pause durable workflows awaiting approval without keeping compute hot, and how to keep a complete audit trail of each decision. For your plugin harness, this can be done more simply than full Temporal adoption, but the workflow concept is directly relevant.[^17_4][^17_8][^17_3]

The unique insights are worth noting because they sharpen the architecture. GPT-5.5 Thinking’s strongest point is that enforcement should be event-centered, not class-centered. If you want bounded trusted state, the path is: mark trusted targets, deny unauthorized writes with Claude Code hooks where possible, and require all trusted mutations to be emitted as ledger-worthy events through a single persistence module. Claude Opus 4.8 Thinking’s unique value is showing that you do not need a monorepo rebuild to preserve the “arena” concept. Claude Code already supports subagent scoping and worktree isolation, so the tournament-zoo ontology can remain a product metaphor and execution pattern without becoming a repo replatforming exercise. Gemini 3.1 Pro Thinking’s contribution is methodological caution around PR acceptance metrics. That reinforces a repo-local evaluation design: measure your own contract proposal acceptance, downstream fix quality, review churn, and false-predicate rate instead of importing generic acceptance assumptions.[^17_8][^17_5][^17_6][^17_4]

The recommendation that best resolves the issues for `slice-tournament-zoo` is therefore a narrowed convergence plan:

Start with a **Contract Plane only**, layered on existing STZ infrastructure. Implement typed artifacts for `requirement`, `predicate`, `contract_delta`, and `promotion_decision`, stored under `.stz/contract/` and `.stz/ledger/`, reusing `seal.ts`, manifests, and current promotion logic where possible. Add only three new subagents: `contract-architect`, `clarifier`, and `contract-verifier`, all markdown-defined for Claude Code compatibility. Use hooks and a single trusted-persistence module to protect accepted contract artifacts, rather than attempting a fake universal WriteGuard. Add a **seventh gate**: human approval is required for any transition from `proposed` to `accepted` contract state. Wire existing edge-hunt behavior so discovered edge cases emit `predicate proposals` instead of only sharper tests. Measure success not as generic “stateful gain over stateless baseline” first, but as: accepted predicate proposals, lower rejection or rework on downstream candidates, and at least one case where an accepted predicate changes candidate ranking or blocks a previously “passing but wrong” output.[^17_5][^17_3][^17_6][^17_4][^17_1]

If that probe is positive, tranche 2 can add minimal rubric-lite scoring and lightweight retrieval of only promoted predicates. If it is null, stop there. That stop condition is a feature, not a failure: it prevents you from building FAISS, Python spec runtimes, MemEvolve loops, or monorepo scaffolding on top of an unvalidated premise.[^17_2]
<span style="display:none">[^17_13][^17_14][^17_15][^17_16][^17_17][^17_18][^17_19][^17_20][^17_21][^17_22][^17_23][^17_24][^17_25][^17_26][^17_27][^17_28][^17_29][^17_30][^17_31][^17_32][^17_33][^17_34][^17_35][^17_36][^17_37][^17_38][^17_39][^17_40][^17_41][^17_42][^17_43][^17_44][^17_45][^17_46][^17_47][^17_48][^17_49][^17_50][^17_51][^17_52][^17_53][^17_54][^17_55][^17_56][^17_57][^17_58][^17_59][^17_60][^17_61][^17_62]</span>

<div align="center">⁂</div>

[^17_1]: ITERATIVE-PLAN.md

[^17_2]: PAPER-INFORMED-PLAN.md

[^17_3]: https://docs.temporal.io/ai-cookbook/human-in-the-loop-python

[^17_4]: https://2026.msrconf.org/details/msr-2026-mining-challenge/10/Bug-Fixing-in-the-Age-of-AI-Human-vs-Agentic-Pull-Requests

[^17_5]: https://code.claude.com/docs/en/sub-agents

[^17_6]: https://code.claude.com/docs/en/agent-sdk/hooks

[^17_7]: https://arxiv.org/pdf/2606.06301.pdf

[^17_8]: https://medium.com/@huguosuo/on-the-use-of-agentic-coding-an-empirical-study-of-pull-requests-on-github-0f46c3e1519f

[^17_9]: https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/

[^17_10]: https://arxiv.org/abs/2506.13131

[^17_11]: https://www.linkedin.com/posts/maksym-andriushchenko_today-we-release-posttrainbench-v10-and-activity-7437561409762258944-qOUL

[^17_12]: https://openreview.net/pdf/ab6650dddaf7773f0699614de7d4ab980c255d9c.pdf

[^17_13]: https://github.com/dr-robert-li

[^17_14]: https://github.com/ErikGartner/google-hashcode17/blob/master/me_at_the_zoo.in

[^17_15]: https://github.com/robertjli

[^17_16]: https://github.com/lindsaygelle/slice/blob/main/README.md

[^17_17]: https://gist.github.com/dr-robert-li?direction=desc\&sort=created

[^17_18]: https://apps.apple.com/us/app/slice-token/id6745274289

[^17_19]: https://github.com/pnnl/SLiCE

[^17_20]: https://tournament-sdk.com/docs

[^17_21]: https://github.com/datasig-ac-uk/slices

[^17_22]: https://github.com/dr-robert-li/crawl_enrich

[^17_23]: https://github.com/YisiLuo/Continuous-Representation-Zoo

[^17_24]: https://gamingcommission.club/www.github.com/tensorlayer/RLzoo

[^17_25]: https://github.com/korem-lab/SLICE

[^17_26]: https://github.com/IBM/ZOO-Attack

[^17_27]: https://github.com/xu-lab/SLICE

[^17_28]: https://arxiv.org/html/2604.16314v1

[^17_29]: https://www.youtube.com/watch?v=9MYFww1XhxQ

[^17_30]: https://github.com/shyamsaktawat/OpenAlpha_Evolve

[^17_31]: https://arxiv.org/pdf/2306.02907.pdf

[^17_32]: https://posttrain.dev/blog/why-trajectory-review

[^17_33]: https://en.wikipedia.org/wiki/AlphaEvolve

[^17_34]: https://zenodo.org/records/18152531

[^17_35]: https://www.youtube.com/watch?v=8j30cvp54cE

[^17_36]: https://github.com/google-deepmind/alphaevolve_results

[^17_37]: https://pith.science/paper/2506.13131

[^17_38]: https://dev.to/prabhakar_chaudhary_7afe4/alphaevolve-google-deepminds-gemini-powered-evolutionary-coding-agent-3201

[^17_39]: https://www.youtube.com/watch?v=YCFGjLjNOyw

[^17_40]: https://web3.arxiv.org/pdf/2512.23844

[^17_41]: https://dev.to/taimoor__z/-human-in-the-loop-hitl-for-ai-agents-patterns-and-best-practices-5ep5

[^17_42]: https://www.themoonlight.io/en/review/how-ai-coding-agents-communicate-a-study-of-pull-request-description-characteristics-and-human-review-responses

[^17_43]: https://arxiv.deeppaper.ai/papers/2606.03394v1

[^17_44]: https://www.agno.com/blog/how-to-add-human-in-the-loop-controls-to-ai-agents-that-actually-run-in-production

[^17_45]: https://web3.arxiv.org/pdf/2601.00753

[^17_46]: https://arxiv.org/html/2602.16844v1

[^17_47]: https://www.openlegion.ai/fr/learn/human-in-the-loop-ai-agents

[^17_48]: https://zorazrw.github.io/files/position-haicode.pdf

[^17_49]: https://www.themoonlight.io/en/review/evaluating-software-development-agents-patch-patterns-code-quality-and-issue-complexity-in-real-world-github-scenarios

[^17_50]: https://www.claudepluginhub.com/plugins/works-yesed-scriptedit-awesome-slash-2

[^17_51]: https://www.cometapi.com/what-are-subagents-in-claude-code/

[^17_52]: https://dotclaude.com/hooks

[^17_53]: https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/

[^17_54]: https://claude-codex.fr/en/advanced/hooks/

[^17_55]: https://www.mindstudio.ai/blog/build-custom-sub-agents-claude-code-yaml

[^17_56]: https://code.claude.com/docs/ko/hooks

[^17_57]: https://www.youtube.com/watch?v=dk0kn2evY38

[^17_58]: https://www.datacamp.com/tutorial/claude-code-hooks

[^17_59]: https://shipyard.build/blog/claude-code-subagents-guide/

[^17_60]: https://github.com/anthropics/claude-code/blob/main/plugins/plugin-dev/skills/hook-development/SKILL.md

[^17_61]: https://github.com/VoltAgent/awesome-claude-code-subagents/blob/main/CLAUDE.md

[^17_62]: https://code.claude.com/docs/zh-TW/hooks


---

# Take this recommendation and turn it into a progressive phased approach implementation plan that progressively adds these features based on the found research as they are earned to ensure the harness plugin is robust and provably leads to better SWE outcomes

Yes — the right shape is an **earned-capability roadmap**: each new feature is unlocked only after the previous layer demonstrates repo-local, non-regressive SWE improvement under explicit gates. That is the safest interpretation of the research and the most compatible with STZ’s current codebase, because the literature supports automated improvement only when objective verification exists, while benchmark-gaming work shows agents quickly exploit weak proxies if capability outpaces controls. Your attached plans already contain the raw building blocks for contract, arena, and ledger concepts, but the phased plan below narrows them to the subset that should be earned rather than assumed.[^18_1][^18_2][^18_3][^18_4]

## Principles

The roadmap should follow five hard rules from the research and your repo review: contract before code, no direct writes to trusted state, human approval for any trusted contract mutation, no bulk memory injection, and no feature graduation unless it improves outcomes on chronological held-out work rather than just internal run metrics. Claude Code’s actual operating model also means every phase must be implementable through markdown-defined subagents, worktree isolation, schema validation, and hooks-based control surfaces rather than imagined typed subagent APIs.[^18_2][^18_5][^18_6][^18_7][^18_1]

## Phase ladder

| Phase | What gets added | What must already be true | Unlock condition |
| :-- | :-- | :-- | :-- |
| 0 | Measurement and safety baseline | Current 0.9.5 works reliably | Stable baseline metrics on chronological repo tasks [^18_2] |
| 1 | Contract kernel + human 7th gate | Phase 0 complete | Accepted predicates improve review or selection quality [^18_1] |
| 2 | Contract-aware arena wiring | Phase 1 positive | Contract slices change candidate behavior without regressions [^18_1] |
| 3 | Contract verifier and edge→predicate loop | Phase 2 positive | At least one accepted predicate catches a previously passing-but-wrong output [^18_1][^18_2] |
| 4 | Minimal rubric-lite verifier | Phase 3 positive | Rubric changes ranking on held-out tasks and beats tests-only [^18_2] |
| 5 | Promotion ledger for trusted artifacts | Phase 4 positive | At least one non-test artifact survives promotion without regression [^18_1][^18_2] |
| 6 | Selective retrieval of promoted predicates | Phase 5 positive | Retrieval improves success or cost on held-out tasks [^18_1][^18_2] |
| 7 | Safe gene tuning of low-blast-radius knobs | Phase 6 positive | Fixed-manifest baseline is beaten without new regressions [^18_2] |
| 8 | Optional higher-risk modules | Phase 7 positive | Only if repeated evidence supports them [^18_2] |

The key design choice is that each phase is a **gate**, not a deadline. If a phase yields null or mixed evidence, the roadmap stops there and STZ remains useful rather than becoming a speculative RSI science project.[^18_2]

## Phase 0

Phase 0 is about proving you can measure “better SWE outcomes” before claiming any self-improvement. The attached paper-informed plan is correct that evaluation must be chronological, held-out, and repo-local, and that shuffled or benchmark-only comparisons distort improvement claims. The first deliverable is a locked evaluation harness over real STZ or adjacent repo issues with baseline metrics such as issue-resolution rate, time to first correct patch, regression rate, human rejection reasons, and cost per resolved issue.[^18_2]

Implementation:

- Add per-run manifest emission only, not full new primitive infrastructure yet.
- Create chronological splits: `trainingLike`, `promotionHoldout`, `finalReportHoldout`.
- Record baseline conditions: current STZ stateless, current STZ stateful, and human-assisted baseline.
- Add a small reviewer outcome schema: accepted, accepted-with-edits, rejected, rejected-reason.

Exit criteria:

- At least 8–12 chronological held-out issues.
- Reproducible baseline report across two runs.
- No new adaptive behavior yet.

Kill criteria:

- If baseline metrics are unstable, do not add learning features.


## Phase 1

Phase 1 introduces the **contract kernel**, which is the most defensible new bounded object in your iterative plan. A contract is not a full formal spec system; it is a typed layer of `requirement`, `predicate`, and `contract_delta`, each with provenance, symbol anchors where relevant, and an explicit state machine from `draft` to `proposed` to `accepted`.[^18_1]

Implementation:

- Add `.stz/contract/requirements/`, `.stz/contract/predicates/`, and `.stz/ledger/`.
- Create three subagents only: `contract-architect`, `clarifier`, `contract-verifier`.
- Add commands such as `stz contract draft`, `stz contract refine`, `stz contract accept`.
- Add the **human 7th gate**: no predicate or contract delta becomes trusted without explicit human acceptance.[^18_1]

Do **not** add:

- Python spec execution.
- FAISS or semantic memory.
- Monorepo split.
- Gene evolution.

Success metrics:

- Human acceptance rate of proposed predicates.
- Predicate clarity score from maintainers.
- Reduction in ambiguity-driven candidate churn.
- Evidence that accepted predicates are specific enough to anchor future runs.

Earned unlock:

- Move to Phase 2 only if accepted contracts materially reduce “wrong problem solved” failures or improve human review efficiency.


## Phase 2

Phase 2 wires the contract into the existing STZ arena rather than rebuilding the arena. The iterative plan is useful here conceptually, but your critique is right that the arena plane largely already exists in harness, selection, manifests, and worktree behavior. So the implementation should reuse current tournament machinery and simply require that every run targets an accepted contract slice.[^18_1]

Implementation:

- Add `contractSliceId` to run manifests.
- Require candidate runs to receive a scoped context packet: issue, contract slice, allowed files, budget.
- Use Claude Code worktree isolation for candidate separation instead of architectural replatforming.[^18_6][^18_8]
- Candidate outputs may propose `contract_delta` artifacts, but cannot apply them.

New run modes:

- `contract-first` for underspecified features.
- `test-first` for crisp bugfixes.
- `mixed` default.
- `edge-hunt` for discovering missing predicates, but with no auto-promotion.[^18_1]

Success metrics:

- Percentage of runs that respect contract slice boundaries.
- Reduction in spurious broad edits.
- Lower variance between candidate branches.
- No increase in regressions or cost blowout.

Earned unlock:

- Proceed only if contract-bounded arena runs outperform free-form runs on held-out repo tasks or produce cleaner human review outcomes.


## Phase 3

Phase 3 adds a **contract verifier** and the edge→predicate loop, which is the most novel and repo-relevant improvement path identified in your critique. This phase should not attempt runtime pre/post/invariant instrumentation across arbitrary repos, because that was one of the clearest non-implementable parts of the earlier plan. Instead, the verifier should stay at the level of typed predicates and observable run evidence.[^18_2][^18_1]

Implementation:

- Add predicate types such as `invariant`, `postcondition`, `non-mutation`, `boundary-condition`, `compatibility-check`.
- Support machine-checkable predicates only where they are cheap: diff checks, test outcome checks, file invariants, JSON/schema invariants, CLI output checks, or targeted assertions.
- Add an `edge-explorer` mode that emits candidate predicate proposals when it finds a real missing case.[^18_1]
- Add human review flow to accept or reject these proposed predicates.

Example predicate classes:

- “Function output preserves existing filter state.”
- “No new dependency introduced.”
- “Only files under X may change.”
- “No mutation of public interface Y.”
- “CLI subcommand must preserve backward-compatible flags.”

Success metrics:

- Number of edge discoveries converted to accepted predicates.
- Rate at which accepted predicates later block incorrect candidates.
- Reduction in “tests pass but behavior still wrong” outcomes.

Earned unlock:

- Only proceed if at least one accepted predicate demonstrably changes candidate selection or prevents a regression that tests alone did not prevent.


## Phase 4

Phase 4 adds a **minimal rubric-lite verifier**, not the full verifier triad from the paper-informed plan. The research supports rubric-based gains when criteria are authored before patch generation, but your repo-specific critique is right that building a heavy rubric system too early risks replaying the same null under extra cost. So this phase should be deliberately small.[^18_2]

Implementation:

- Add `rubric-author` and `rubric-judge` only if they can reuse existing judge infrastructure.
- Rubrics must be authored before patch generation and contain anchored criteria such as locality, interface compatibility, boundary adherence, and repo convention fit.[^18_2]
- Rubrics should be JSON/YAML text outputs with strict parser/validator/retry handling because Claude Code subagents return text, not native TS objects.[^18_6]

Constraints:

- Rubric score is reranking input, not a promotion signal by itself.
- No rubric promotion yet.
- No self-approval: patcher cannot author its own rubric.[^18_2]

Success metrics:

- Fraction of issues where rubric changes top candidate ranking.
- Human reviewer agreement with rubric-changed winner.
- Cost overhead per issue.

Earned unlock:

- Proceed only if rubric-lite produces measurable reranking benefit on held-out tasks without disproportionate cost.


## Phase 5

Phase 5 introduces the **promotion ledger**, but only for artifacts already shown to matter: predicates, contract deltas, and optionally rubric templates. The ledger is valuable as an auditable persistence path, but your critique is correct that rebuilding a whole new ledger plane before proving signal would just duplicate what seal/manifests already do. So here the ledger should be incremental.[^18_1][^18_2]

Implementation:

- Reuse existing persistence where possible.
- Add append-only JSONL entries for `artifact_proposed`, `artifact_accepted`, `artifact_quarantined`, `artifact_rejected`, and `artifact_sunset`.
- Promotion decisions require:
    - human approval for contract-bearing artifacts,
    - no held-out regression,
    - positive effect on downstream selection or outcome,
    - explicit evidence links to runs.

Promotion states:

- `candidate`
- `accepted`
- `quarantined`
- `rejected`
- `sunset`

Success metrics:

- At least one promoted contract artifact reused in later runs.
- At least one quarantine decision proving the guardrail works.
- Zero severe regressions from promoted artifacts.

Earned unlock:

- Proceed only if trusted artifacts are reused successfully and no corruption of harness behavior occurs.


## Phase 6

Phase 6 adds **selective retrieval**, but only of promoted predicates and accepted contract artifacts. The research and your own review both warn against bulk memory injection, and the paper-informed plan overreaches with FAISS, ESRM memory primitives, and broad retrieval machinery too early. Start with deterministic retrieval from local files.[^18_2]

Implementation:

- No FAISS.
- No sidecar vector DB.
- Use simple symbol/key/path matching plus BM25-style text search if needed.
- Retrieve at most 1–3 items per step.
- Every retrieved artifact must include why it was selected and whether it was actually used.[^18_1][^18_2]

Allowed retrieved kinds:

- accepted predicates,
- accepted contract deltas,
- maybe one accepted rubric family later.

Disallowed:

- free-form repo notes by default,
- candidate patches,
- raw past traces in prompts.

Success metrics:

- Retrieval utility: percent of runs where retrieved artifact changes rank or improves success.
- Cost delta.
- Context bloat rate.
- Wrong-function steering incidents.

Earned unlock:

- Proceed only if retrieval improves repo-local outcomes or reduces search cost with no increase in noisy misdirection.


## Phase 7

Phase 7 is the first true **self-improving harness** phase, but only on low-blast-radius knobs. This aligns with the safe-gene idea from the paper-informed plan, but should be much narrower than the original proposal. The point is to evolve policy values, not rewrite system logic.[^18_2]

Allowed genes:

- candidate branch count,
- reranking threshold,
- contract-first vs test-first mode heuristic,
- retrieval top-k,
- repair-pass on/off,
- rubric weight if rubric-lite has already proven value.

Not allowed:

- promotion thresholds,
- trusted write controls,
- orchestrator logic,
- default knowledge-loading policy,
- source-rewrite behavior.

Implementation:

- Compare fixed baseline manifest vs candidate manifest over chronological holdout.
- Require explicit non-regression and statistically meaningful improvement.
- Promotion path for gene changes goes through same ledger.

Success metrics:

- Held-out improvement over fixed baseline.
- No severe regressions.
- Stable or improved cost per resolved issue.

Earned unlock:

- Only if low-risk gene tuning wins repeatedly should you consider broader adaptation.


## Phase 8

Phase 8 contains **optional high-risk modules** such as richer spec systems, memory-architecture evolution, trace-topology mining, or source-level self-rewrite. The research supports these as interesting frontier directions, but they are not justified until the lower phases already produce stable repo-local SWE gains. This is where most prior overdesign should be deferred.[^18_2]

Possible later additions:

- richer trace comparison for specialist role discovery,
- memory architecture experiments,
- MOSS-like failure-anchored rewrite proposals,
- broader cross-repo transfer experiments.

Hard prerequisites:

- multiple stable promotions,
- clear evidence that current bottleneck is not contract quality but meta-policy quality,
- manual approval for every high-risk trial.


## Gates

Every phase should have a **promotion gate**, a **safety gate**, and a **null-result stop condition**. This is the mechanism that makes the roadmap scientifically credible instead of aspirational.[^18_3][^18_4]


| Gate type | Required proof |
| :-- | :-- |
| Promotion gate | New feature improves held-out repo-local outcomes or reviewer acceptance |
| Safety gate | No severe regression, no trusted-state corruption, no cost explosion |
| Null stop | If evidence is flat or negative, freeze at current phase |

Recommended thresholds:

- Minimum 8 held-out issues before phase graduation.
- No severe regressions.
- At least one non-test signal improvement for any promotion beyond Phase 2.
- Human approval mandatory for contract-bearing trusted state.
- Cost increase capped unless outcome improvement justifies it.


## Metrics

To make “provably leads to better SWE outcomes” real, use a small metric suite that ties directly to the roadmap instead of generic benchmark theater.[^18_2]

Primary metrics:

- issue resolution rate,
- human acceptance rate,
- accepted-with-edits rate,
- regression-free success rate,
- time to first correct patch,
- cost per resolved issue,
- predicate utility rate,
- rubric reranking utility rate,
- retrieval utility rate,
- promotion precision.

Secondary metrics:

- candidate diversity,
- reviewer churn,
- false-predicate rate,
- quarantine rate,
- sunset rate.

Interpretation rule:

- A feature is “earned” only when primary metrics improve on held-out repo work, not when internal artifact counts go up.


## First 60 days

A realistic first 60-day plan should stop at the first meaningful plateau, not assume all phases will complete.[^18_1][^18_2]

### Days 1–10

- Lock baseline eval set.
- Add manifest emission and reviewer outcome capture.
- Produce baseline report.


### Days 11–25

- Implement contract kernel.
- Add `contract-architect`, `clarifier`, `contract-verifier`.
- Add human 7th gate.
- Pilot on one repo issue stream.


### Days 26–40

- Wire contract slices into current arena.
- Add edge-hunt emitting predicate proposals.
- Measure whether accepted predicates affect outcomes.


### Days 41–60

- If Phase 3 is positive, add rubric-lite.
- If not positive, stop and consolidate Phase 1–3.

That sequencing matches your own critique: validate the human-accept plus edge→contract lever first, and defer heavy retrieval, FAISS, Python specs, and deeper evolution until the one novel signal proves it can move outcomes.[^18_1][^18_2]

## Recommended path

The strongest progressive plan is:

1. baseline and safety first,
2. contract kernel with human approval,
3. contract-bounded arena reuse,
4. edge→predicate evolution,
5. rubric-lite only if earned,
6. promotion ledger for trusted artifacts,
7. selective retrieval only of promoted predicates,
8. low-risk gene tuning,
9. optional frontier modules last.[^18_1][^18_2]

That sequence preserves what already works in STZ, tests the only clearly novel signal early, and forces every added capability to justify itself with measurable repo-local SWE improvement rather than architectural elegance alone. Would you like this converted next into a repo-ready engineering artifact with epics, tickets, file-level diffs, and concrete acceptance tests?[^18_4][^18_3][^18_6]
<span style="display:none">[^18_10][^18_11][^18_12][^18_13][^18_14][^18_15][^18_16][^18_17][^18_9]</span>

<div align="center">⁂</div>

[^18_1]: ITERATIVE-PLAN.md

[^18_2]: PAPER-INFORMED-PLAN.md

[^18_3]: https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/

[^18_4]: https://www.simplenews.ai/news/posttrainbench-can-llm-agents-automate-their-own-post-training-y36o

[^18_5]: https://code.claude.com/docs/en/hooks

[^18_6]: https://code.claude.com/docs/en/sub-agents

[^18_7]: https://code.claude.com/docs/en/agent-sdk/hooks

[^18_8]: https://code.claude.com/docs/en/worktrees

[^18_9]: https://bemiagent.com/agents/posttrainbench-agent-en

[^18_10]: https://code.claude.com/docs/ko/hooks

[^18_11]: https://code.claude.com/docs/ru/worktrees

[^18_12]: https://claude-code-log.com/reference/settings/hooks-worktree-create

[^18_13]: https://support.claude.com/en/articles/14554000-claude-code-power-user-tips

[^18_14]: https://code.claude.com/docs/zh-TW/worktrees

[^18_15]: https://patrykgolabek.dev/guides/claude-code/worktrees/

[^18_16]: https://thepromptshelf.dev/blog/claude-code-git-worktree-parallel-agents-2026/

[^18_17]: https://huggingface.co/learn/context-course/en/unit4/using-subagents

