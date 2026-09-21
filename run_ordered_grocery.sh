#!/usr/bin/env bash
# Compatibility wrapper: one run, one report, and Playwright exit status.
# Uses the explicit grocery order in tests/suites/pos-session-sequence.spec.js.
exec npm run test:grocery -- "$@"
