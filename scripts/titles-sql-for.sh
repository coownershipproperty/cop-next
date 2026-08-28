#!/usr/bin/env bash
# scripts/titles-sql-for.sh SLUG [SLUG...]
#
# Emits ready-to-run SQL setting title_{locale} for the given slugs across all
# six 2026 locales, pulled from the /tmp/titles-*.sql files that
# scripts/translate-property-titles.mjs --emit-sql produces.
#
# This exists so titles can be applied batch-by-batch alongside the matching
# descriptions: the noindex gate in lib/i18n.js wants BOTH, so applying them
# together means each translated property goes indexable immediately instead of
# waiting for the whole catalogue.
set -euo pipefail
for l in it nl pt sv da no; do
  rows=""
  for s in "$@"; do
    line=$(grep -h "('$s'," "/tmp/titles-$l.sql" 2>/dev/null || true)
    [ -n "$line" ] && rows="$rows$line"$'\n'
  done
  [ -z "$rows" ] && continue
  echo "update public.properties as p set title_$l = v.t from (values"
  echo "${rows%,$'\n'}" | sed '$ s/,$//'
  echo ") as v(slug, t) where p.slug = v.slug;"
done
