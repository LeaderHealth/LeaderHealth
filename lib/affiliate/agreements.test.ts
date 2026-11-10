import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agreementDate,
  agreementDraftPayload,
  agreementShowsExpired,
  agreementStatusLabel,
  parseAgreementDeliverables,
  parseAgreementTerms,
} from "./agreements";

test("agreement dates use a real calendar day", () => {
  assert.equal(agreementDate("2026-11-10"), "2026-11-10");
  assert.equal(agreementDate("2026-02-31"), null);
  assert.equal(agreementDate("11/10/2026"), null);
});

test("only a signed agreement before today displays as expired", () => {
  assert.equal(agreementShowsExpired("signed", "2026-11-09", "2026-11-10"), true);
  assert.equal(agreementShowsExpired("signed", "2026-11-10", "2026-11-10"), false);
  assert.equal(agreementStatusLabel("signed", "2026-11-09", "2026-11-10"), "Expired");
  assert.equal(agreementStatusLabel("ended", "2026-11-01", "2026-11-10"), "Ended");
  assert.equal(agreementStatusLabel("draft", null, "2026-11-10"), "Draft");
});

test("deliverables keep a stated amount and skip a blank row", () => {
  const deliverables = parseAgreementDeliverables({
    descriptions: ["Four posts", ""],
    dues: ["2026-12-01", ""],
    amounts: ["25.50", ""],
  });
  assert.deepEqual(deliverables, [{ description: "Four posts", dueOn: "2026-12-01", amountCents: 2550 }]);
  assert.equal(
    parseAgreementDeliverables({ descriptions: ["", "Four posts"], dues: ["2026-12-01", ""], amounts: ["10", ""] }),
    null,
  );
  assert.equal(parseAgreementDeliverables({ descriptions: ["Four posts"], dues: [""], amounts: ["abc"] }), null);
});

test("a saved agreement does not carry commission or payout fields", () => {
  const terms = parseAgreementTerms({
    effectiveOn: "2026-11-01",
    expiresOn: "2027-11-01",
    descriptions: ["Four posts"],
    dues: ["2026-12-01"],
    amounts: ["25.00"],
    compensationNote: "Referral rate is separate.",
    licensing: "Posts may be reused.",
    paymentConditions: "Order commission is paid after monthly approval.",
  });
  assert.ok(terms);
  assert.equal(parseAgreementTerms({ ...blankTerms(), effectiveOn: "2027-12-01", expiresOn: "2026-01-01" }), null);
  const payload = agreementDraftPayload({ code: "abc123", ...terms });
  assert.equal(payload.status, "draft");
  assert.equal(payload.deliverables[0]?.amountCents, 2500);
  for (const key of ["commissionMode", "commissionPercent", "commissionFixedCents", "approvableCents", "earnedCents", "paidCents"]) {
    assert.equal(key in payload, false);
  }
});

function blankTerms() {
  return {
    effectiveOn: "",
    expiresOn: "",
    descriptions: [],
    dues: [],
    amounts: [],
    compensationNote: "",
    licensing: "",
    paymentConditions: "",
  };
}
