/**
 * Subscription lifecycle unit tests — no database, no HTTP.
 * Tests the pure logic extracted from subscriptionService.js:
 *   addMonths (date arithmetic), activateSubscription state machine.
 *
 * Run: node --test src/__tests__/subscriptionLogic.test.js
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ─── Replicate the helpers under test ──────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;
const TIER_RANK = { free: 0, pro: 1, premium: 2 };

const addMonths = (date, months) => {
  const d = new Date(date);
  const originalDay = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDay, maxDay));
  return d;
};

/** Simplified state machine — same logic as subscriptionService, pure/sync for testing. */
function computeActivation({ existingTier, existingEndDate, newTier, newDurationMonths, now }) {
  const newRank = TIER_RANK[newTier] ?? 0;
  const existingRank = existingTier ? (TIER_RANK[existingTier] ?? 0) : -1;
  const existing = existingTier ? { tier: existingTier, endDate: existingEndDate } : null;

  // Case 1: No active subscription
  if (!existing) {
    const start = now;
    return { status: "active", startDate: start, endDate: addMonths(start, newDurationMonths) };
  }

  // Case 2: Downgrade
  if (newRank < existingRank) {
    const start = existing.endDate;
    return { status: "scheduled", startDate: start, endDate: addMonths(start, newDurationMonths) };
  }

  // Case 3: Upgrade
  if (newRank > existingRank) {
    const remainingMs = Math.max(0, existing.endDate.getTime() - now.getTime());
    const remainingDaysCredit = Math.floor(remainingMs / DAY_MS);
    const start = now;
    const baseEnd = addMonths(start, newDurationMonths);
    const end = new Date(baseEnd.getTime() + remainingDaysCredit * DAY_MS);
    return { status: "active", startDate: start, endDate: end };
  }

  // Case 4: Same tier — extend
  const start = existing.endDate > now ? existing.endDate : now;
  return { status: "active", startDate: start, endDate: addMonths(start, newDurationMonths) };
}

// ─── Test utilities ─────────────────────────────────────────────────────────

const d = (isoStr) => new Date(isoStr);
const daysDiff = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY_MS);

// ─── 1. Date arithmetic ──────────────────────────────────────────────────────

describe("addMonths — date arithmetic", () => {
  it("Monthly: 05 Jun → 05 Jul", () => {
    const result = addMonths(d("2026-06-05"), 1);
    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 6); // July = 6
    assert.equal(result.getDate(), 5);
  });

  it("Quarterly: 05 Jun → 05 Sep", () => {
    const result = addMonths(d("2026-06-05"), 3);
    assert.equal(result.getMonth(), 8); // September = 8
    assert.equal(result.getDate(), 5);
  });

  it("Semi-annual: 05 Jun → 05 Dec", () => {
    const result = addMonths(d("2026-06-05"), 6);
    assert.equal(result.getMonth(), 11); // December = 11
    assert.equal(result.getDate(), 5);
  });

  it("Annual: 05 Jun 2026 → 05 Jun 2027", () => {
    const result = addMonths(d("2026-06-05"), 12);
    assert.equal(result.getFullYear(), 2027);
    assert.equal(result.getMonth(), 5);
    assert.equal(result.getDate(), 5);
  });

  it("Month-end clamp: Jan 31 + 1 month → Feb 28 (not Mar 3)", () => {
    const result = addMonths(d("2026-01-31"), 1);
    assert.equal(result.getMonth(), 1); // February = 1
    assert.equal(result.getDate(), 28); // Feb 2026 has 28 days
  });

  it("Month-end clamp (leap year): Jan 31 + 1 month → Feb 29", () => {
    const result = addMonths(d("2024-01-31"), 1);
    assert.equal(result.getMonth(), 1); // February = 1
    assert.equal(result.getDate(), 29); // 2024 is a leap year
  });

  it("Month-end: Mar 31 + 1 month → Apr 30", () => {
    const result = addMonths(d("2026-03-31"), 1);
    assert.equal(result.getMonth(), 3); // April = 3
    assert.equal(result.getDate(), 30);
  });

  it("Cross-year: Nov 30 + 3 months → Feb 28", () => {
    const result = addMonths(d("2025-11-30"), 3);
    assert.equal(result.getFullYear(), 2026);
    assert.equal(result.getMonth(), 1); // February
    assert.equal(result.getDate(), 28);
  });
});

// ─── 2. State machine scenarios ──────────────────────────────────────────────

