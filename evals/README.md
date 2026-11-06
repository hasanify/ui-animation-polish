# Evals

`evals.json` holds trigger and behaviour cases for the skill. They are not unit tests: motion quality is judged semantically, so use an LLM judge or a human reviewer.

## Case schema

```json
{
  "id": "dropdown-cheap",
  "should_trigger": true,
  "prompt": "the user message",
  "expect": [{ "rule": "10", "contains": "start at scale(0.95)" }],
  "reject": ["keeps scale(0)"],
  "notes": "what makes a strong answer"
}
```

- `should_trigger`: whether the skill should load for this prompt.
- `expect`: behaviours or values the answer must contain. `contains` is a concept for the judge, not a substring assert.
- `reject`: behaviours that make the answer wrong. Quoting a "before" value while replacing it is fine; recommending it is not.
- `notes`: the differentiator between a mediocre and a strong answer.

## Running

No runner ships with the repo. Two options:

1. **Manual/LLM judge.** Load `SKILL.md` into a fresh session, send each `prompt`, then check the answer against `expect`/`reject`. Score `passed_expect / total_expect` and fail the case on any `reject`.
2. **Harness.** If your agent has an eval runner, feed the JSON as cases and use the rubric below as the judge prompt.

Judge prompt:

```
You are grading a UI motion answer against a checklist.
For each expect item, mark pass only if the answer contains the concept,
not merely the words. Mark fail if any reject item is recommended.
Report: case id, passed/total, failed items, one-line verdict.
```

## What the suite covers

| Area | Cases |
|---|---|
| Timing and easing | dropdown-cheap, modal-motion |
| Origin and continuity | dropdown-cheap, card-detail |
| Feedback and physicality | toggle-physical, success-confirmation |
| State transitions | tab-flicker, icon-morph |
| Direct manipulation | drag-lag |
| Lists and choreography | list-cascade |
| Accessibility | reduced-motion |
| Audit workflow | audit-existing |
| Trigger boundaries | negative-database, negative-copy, negative-color |

## Adding a case

Add the smallest prompt that exposes one decision. Put the exact number in `expect` when the rule has one. Add a negative case whenever the skill's description grows broader.

Keep the suite honest: if a case fails repeatedly because the guidance is ambiguous, fix `SKILL.md` or the relevant reference rather than weakening the case.
