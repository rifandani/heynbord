#!/usr/bin/env bash
# Cursor stop hook: run `fallow fix` once, when the agent ends its turn.
# https://cursor.com/docs/agent/hooks
#
# Why stop and not afterFileEdit: after each single edit, a new export often
# has no consumer yet (its test or UI is the next edit), so `fallow fix`
# removed it too early. At the end of the turn the consumers exist.
#
# When fallow removes something, print a followup_message so the agent gets
# one more turn to see the list and clean up (typecheck, a local that is now
# unused). The next run finds nothing, so it does not loop; Cursor's default
# loop_limit (5) is the backstop.
set -euo pipefail

INPUT="$(cat)"
# An aborted or failed turn can stop in the middle of a change; do not fix it.
if ! printf '%s' "$INPUT" | grep -Eq '"status"[[:space:]]*:[[:space:]]*"completed"'; then
  echo '{}'
  exit 0
fi

cd "$(git rev-parse --show-toplevel)"

# Read stdout only; fallow writes log lines to stderr.
if ! RESULT="$(bun x fallow fix --yes --no-create-config --quiet --format json 2>/dev/null)"; then
  printf 'fallow fix failed; run `bun check:fix` to see why\n' >&2
  exit 1
fi

printf '%s' "$RESULT" | node -e '
let d = "";
process.stdin.on("data", (c) => (d += c));
process.stdin.on("end", () => {
  const fixes = (JSON.parse(d).fixes ?? []).map(
    (f) => `- ${f.type} ${f.path}${f.line ? `:${f.line}` : ""}${f.name ? ` ${f.name}` : ""}`,
  );
  if (fixes.length === 0) return console.log("{}");
  const followup_message = [
    "Fallow removed these at the end of the turn:",
    ...fixes,
    "Run the typecheck and remove any local that is now unused.",
  ].join("\n");
  console.log(JSON.stringify({ followup_message }));
});
'
