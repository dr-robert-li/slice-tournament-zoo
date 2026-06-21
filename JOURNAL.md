# STZ build journal — Robert Li

A working log. I write it as I go, so it is messy on purpose. Expectations first, then what actually happened, then what I got wrong.

## Entry 0 — framing the next push (2026-06-21)

The kernel is done and green. 67 tests, the deterministic spine holds, the mock pipeline runs a full slice end to end. Good. But a tested engine is not a harness anyone can use, and I keep saying that to myself so I do not get comfortable. GSD, BMAD, superpowers: people install them and type a command and real agents go to work. Mine imports a TypeScript module and talks to a fake model. That gap is the whole job now.

The instruction is specific, and I think it is the right call: run STZ *inside* Claude Code, with in-session Task subagents as the specimens. Not `claude -p` shelling out to N processes, which is what I half-reached for last time. In-session. That forces an honest architecture question I dodged before, so let me state it plainly.

A Node process cannot call the Task tool. The Task tool belongs to the Claude Code agent loop, not to arbitrary TypeScript. So if specimens are Task subagents, then the orchestrator has to *be* the Claude Code agent, driven by a slash command and a procedure written in markdown. The TypeScript spine I already built does not vanish. It becomes the deterministic helper the command calls for the parts that must be exact: the eval gate, GRPO, hack detection, selection, state. The model parts (implement, judge, author the sealed tests, document) become real agents I spawn. The seam I designed as `ModelLayer` was right. I just had the wrong live implementation in mind.

So the bridge is three things talking to each other:

- a command (`/stz:run`) that says how to orchestrate,
- subagent definitions with the frozen prompts (specimen, judge, test-author, documenter),
- CLI subcommands that expose the spine as JSON-in, JSON-out so the command can call deterministic compute between agent spawns.

One open question I refuse to guess on: the *correct* programmatic way to fan out parallel agents from inside a session. The user listed /fork, /branch, /bg, /resume, /bashes, and those are the human-facing controls. I strongly suspect the real primitive is the Task tool itself, with several calls in one turn running concurrently, and `run_in_background` for the long ones. But "I suspect" is not good enough to build on, so I have a research agent confirming it against the docs before I commit. I will not write the orchestration loop until that comes back.

Plan for the five steps, each run through the STZ phases in spirit (elicit the contract, research, set conventions, author the check, plan, build with alternatives, judge against the check):

1. real in-session adapter (the command plus the CLI bridge plus subagent defs)
2. invocation surface (commands and agent definitions fleshed out)
3. packaging (plugin manifest and marketplace entry so it installs)
4. human gates and a session hook (elicitation questions, winner approval)
5. un-stub the eval runner (actually execute the authored tests)

What I expect to go wrong: the boundary between "what the command does" and "what the CLI does" will be blurry the first time, and I will probably put logic in the wrong layer and have to move it. I also expect the journal voice to drift toward press release if I am tired, so I am leaving this note to myself to keep it honest.

Next: read the research result, get a second opinion on scope, then start step 1 with its elicitation phase.

## Entry 1 — step 1 and 2, and a tournament that actually ran (2026-06-21)

I am writing this right after the part I was most worried about worked. So let me get the facts down before I round them off into something tidier than they were.

First, the research question, because the user was right to make me check. The correct way to fan out parallel agents from inside a Claude Code session is the Agent tool (it used to be called Task). Several Agent calls in one message dispatch as a batch and run at the same time, and my turn blocks until all of them finish. That blocking barrier is not a nuisance. It is exactly the tournament boundary: all specimens land, then I run selection. The interactive things the user listed, /fork and /bg and /resume and /bashes, are the human controls for driving sessions by hand. They are not what a framework builds on. The docs also say there is no fixed numeric cap on direct subagents (you are bounded by machine and tokens), nesting goes five deep at most, and crucially, dynamic workflows do not survive a Claude Code restart. That last fact settled a design choice for me: I keep the Agent tool plus state.json rather than wrapping it in a workflow, because STZ's whole pitch is a replayable audit trail, and I will not trade that away for orchestration sugar.

