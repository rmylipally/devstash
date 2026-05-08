# Test Action

1. Read current-feature.md to understand what was implemented
2. Identify server actions and utility functions added/modified for this feature
3. Check if tests already exist for these functions
4. For functions without tests that have testable logic, write unit tests:
   - Use Vitest in `tests/`
   - Focus on server actions and utilities (not components)
   - Test happy path and error cases
   - Do not write tests just to write them. Use your best judgement
5. Run `npm run test:unit`, or a focused Vitest command such as `npm run test:unit -- tests/seed-data.test.ts`
6. Run `npm run build` before marking feature work complete
7. Report the exact commands run and the outcome
