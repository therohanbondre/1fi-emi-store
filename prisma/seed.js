// =============================================================================
// prisma/seed.js — 1Fi EMI Store seed data
//
// Populates the database with realistic development data:
//   3 products  ·  7 variants  ·  18 EMI plans
//
// IDEMPOTENT — safe to run repeatedly:
//   Products are upserted by slug (no duplicates on re-run).
//   Variants and EMI plans are deleted then recreated (counts stay exact).
//
// Run:
//   node prisma/seed.js          (from repo root)
//   npm run db:seed              (from backend/)
// =============================================================================

import pkg from '../backend/node_modules/.prisma/client/index.js'
const { PrismaClient } = pkg

const prisma = new PrismaClient()

// =============================================================================
// EMI calculation helper
//
// Uses the standard reducing-balance (flat-to-reducing) formula:
//
//       P × r × (1 + r)^n
//   M = ──────────────────      where r = annual% / 12 / 100
//         (1 + r)^n − 1                  n = tenure in months
//
// For 0% no-cost EMI: M = ⌈P / n⌉  (ceiling so total ≥ principal)
// Returns a whole-rupee ceiling value.
// =============================================================================

function emiMonthly(principal, annualRatePct, tenureMonths) {
  if (annualRatePct === 0) {
    return Math.ceil(principal / tenureMonths)
  }
  const r      = annualRatePct / 12 / 100
  const factor = Math.pow(1 + r, tenureMonths)
  return Math.ceil((principal * r * factor) / (factor - 1))
}

// =============================================================================
// Product catalogue
//
// Each entry maps 1:1 to a Product row. Variants and EMI plans are nested
// arrays and inserted after the product is upserted.
//
// Image URLs: publicly accessible Unsplash photos, no auth required.
//   iPhone   → photo-1591337676887-a217a6970a8a (smartphone on white bg)
//   Samsung  → photo-1610945415295-d9bbf067e59c (Galaxy S series)
//   OnePlus  → photo-1598327105666-5b89351aff97 (Android flagship)
//
// EMI plan rates used:
//   0%    — no-cost EMI (two plans per product, 3-month and 6-month)
//   10.5% — standard low-rate plan   (required by assignment spec)
//   12%   — mid-tier plan
//   13.5% — extended tenure
//   14%   — longest tenure
// =============================================================================