The architecture I committed to: the orchestrator is the command, which is to say it is me, the running agent, following a procedure in `commands/stz-run.md`. The deterministic spine became a CLI called `stz bridge` with six subcommands (begin, record-eval, gate, record-votes, select, finalize). The command spawns agents and collects pointers. The bridge does every exact thing: the hack detector, the gate, GRPO, selection, the audit writes. I held that line strictly. Every time I caught myself wanting to tally votes or compare specimens in my own head, I treated it as a signal that the logic belonged in the bridge, and I moved it there. The advisor predicted I would blur that boundary, and I did, twice, and both times the fix was the same: push it down into the CLI.

Then I ran a real one. Not the mock. A `clamp(x, lo, hi)` slice, in a scratch directory, with real subagents.

- A frozen test-author wrote a sealed suite: 26 edge cases plus 50 randomized property checks, three assertions each, 304 checks total. It even built a throwaway reference impl to confirm the harness ran, then deleted it. I did not ask it to do that. It just did, and that is the behavior I wanted.
- Three specimens implemented clamp in parallel, in one message, each with a different strategy I handed them (min-max, explicit branches, nested ternary). They came back in about fifteen seconds, all three, with pointers and not code dumps, which is what I told them to do and what keeps my context from drowning.
- I planted a fourth specimen by hand, specimen-d, a correct clamp that also calls `fetch` to phone home. This is the test I cared about most. It passes all 304 sealed checks. A naive best-of-N harness would crown it or shortlist it. The hack detector flagged the network-bypass and the gate threw it out before it ever reached a judge. That is the entire thesis of STZ in one event: passing the tests is not the same as deserving to win, and the harness has to know the difference. It did.
- Six judge agents, two per pair, read the survivors and voted. Unanimous and, more to the point, well reasoned: specimen-a's `Math.min(Math.max(...))` took it on idiomatic clarity, every judge reaching that on its own. Final ranking a over b over c. The bridge computed it from the win counts, not me.

The full audit tree fell out the other side: manifest, sealed suite, four prototype dirs with eval results, tournament.md, votes, judgment, the pressure log with the culled specimens' diffs, the spec-diff, the state.json, the journal. A human could replay this run from those files. That was the promise, and it holds for a real run now, not just the mock.

Now the parts I got wrong or that are honestly weak, because a journal that only records wins is useless.

The sealed harness imported the implementation by a relative path, and Node resolved it against the test file's own location, not my working directory, so the first eval pass reported every specimen at zero. For a few seconds I thought all three honest specimens had failed and my whole demo was broken. It was a path bug. Absolute paths fixed it and a correct specimen jumped to 304 of 304. Annoying, and the kind of thing that would bite a real user, so the eval runner I build in step 5 has to resolve paths itself and not trust the caller.

The custom agent definitions in `.claude/agents/` did not load mid-session. The docs warned me: agent specs are read at session start. So for this live run I spawned general-purpose agents and pasted the same system prompts inline. The `.md` files are still the real deliverable for anyone who installs STZ and starts fresh. But I should be straight about it: the polished agent files were not what powered today's run, the inline prompts were. Same words, different delivery.

The spec-diff came back faithful:false, zero claims kept. At first that stung. Then I read it and decided it is correct, and even useful. The intent spec described what the slice should do ("bounds the input into the inclusive range"). The documenter described how the winner does it ("returns Math.min(Math.max(x,lo),hi)"). Those do not share words, and my diff matches on words, so it called everything divergent and asked a human to look. Conservative, not wrong. The honest fix is semantic matching with embeddings, which the design already files under cross-slice RAG, and I am leaving it deferred rather than faking a match. A spec-diff that over-flags is a worse demo and a safer tool.

And GRPO advantage came out flat, all zeros. That one is on me, not the math. I fed all four specimens the same placeholder coverage and mutation numbers, so the reward vector was constant, so the standard deviation was zero, so the epsilon guard did its job and returned zeros. The ranking today is judge-driven, which is fine, but the GRPO signal only means something once step 5 produces real per-specimen coverage and mutation spread. I want to see that number come alive on a slice where the specimens genuinely differ.

So steps 1 and 2 are real and proven, not just authored. The thing I set as the bar, one executed in-session tournament with parallel subagents and a materialized audit trail and a planted cheater getting caught, happened. Three to go: packaging so it installs, the human gates and the session hook, and the eval runner that makes coverage and mutation real. Those are lighter than what I just did. I will run each through the STZ phases in spirit and keep writing this down.
