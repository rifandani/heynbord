#!/usr/bin/env bash
# Claude Code Stop hook: run `fallow fix` once, when the agent ends its turn.
# https://code.claude.com/docs/en/hooks#stop
#
# Why Stop and not PostToolUse: after each single edit, a new export often has
# no consumer yet (its test or UI is the next edit), so `fallow fix` removed it
# too early. At the end of the turn the consumers exist.
#
# When fallow removes something, exit 2 so the agent gets one more turn to see
# the list and clean up (typecheck, a local that is now unused).
set -euo pipefail

INPUT="$(cat)"
# Do not loop: the turn after an exit 2 has stop_hook_active=true.
if printf '%s' "$INPUT" | grep -Eq '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

# Use the input cwd, not CLAUDE_PROJECT_DIR: in a worktree, cwd follows Claude
# but CLAUDE_PROJECT_DIR stays on the main checkout.
CWD="$(printf '%s' "$INPUT" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{try{console.log(JSON.parse(d).cwd||"")}catch{}})')"
cd "$(git -C "${CWD:-.}" rev-parse --show-toplevel)"

# Read stdout only; fallow writes log lines to stderr.
if ! RESULT="$(bun x fallow fix --yes --no-create-config --quiet --format json 2>/dev/null)"; then
  printf 'fallow fix failed; run `bun check:fix` to see why\n' >&2
  exit 1
fi

FIXES="$(printf '%s' "$RESULT" | node -e '
let d = "";
process.stdin.on("data", (c) => (d += c));
process.stdin.on("end", () => {
  for (const f of JSON.parse(d).fixes ?? []) {
    console.log(`- ${f.type} ${f.path}${f.line ? `:${f.line}` : ""}${f.name ? ` ${f.name}` : ""}`);
  }
});
')"

if [[ -z "$FIXES" ]]; then
  exit 0
fi

{
  printf 'Fallow removed these at the end of the turn:\n%s\n' "$FIXES"
  printf 'Run the typecheck and remove any local that is now unused.\n'
} >&2
exit 2
