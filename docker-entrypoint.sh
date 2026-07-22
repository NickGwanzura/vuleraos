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

npx prisma migrate deploy
exec npm run start