describe("activateSubscription state machine", () => {
  const NOW = d("2026-06-20T10:00:00Z");

  it("1. No existing plan → activate immediately, startDate = now", () => {
    const r = computeActivation({
      existingTier: null, existingEndDate: null,
      newTier: "pro", newDurationMonths: 1, now: NOW
    });
    assert.equal(r.status, "active");
    assert.deepEqual(r.startDate, NOW);
    assert.equal(r.endDate.getDate(), 20); // 20 Jul
    assert.equal(r.endDate.getMonth(), 6);
  });

  it("2. Premium active (→ 05 Jul), user buys Pro on 20 Jun → scheduled, not active", () => {
    const premiumEnd = d("2026-07-05T13:28:00Z");
    const r = computeActivation({
      existingTier: "premium", existingEndDate: premiumEnd,
      newTier: "pro", newDurationMonths: 1, now: NOW
    });
    assert.equal(r.status, "scheduled",
      "Downgrade must NOT immediately activate — Premium access must continue");
    assert.deepEqual(r.startDate, premiumEnd,
      "Pro must start exactly when Premium expires");
    assert.equal(r.endDate.getDate(), 5);   // 05 Aug
    assert.equal(r.endDate.getMonth(), 7);  // August
  });

  it("3. Pro active (→ 05 Jul), user buys Premium on 20 Jun → active immediately with 15 days credit", () => {
    const proEnd = d("2026-07-05T10:00:00Z");
    const r = computeActivation({
      existingTier: "pro", existingEndDate: proEnd,
      newTier: "premium", newDurationMonths: 1, now: NOW
    });
    assert.equal(r.status, "active");
    assert.deepEqual(r.startDate, NOW);
    // Base end = 20 Jul, credit = 15 remaining Pro days → 04 Aug
    const credit = daysDiff(NOW, proEnd); // 15
    const baseEnd = addMonths(NOW, 1);     // 20 Jul
    const expectedEnd = new Date(baseEnd.getTime() + credit * DAY_MS);
    assert.deepEqual(r.endDate, expectedEnd,
      `Upgrade must include ${credit} day credit from Pro`);
  });

  it("4. Pro active (→ 05 Jul), user buys Pro on 20 Jun → extends to 05 Aug, not overwrite", () => {
    const proEnd = d("2026-07-05T10:00:00Z");
    const r = computeActivation({
      existingTier: "pro", existingEndDate: proEnd,
      newTier: "pro", newDurationMonths: 1, now: NOW
    });
    assert.equal(r.status, "active");
    assert.deepEqual(r.startDate, proEnd,
      "Same-tier extension must start from old endDate, not from now");
    assert.equal(r.endDate.getDate(), 5);  // 05 Aug
    assert.equal(r.endDate.getMonth(), 7); // August
  });

  it("5. Premium active (→ 05 Jul), user buys Premium on 20 Jun → extends to 05 Aug", () => {
    const premEnd = d("2026-07-05T10:00:00Z");
    const r = computeActivation({
      existingTier: "premium", existingEndDate: premEnd,
      newTier: "premium", newDurationMonths: 1, now: NOW
    });
    assert.equal(r.status, "active");
    assert.deepEqual(r.startDate, premEnd);
    assert.equal(r.endDate.getMonth(), 7); // August
  });

  it("6. Pro monthly → startDate + 1 month = endDate (correct period)", () => {
    const r = computeActivation({
      existingTier: null, existingEndDate: null,
      newTier: "pro", newDurationMonths: 1, now: d("2026-06-05T13:28:00Z")
    });
    assert.equal(r.endDate.getDate(), 5);
    assert.equal(r.endDate.getMonth(), 6); // July
    assert.equal(daysDiff(r.startDate, r.endDate), 30); // June has 30 days
  });

  it("7. Pro quarterly → startDate + 3 months = endDate", () => {
    const start = d("2026-06-05");
    const r = computeActivation({
      existingTier: null, existingEndDate: null,
      newTier: "pro", newDurationMonths: 3, now: start
    });
    assert.equal(r.endDate.getMonth(), 8); // September
    assert.equal(r.endDate.getDate(), 5);
  });

  it("8. Pro semi-annual → startDate + 6 months = endDate", () => {
    const start = d("2026-06-05");
    const r = computeActivation({
      existingTier: null, existingEndDate: null,
      newTier: "pro", newDurationMonths: 6, now: start
    });
    assert.equal(r.endDate.getMonth(), 11); // December
    assert.equal(r.endDate.getDate(), 5);
  });

  it("9. Pro annual → startDate + 12 months = endDate", () => {
    const start = d("2026-06-05");
    const r = computeActivation({
      existingTier: null, existingEndDate: null,
      newTier: "pro", newDurationMonths: 12, now: start
    });
    assert.equal(r.endDate.getFullYear(), 2027);
    assert.equal(r.endDate.getMonth(), 5);  // June
    assert.equal(r.endDate.getDate(), 5);
  });

  it("10. Downgrade sets scheduledStartDate = active plan endDate exactly", () => {
    const premiumEnd = d("2026-09-15T08:30:00Z");
    const r = computeActivation({
      existingTier: "premium", existingEndDate: premiumEnd,
      newTier: "pro", newDurationMonths: 3, now: NOW
    });
    assert.equal(r.status, "scheduled");
    assert.deepEqual(r.startDate, premiumEnd);
    assert.equal(r.endDate.getMonth(), 11); // Dec (Sep + 3 = Dec)
    assert.equal(r.endDate.getDate(), 15);
  });
});
