#!/bin/sh
set -e

# This database predates the switch to `prisma migrate` (it was managed with
# `prisma db push`, with no `_prisma_migrations` bookkeeping table). Safe to
# attempt on every boot: once it's been applied, retrying it fails harmlessly
# with P3008 ("already recorded as applied"), which we ignore. (A prior
# version of this script tried to detect whether baselining was needed with
# a raw SQL check first — that detection query itself could fail and fall
# through to "not baselined yet", causing this to run again and crash-loop
# on the now-expected P3008. Just attempting it unconditionally and ignoring
# that one known failure mode is simpler and avoids that whole class of bug.)
npx prisma migrate resolve --applied 20260101000000_baseline || true

# A prior deploy of this repo shipped a corrupted 20260722010000_add_p2_controls
# migration file (CLI warning text accidentally merged into the .sql), which
# Postgres rejected outright, leaving it recorded as failed and blocking all
# further migrations. The file is now fixed and every statement in it is
# idempotent (IF NOT EXISTS / duplicate_object-safe), so it's safe to clear
# that failed record and let it re-run regardless of whatever partially
# landed before. This is a one-time recovery step, safe to leave in
# permanently: once resolved, retrying it fails harmlessly (no failed record
# to clear) and this is ignored the same way as the baseline resolve above.
npx prisma migrate resolve --rolled-back 20260722010000_add_p2_controls || true

npx prisma migrate deploy
exec npm run start