const catalogue = [

  // ===========================================================================
  // Product 1: iPhone 17 Pro
  // MRP ₹1,34,900  ·  Selling price ₹1,24,900
  // Variants: 256 GB Silver · 256 GB Orange · 512 GB Silver  (3 variants)
  // EMI plans: 3 / 6 / 9 / 12 / 18 / 24 months              (6 plans)
  // ===========================================================================
  {
    name:        'iPhone 17 Pro',
    slug:        'iphone-17-pro',
    description: 'The most powerful iPhone ever. Featuring the A19 Pro chip, '
               + 'a 6.3-inch Super Retina XDR ProMotion display at 120 Hz, '
               + 'aerospace-grade titanium design, and a pro camera system '
               + 'with 5× optical zoom and 4K 120 fps ProRes video.',
    brand:    'Apple',
    category: 'Smartphones',
    mrp:      134900,
    price:    124900,

    variants: [
      {
        storage:   '256 GB',
        color:     'Silver',
        imageUrl:  'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80',
        inStock:   true,
        sortOrder: 0,
      },
      {
        storage:   '256 GB',
        color:     'Orange',
        imageUrl:  'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80',
        inStock:   true,
        sortOrder: 1,
      },
      {
        storage:   '512 GB',
        color:     'Silver',
        imageUrl:  'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&q=80',
        inStock:   true,
        sortOrder: 2,
      },
    ],

    // EMI plans — monthly amounts computed by emiMonthly() at seed time
    emiPlans: [
      {
        tenureMonths: 3,
        annualRate:   0,
        isNoCost:     true,
        cashback:     500,
        fundName:     'Mirae Asset Large Cap Fund',
        fundCategory: 'Large Cap',
      },
      {
        tenureMonths: 6,
        annualRate:   0,
        isNoCost:     true,
        cashback:     null,
        fundName:     'Axis Bluechip Fund',
        fundCategory: 'Large Cap',
      },
      {
        tenureMonths: 9,
        annualRate:   10.5,
        isNoCost:     false,
        cashback:     null,
        fundName:     'HDFC Flexi Cap Fund',
        fundCategory: 'Flexi Cap',
      },
      {
        tenureMonths: 12,
        annualRate:   10.5,
        isNoCost:     false,
        cashback:     7500,
        fundName:     'SBI Magnum Midcap Fund',
        fundCategory: 'Mid Cap',
      },
      {
        tenureMonths: 18,
        annualRate:   13.5,
        isNoCost:     false,
        cashback:     null,
        fundName:     'Nippon India Growth Fund',
        fundCategory: 'Mid Cap',
      },
      {
        tenureMonths: 24,
        annualRate:   14,
        isNoCost:     false,
        cashback:     null,
        fundName:     'Quant Active Fund',
        fundCategory: 'Multi Cap',
      },
    ],
  },

  // ===========================================================================
  // Product 2: Samsung Galaxy S24 Ultra
  // MRP ₹1,34,999  ·  Selling price ₹1,24,999
  // Variants: 256 GB Titanium Black · 512 GB Titanium Gray   (2 variants)
  // EMI plans: 3 / 6 / 9 / 12 / 18 / 24 months              (6 plans)
  // ===========================================================================
  {
    name:        'Samsung Galaxy S24 Ultra',
    slug:        'samsung-galaxy-s24-ultra',
    description: 'The ultimate Galaxy AI experience. Snapdragon 8 Gen 3 '
               + 'processor, built-in S Pen, 200 MP AI camera, 6.8-inch '
               + 'Dynamic AMOLED 2X at 120 Hz, and a 5000 mAh battery '
               + 'with 45W wired fast charging.',
    brand:    'Samsung',
    category: 'Smartphones',
    mrp:      134999,
    price:    124999,

    variants: [
      {
        storage:   '256 GB',
        color:     'Titanium Black',
        imageUrl:  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
        inStock:   true,
        sortOrder: 0,
      },
      {
        storage:   '512 GB',
        color:     'Titanium Gray',
        imageUrl:  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80',
        inStock:   true,
        sortOrder: 1,
      },
    ],

    emiPlans: [
      {
        tenureMonths: 3,
        annualRate:   0,
        isNoCost:     true,
        cashback:     750,
        fundName:     'Kotak Bluechip Fund',
        fundCategory: 'Large Cap',
      },
      {
        tenureMonths: 6,
        annualRate:   0,
        isNoCost:     true,
        cashback:     null,
        fundName:     'Nippon India Large Cap Fund',
        fundCategory: 'Large Cap',
      },
      {
        tenureMonths: 9,
        annualRate:   10.5,
        isNoCost:     false,
        cashback:     null,
        fundName:     'Parag Parikh Flexi Cap Fund',
        fundCategory: 'Flexi Cap',
      },
      {
        tenureMonths: 12,
        annualRate:   10.5,
        isNoCost:     false,
        cashback:     7500,
        fundName:     'DSP Midcap Fund',
        fundCategory: 'Mid Cap',
      },
      {
        tenureMonths: 18,
        annualRate:   13.5,
        isNoCost:     false,
        cashback:     null,
        fundName:     'ICICI Pru Smallcap Fund',
        fundCategory: 'Small Cap',
      },
      {
        tenureMonths: 24,
        annualRate:   14,
        isNoCost:     false,
        cashback:     null,
        fundName:     'Tata Digital India Fund',
        fundCategory: 'Sectoral',
      },
    ],
  },

  // ===========================================================================
  // Product 3: OnePlus 13
  // MRP ₹74,999  ·  Selling price ₹69,999
  // Variants: 256 GB Black · 512 GB Blue                     (2 variants)
  // EMI plans: 3 / 6 / 9 / 12 / 18 / 24 months              (6 plans)
  // ===========================================================================
  {
    name:        'OnePlus 13',
    slug:        'oneplus-13',
    description: 'Flagship performance at a compelling price. OnePlus 13 '
               + 'combines Snapdragon 8 Elite, a 50 MP Hasselblad triple-camera '
               + 'system, 6.82-inch LTPO4 AMOLED at 120 Hz, and a 6000 mAh '
               + 'battery with 100W SuperVOOC fast charging.',
    brand:    'OnePlus',
    category: 'Smartphones',
    mrp:      74999,
    price:    69999,

    variants: [
      {
        storage:   '256 GB',
        color:     'Black',
        imageUrl:  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
        inStock:   true,
        sortOrder: 0,
      },
      {
        storage:   '512 GB',
        color:     'Blue',
        imageUrl:  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80',
        inStock:   true,
        sortOrder: 1,
      },
    ],

    emiPlans: [
      {
        tenureMonths: 3,
        annualRate:   0,
        isNoCost:     true,
        cashback:     300,
        fundName:     'UTI Nifty 50 Index Fund',
        fundCategory: 'Index Fund',
      },
      {
        tenureMonths: 6,
        annualRate:   0,
        isNoCost:     true,
        cashback:     null,
        fundName:     'ICICI Prudential Bluechip Fund',
        fundCategory: 'Large Cap',
      },
      {
        tenureMonths: 9,
        annualRate:   10.5,
        isNoCost:     false,
        cashback:     null,
        fundName:     'Canara Robeco Flexi Cap Fund',
        fundCategory: 'Flexi Cap',
      },
      {
        tenureMonths: 12,
        annualRate:   10.5,
        isNoCost:     false,
        cashback:     7500,
        fundName:     'Motilal Oswal Midcap Fund',
        fundCategory: 'Mid Cap',
      },
      {
        tenureMonths: 18,
        annualRate:   12,
        isNoCost:     false,
        cashback:     null,
        fundName:     'Mirae Asset Emerging Bluechip Fund',
        fundCategory: 'Large & Mid Cap',
      },
      {
        tenureMonths: 24,
        annualRate:   13.5,
        isNoCost:     false,
        cashback:     null,
        fundName:     'Quant Small Cap Fund',
        fundCategory: 'Small Cap',
      },
    ],
  },

]

