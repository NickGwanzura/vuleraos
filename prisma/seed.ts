import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CHART_OF_ACCOUNTS } from "../src/lib/ledger/accounts";

const prisma = new PrismaClient();

const DEMO_TENANT_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_OWNER_ID = "00000000-0000-4000-8000-000000000002";
const DEMO_CASHIER_ID = "00000000-0000-4000-8000-000000000003";
const DEMO_ACCOUNTANT_ID = "00000000-0000-4000-8000-000000000004";

async function seedChartOfAccounts(tenantId: string) {
  for (const account of DEFAULT_CHART_OF_ACCOUNTS) {
    await prisma.ledgerAccount.upsert({
      where: { tenantId_code: { tenantId, code: account.code } },
      update: {},
      create: {
        tenantId,
        code: account.code,
        name: account.name,
        type: account.type,
        isSystemAccount: true,
      },
    });
  }
}

async function main() {
  console.log("🌱 Seeding VuleraOS database...");

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: DEMO_TENANT_ID },
    update: {},
    create: {
      id: DEMO_TENANT_ID,
      name: "Mbare Traders (Pvt) Ltd",
      businessType: "PRIVATE_LIMITED",
      bpNumber: "BP1234567",
      defaultCurrency: "USD",
    },
  });

  console.log(`✓ Created tenant: ${tenant.name}`);

  // Create currencies for the tenant
  const usd = await prisma.currency.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "USD" } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: "USD",
      symbol: "$",
      name: "US Dollar",
      isBase: true,
      decimalPlaces: 2,
    },
  });

  const zwg = await prisma.currency.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "ZWG" } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: "ZWG",
      symbol: "ZiG",
      name: "Zimbabwe Gold",
      isBase: false,
      decimalPlaces: 2,
    },
  });

  console.log("✓ Created currencies: USD, ZWG");

  await seedChartOfAccounts(tenant.id);
  console.log(`✓ Seeded chart of accounts (${DEFAULT_CHART_OF_ACCOUNTS.length} accounts)`);

  // Create demo owner user
  const passwordHash = await bcrypt.hash("password123", 12);
  const owner = await prisma.user.upsert({
    where: { id: DEMO_OWNER_ID },
    update: {},
    create: {
      id: DEMO_OWNER_ID,
      tenantId: tenant.id,
      email: "admin@mbaretraders.co.zw",
      name: "Tafadzwa Moyo",
      passwordHash,
      role: "OWNER",
      onboardingCompleted: true,
    },
  });

  console.log(`✓ Created owner: ${owner.email} (password: password123)`);

  // Create exchange rate
  await prisma.exchangeRate.create({
    data: {
      tenantId: tenant.id,
      fromCurrencyId: usd.id,
      toCurrencyId: zwg.id,
      rate: 26.5,
      parallelMarketRate: 32.0,
      effectiveDate: new Date(),
      isManualOverride: false,
      createdByUserId: owner.id,
    },
  });

  // Create demo cashier
  await prisma.user.upsert({
    where: { id: DEMO_CASHIER_ID },
    update: {},
    create: {
      id: DEMO_CASHIER_ID,
      tenantId: tenant.id,
      email: "cashier@mbaretraders.co.zw",
      name: "Chipo Dube",
      passwordHash,
      role: "CASHIER",
      onboardingCompleted: true,
    },
  });

  console.log("✓ Created cashier: cashier@mbaretraders.co.zw");

  // Create demo accountant
  await prisma.user.upsert({
    where: { id: DEMO_ACCOUNTANT_ID },
    update: {},
    create: {
      id: DEMO_ACCOUNTANT_ID,
      tenantId: tenant.id,
      email: "accountant@mbaretraders.co.zw",
      name: "Tanaka Chidziva",
      passwordHash,
      role: "ACCOUNTANT",
      onboardingCompleted: true,
    },
  });

  console.log("✓ Created accountant: accountant@mbaretraders.co.zw");

  // Create item categories
  const electronics = await prisma.itemCategory.create({
    data: {
      tenantId: tenant.id,
      name: "Electronics",
    },
  });

  const groceries = await prisma.itemCategory.create({
    data: {
      tenantId: tenant.id,
      name: "Groceries",
    },
  });

  console.log("✓ Created item categories");

  // Create sample items
  const items = await Promise.all([
    prisma.item.create({
      data: {
        tenantId: tenant.id,
        name: "Bluetooth Speaker",
        sku: "ELEC-001",
        categoryId: electronics.id,
        unitOfMeasure: "each",
        defaultPrice: 45.0,
        costPrice: 28.0,
        currencyId: usd.id,
        currentStock: 50,
        minimumStock: 10,
        valuationMethod: "FIFO",
      },
    }),
    prisma.item.create({
      data: {
        tenantId: tenant.id,
        name: "USB-C Cable 2m",
        sku: "ELEC-002",
        categoryId: electronics.id,
        unitOfMeasure: "each",
        defaultPrice: 8.5,
        costPrice: 4.0,
        currencyId: usd.id,
        currentStock: 200,
        minimumStock: 50,
        valuationMethod: "FIFO",
      },
    }),
    prisma.item.create({
      data: {
        tenantId: tenant.id,
        name: "Maize Meal 10kg",
        sku: "GROC-001",
        categoryId: groceries.id,
        unitOfMeasure: "bag",
        defaultPrice: 12.0,
        costPrice: 8.5,
        currencyId: usd.id,
        currentStock: 5,
        minimumStock: 20,
        valuationMethod: "WEIGHTED_AVERAGE",
      },
    }),
    prisma.item.create({
      data: {
        tenantId: tenant.id,
        name: "Cooking Oil 2L",
        sku: "GROC-002",
        categoryId: groceries.id,
        unitOfMeasure: "bottle",
        defaultPrice: 6.0,
        costPrice: 4.0,
        currencyId: usd.id,
        currentStock: 30,
        minimumStock: 15,
        valuationMethod: "FIFO",
      },
    }),
  ]);

  console.log(`✓ Created ${items.length} sample items`);

  // Create sample customer
  const customer = await prisma.businessPartner.create({
    data: {
      tenantId: tenant.id,
      partnerType: "CUSTOMER",
      name: "Highfield Supermarket",
      bpNumber: "BP7654321",
      email: "info@highfieldsupermarket.co.zw",
      phone: "+263 77 123 4567",
      city: "Harare",
      creditLimit: 5000,
      currencyId: usd.id,
    },
  });

  console.log("✓ Created sample customer");

  // Create sample supplier
  await prisma.businessPartner.create({
    data: {
      tenantId: tenant.id,
      partnerType: "SUPPLIER",
      name: "Zim Distributors (Pvt) Ltd",
      bpNumber: "BP9876543",
      email: "orders@zimdistributors.co.zw",
      phone: "+263 78 987 6543",
      city: "Harare",
      currencyId: usd.id,
    },
  });

  console.log("✓ Created sample supplier");

  // Create sample invoices
  const invoice1 = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: "INV-2025-0001",
      customerId: customer.id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "FISCAL",
      currencyId: usd.id,
      subtotal: 53.5,
      vatAmount: 8.03,
      vatRate: 15,
      total: 61.53,
      amountPaid: 0,
      balanceDue: 61.53,
      createdById: owner.id,
    },
  });

  // Add invoice items
  await prisma.invoiceItem.createMany({
    data: [
      {
        invoiceId: invoice1.id,
        itemId: items[0].id,
        description: "Bluetooth Speaker",
        quantity: 1,
        unitPrice: 45.0,
        vatRate: 15,
        lineTotal: 45.0,
        currencyId: usd.id,
      },
      {
        invoiceId: invoice1.id,
        itemId: items[1].id,
        description: "USB-C Cable 2m",
        quantity: 2,
        unitPrice: 8.5,
        vatRate: 15,
        lineTotal: 17.0,
        currencyId: usd.id,
      },
    ],
  });

  // Create a partially paid invoice
  const invoice2 = await prisma.salesInvoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: "INV-2025-0002",
      customerId: customer.id,
      issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      status: "PARTIALLY_PAID",
      currencyId: usd.id,
      subtotal: 240.0,
      vatAmount: 36.0,
      vatRate: 15,
      total: 276.0,
      amountPaid: 100.0,
      balanceDue: 176.0,
      createdById: owner.id,
    },
  });

  await prisma.invoiceItem.create({
    data: {
      invoiceId: invoice2.id,
      itemId: items[2].id,
      description: "Maize Meal 10kg (20 bags)",
      quantity: 20,
      unitPrice: 12.0,
      vatRate: 15,
      lineTotal: 240.0,
      currencyId: usd.id,
    },
  });

  console.log("✓ Created sample invoices");

  // Create a payment
  await prisma.payment.create({
    data: {
      tenantId: tenant.id,
      invoiceId: invoice2.id,
      amount: 100.0,
      currencyId: usd.id,
      paymentMethod: "ECOCASH",
      referenceNumber: "EC123456789",
      isReconciled: true,
      receivedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      createdById: owner.id,
    },
  });

  // Create stock transaction
  await prisma.stockTransaction.create({
    data: {
      tenantId: tenant.id,
      itemId: items[0].id,
      type: "IN",
      quantity: 100,
      unitCost: 28.0,
      currencyId: usd.id,
      referenceType: "purchase_order",
      createdById: owner.id,
    },
  });

  console.log("✓ Created sample payment and stock transaction");
  console.log("");
  console.log("✅ Seed complete! You can log in with:");
  console.log("   admin@mbaretraders.co.zw / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
