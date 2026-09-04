/**
 * budgetRecommender.js — pure recommendation logic, no React imports.
 *
 * All functions here are stateless and side-effect-free so they can be
 * tested in isolation without mounting any component.
 *
 * Recommendation algorithm (requirement 6):
 *   1. Filter plans where monthlyPayment <= budget  → "matching" plans.
 *   2. Among matching plans, rank by:
 *        a. Lowest effective total cost  (totalPayable − cashback)
 *        b. Tie-break: highest cashback
 *        c. Tie-break: lowest tenureMonths (shorter commitment)
 *   3. The first plan after sorting is the "recommended" plan.
 *   4. If no plans match, return the plan with the lowest monthlyPayment
 *      as the "closest" plan.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Safe parseFloat — returns 0 for null/undefined/NaN. */
function n(val) {
  const parsed = parseFloat(val)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Effective cost = totalPayable − cashback (what the user actually pays net). */
function effectiveCost(plan) {
  return n(plan.totalPayable) - n(plan.cashback)
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Get budget-based plan recommendations.
 *
 * @param {Array}  plans  — array of EMI plan objects from the API
 * @param {number} budget — user's monthly budget in INR (must be > 0)
 *
 * @returns {{
 *   budget:         number,        // the budget passed in
 *   matching:       Array,         // plans where monthlyPayment <= budget (sorted)
 *   recommended:    object|null,   // best matching plan
 *   recommendReason: string,       // human-readable explanation
 *   closest:        object|null,   // cheapest plan above budget (shown when no match)
 * }}
 */
export function getRecommendations(plans, budget) {
  const budgetNum = n(budget)

  // Guard: invalid budget
  if (!plans || plans.length === 0 || budgetNum <= 0) {
    return {
      budget:          budgetNum,
      matching:        [],
      recommended:     null,
      recommendReason: '',
      closest:         null,
    }
  }

  // ── Step 1: split into matching vs over-budget ────────────────────────────
  const matching  = plans.filter((p) => n(p.monthlyPayment) <= budgetNum)
  const overBudget = plans
    .filter((p) => n(p.monthlyPayment) > budgetNum)
    .sort((a, b) => n(a.monthlyPayment) - n(b.monthlyPayment))

  // ── Step 2: sort matching plans by recommendation ranking ─────────────────
  const sorted = [...matching].sort((a, b) => {
    const costA = effectiveCost(a)
    const costB = effectiveCost(b)

    // Primary: lowest effective cost
    if (costA !== costB) return costA - costB

    // Tie-break 1: highest cashback
    const cbA = n(a.cashback)
    const cbB = n(b.cashback)
    if (cbA !== cbB) return cbB - cbA

    // Tie-break 2: shorter tenure (less commitment)
    return a.tenureMonths - b.tenureMonths
  })

  const recommended = sorted[0] ?? null
  const closest     = overBudget[0] ?? null

  // ── Step 3: build recommendation reason ──────────────────────────────────
  let recommendReason = ''
  if (recommended) {
    const reasons = []

    if (recommended.isNoCost) {
      reasons.push('0% interest — you pay no extra cost')
    } else {
      reasons.push(`lowest effective cost (₹${Math.round(effectiveCost(recommended)).toLocaleString('en-IN')} total)`)
    }

    const hasCashback = n(recommended.cashback) > 0
    if (hasCashback) {
      reasons.push(`₹${Math.round(n(recommended.cashback)).toLocaleString('en-IN')} cashback included`)
    }

    // Check if it's also the lowest monthly EMI among matching plans
    const lowestMonthly = Math.min(...matching.map((p) => n(p.monthlyPayment)))
    if (n(recommended.monthlyPayment) === lowestMonthly && matching.length > 1) {
      reasons.push('lowest monthly payment among matching plans')
    }

    recommendReason = reasons.join(' · ')
  }

  return {
    budget:          budgetNum,
    matching:        sorted,          // matching plans, ranked best → worst
    recommended,
    recommendReason,
    closest,
  }
}

/**
 * Classify a plan relative to a budget and the full recommendation result.
 * Returns one of: 'recommended' | 'fits' | 'over'
 */
export function classifyPlan(plan, budget, recommendedId) {
  if (plan.id === recommendedId) return 'recommended'
  if (n(plan.monthlyPayment) <= n(budget)) return 'fits'
  return 'over'
}
