---
name: Unit Testing Requirements
description: "Use when adding or changing Angular features, components, or services. Requires colocated unit tests and a passing test suite before the work is complete."
applyTo: "src/app/**/*.ts"
---
# Unit Testing Requirements

- Every new feature, component, and service must include a colocated `*.spec.ts` unit test file in the same directory.
- Tests must verify the implementation's observable behavior, including relevant success, failure, and boundary cases.
- Update the unit tests whenever the behavior of an existing feature, component, or service changes.
- Run `npx vitest run` after implementation and before considering the work complete.
- Do not consider the task complete if any unit test fails; keep iterating until the full unit-test suite passes.