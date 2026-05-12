#!/bin/sh
# Periodic sweep of stale git lockfiles in this repo.
#
# Background: Cowork accesses this repo via a virtiofs mount that disallows
# file deletion. Git creates .git/index.lock (and similar) at the START of
# every write operation and removes it at the END. From the sandbox the
# remove step silently fails, leaving the lock in place — which then blocks
# the next git operation.
#
# This script runs from launchd on the Mac (where deletes work normally) and
# removes any *.lock file in .git/ that is older than 20 seconds. 20 s is
# safely longer than any real git operation completes, so we never race a
# legitimate in-flight operation.

REPO_DIR="/Users/didiolsson/code/cop-next"
GIT_DIR="$REPO_DIR/.git"

[ -d "$GIT_DIR" ] || exit 0

# Sweep stale lock files at .git root (index.lock, HEAD.lock, packed-refs.lock,
# config.lock, FETCH_HEAD.lock, MERGE_HEAD.lock, etc.)
find "$GIT_DIR" -maxdepth 1 -name "*.lock" -type f 2>/dev/null | while read f; do
  age=$(($(date +%s) - $(stat -f %m "$f")))
  if [ "$age" -gt 20 ]; then
    rm -f "$f"
  fi
done

# Sweep stale per-ref lock files under .git/refs/
find "$GIT_DIR/refs" -name "*.lock" -type f 2>/dev/null | while read f; do
  age=$(($(date +%s) - $(stat -f %m "$f")))
  if [ "$age" -gt 20 ]; then
    rm -f "$f"
  fi
done

# Sweep abandoned object tmp files (tmp_obj_*) — left behind when git couldn't
# unlink them after writing. Safe to remove once they're > 60 s old.
find "$GIT_DIR/objects" -name "tmp_obj_*" -type f 2>/dev/null | while read f; do
  age=$(($(date +%s) - $(stat -f %m "$f")))
  if [ "$age" -gt 60 ]; then
    rm -f "$f"
  fi
done

exit 0