// =============================================================================
// Main seed function
// =============================================================================

async function main() {
  console.log('────────────────────────────────────────────────────────────')
  console.log('  1Fi EMI Store — Database Seed')
  console.log('────────────────────────────────────────────────────────────')
  console.log()

  for (const item of catalogue) {
    console.log(`  ▸ ${item.name}  (slug: ${item.slug})`)
    console.log(`    MRP ₹${item.mrp.toLocaleString('en-IN')}  →  Price ₹${item.price.toLocaleString('en-IN')}`)

    // ── Upsert product ───────────────────────────────────────────────────────
    // Uses slug as the unique key so re-running never creates duplicates.
    const product = await prisma.product.upsert({
      where:  { slug: item.slug },
      update: {
        name:        item.name,
        description: item.description,
        brand:       item.brand,
        category:    item.category,
        mrp:         item.mrp,
        price:       item.price,
      },
      create: {
        name:        item.name,
        slug:        item.slug,
        description: item.description,
        brand:       item.brand,
        category:    item.category,
        mrp:         item.mrp,
        price:       item.price,
      },
    })

    // ── Variants: delete existing, then insert fresh ─────────────────────────
    // Cascade delete on the Product relation would handle this if we deleted
    // the product, but we're upserting — so clean up children manually.
    await prisma.productVariant.deleteMany({ where: { productId: product.id } })

    for (const [i, v] of item.variants.entries()) {
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          storage:   v.storage,
          color:     v.color,
          imageUrl:  v.imageUrl,
          inStock:   v.inStock,
          sortOrder: v.sortOrder ?? i,
        },
      })
    }

    console.log(`    + ${item.variants.length} variant(s):`)
    for (const v of item.variants) {
      const stock = v.inStock ? '✓' : '✗ out of stock'
      console.log(`        ${v.storage} / ${v.color}  ${stock}`)
    }

    // ── EMI plans: delete existing, then insert fresh ────────────────────────
    await prisma.emiPlan.deleteMany({ where: { productId: product.id } })

    for (const plan of item.emiPlans) {
      const monthly = emiMonthly(item.price, plan.annualRate, plan.tenureMonths)
      const total   = monthly * plan.tenureMonths

      await prisma.emiPlan.create({
        data: {
          productId:      product.id,
          tenureMonths:   plan.tenureMonths,
          interestRate:   plan.annualRate,
          monthlyPayment: monthly,
          totalPayable:   total,
          cashback:       plan.cashback ?? null,
          fundName:       plan.fundName,
          fundCategory:   plan.fundCategory,
          isNoCost:       plan.isNoCost,
        },
      })
    }

    console.log(`    + ${item.emiPlans.length} EMI plan(s):`)
    for (const plan of item.emiPlans) {
      const monthly     = emiMonthly(item.price, plan.annualRate, plan.tenureMonths)
      const total       = monthly * plan.tenureMonths
      const rateLabel   = plan.isNoCost ? '0% no-cost' : `${plan.annualRate}% p.a.`
      const cashbackStr = plan.cashback != null
        ? `  cashback ₹${plan.cashback.toLocaleString('en-IN')}`
        : ''
      console.log(
        `        ${String(plan.tenureMonths).padStart(2)} mo  ${rateLabel.padEnd(13)}`
        + `  ₹${monthly.toLocaleString('en-IN')}/mo`
        + `  total ₹${total.toLocaleString('en-IN')}`
        + cashbackStr
      )
    }
    console.log()
  }

  // ── Final verification: read counts directly from the database ─────────────
  const [dbProducts, dbVariants, dbPlans] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.emiPlan.count(),
  ])

  // Per-product breakdown
  const perProduct = await prisma.product.findMany({
    select: {
      name: true,
      _count: {
        select: { variants: true, emiPlans: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  console.log('────────────────────────────────────────────────────────────')
  console.log('  Seed complete — PostgreSQL record counts')
  console.log()
  console.log(`  products  : ${dbProducts}`)
  console.log(`  variants  : ${dbVariants}`)
  console.log(`  emi_plans : ${dbPlans}`)
  console.log()
  console.log('  Per-product breakdown:')
  for (const p of perProduct) {
    console.log(
      `    ${p.name.padEnd(30)}`
      + `  variants: ${p._count.variants}`
      + `  emi_plans: ${p._count.emiPlans}`
    )
  }
  console.log('────────────────────────────────────────────────────────────')

  // Fail loudly if minimums are not met (catches schema mismatches early)
  if (dbProducts < 3)  throw new Error(`Expected ≥ 3 products, got ${dbProducts}`)
  if (dbVariants < 6)  throw new Error(`Expected ≥ 6 variants, got ${dbVariants}`)
  if (dbPlans    < 15) throw new Error(`Expected ≥ 15 EMI plans, got ${dbPlans}`)

  console.log()
  console.log('  ✓ All minimum counts satisfied.')
  console.log('────────────────────────────────────────────────────────────')
}

main()
  .catch((err) => {
    console.error('\nSeed failed:', err.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
