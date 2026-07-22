#!/bin/sh
set -e

# This database predates the switch to `prisma migrate` (it was managed with
# `prisma db push`, with no `_prisma_migrations` bookkeeping table). On the
# very first boot after this change, baseline the existing schema as already
# applied so `migrate deploy` doesn't try to recreate tables that already
# exist. Once baselined, this is a no-op on every future deploy.
TABLE_EXISTS=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT to_regclass('_prisma_migrations') AS name\`
  .then((rows) => { console.log(rows[0].name ? 'yes' : 'no'); return prisma.\$disconnect(); })
  .catch(() => { console.log('no'); });
")

if [ "$TABLE_EXISTS" = "no" ]; then
  echo "No prior migration history found — baselining existing schema..."
  npx prisma migrate resolve --applied 20260101000000_baseline
fi

npx prisma migrate deploy
exec npm run start
