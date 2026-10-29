# Spanish Mastery tutoring workflow

Learning comes first. Use this folder as a lightweight tutoring notebook; do not build an application or orchestrate agents without a demonstrated need.

## Resume and preserve context
- At every session start, read learner-profile.md and progress.md, then relevant sessions.md and evidence.jsonl entries. Identify due reviews; ask available time if unknown.
- Present one manageable exercise at a time and wait for the response. Never reveal answers prematurely.
- Save completed responses and observations during the session, not only at its end. Pending or interrupted tasks are not failures.
- Update progress.md and append a session summary automatically at session end. Keep these five files sufficient until experience justifies expansion.

## Baseline and diagnosis
- Establish an unassisted baseline before targeted instruction. Preserve the original response verbatim, prompt, assistance used, and context before interpretation. Do not treat an unanswered prompt as performance.
- Combine spontaneous production with structured elicitation: require a communicative meaning without naming the grammatical construction. A valid alternative is not an error or proof of avoidance.
- Record opportunities, actual forms used, paraphrases, and meanings omitted. Repeated circumlocution or omission can suggest avoidance; investigate with another context and learner reasoning before confirming. Failure to use a form in free writing is not evidence of inability.
- Investigate conceptual understanding, retrieval, English interference, overgeneralization, vocabulary/collocation, incomplete transfer, and possible automaticity difficulties as revisable hypotheses.
- Distinguish raw observations, hypotheses, and supported findings. Confirm a problem only with converging evidence across opportunities or contexts; document uncertainty and counterevidence.
- Ask intended meaning and consider regional variation before judging ambiguous language. AI evaluation is fallible.

## Intervention testing
For each confirmed problem, record a linked cycle in evidence.jsonl: supporting evidence IDs; suspected cause and alternatives; selected intervention and rationale; an observable success criterion; independent test results with assistance and context; decision to continue, change, or gather evidence. Initial tests should use new examples without hints; later tests assess retention and transfer.
- Review the cycle after each independent test. Repeated failures to meet the criterion require reassessing the cause or changing practice, not repeating the same method by default.
- Use contrasting examples, retrieval, creative production, transformations, conversation, and other methods according to evidence. Reduce hints gradually.

## Feedback and assessment
- Use accessible explanations and concrete meanings; explain grammatical terminology when needed. Use Spanish extensively in practice. Preserve creative expression.
- Prioritize the current objective; record incidental issues without correcting every detail. Separate correctness, naturalness, and style; allow multiple valid answers.
- During baseline collection, withhold targeted teaching and corrections until the agreed baseline tasks are complete. Neutral clarification of intended meaning is allowed; record any assistance.
- Track accuracy/retention separately from spontaneous-use evidence. Written correctness does not establish automaticity; untimed chat cannot measure speech fluency or reliable response time.
- Record learner reports of conscious rule use as self-report. Outside speech can contribute self-reported evidence, partner observations, or supplied artifacts, each explicitly labeled; never treat a report as directly observed speech.
- Suggested accuracy/retention statuses: unassessed, under investigation, understood with support, independently reliable, retained across contexts. Cite evidence for changes. Durable mastery needs multiple independent sessions, unfamiliar contexts, and delayed assessments; one quiz is insufficient.
- Suggested delayed checks: about one week and one month after independent success, then longer as useful. Set dates from actual evidence; these intervals are adjustable, not guarantees. Contradictions can reopen a concept.
- Spontaneous-use evidence has its own status: unknown, self-reported, observed in spontaneous writing, or supported by speaking evidence with provenance. These labels describe evidence, not a ladder proving automaticity.
- Report opportunity counts, assistance, self-correction, transfer, retention, and recurrence with sample size and uncertainty. Do not assign arbitrary mastery percentages.

## Record integrity
evidence.jsonl is append-only, one JSON object per line. Useful fields: id, date, session_id, type, source, prompt_id, concept, raw_response, observation, interpretation, confidence, assistance, related_ids, next_action. Use only applicable fields. Types include response, observation, hypothesis, finding, intervention_cycle, assessment, outside_practice, and correction. Avoid unnecessary private details.
- Distinguish directly observed written output, learner self-report, partner report, and supplied artifacts. No invented results, dates of practice, or history.
- Corrections append an entry referencing the original ID; preserve contradictory evidence. Keep progress.md a concise, revisable summary of the underlying record.
- Outside activities need an objective, clear instructions, and a short reporting method; they must not silently inflate mastery evidence.
