import assert from "node:assert/strict";
import { test } from "node:test";
import { agreementSendError } from "./agreement-partnership";
import { affiliateAgreementPlace, agreementEditorState, presentAgreement } from "./agreement-view";
import {
  AgreementError,
  agreementCanWithdraw,
  agreementWithdrawUpdate,
  agreementDate,
  agreementDraftDeletable,
  agreementDraftPayload,
  agreementReplyUpdate,
  agreementSentHold,
  agreementShowsExpired,
  agreementStatusLabel,
  parseAgreementDeliverables,
  parseAgreementTerms,
  parkSentAgreement,
  shelveForNewAgreement,
  type AffiliateAgreement,
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
    expiresOn: "2027-11-30",
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

test("a content partnership keeps its monthly terms and can be sent only when complete", () => {
  const terms = parseAgreementTerms({
    ...blankTerms(),
    title: "December content partnership",
    effectiveOn: "2026-12-01",
    expiresOn: "2026-12-31",
    monthlyAmount: "300",
    platforms: ["Instagram", "TikTok"],
    postMix: ["Instagram::Reel::1", "TikTok::Video::2"],
    guidelines: "Talk about booking the first consult.",
  });
  assert.ok(terms);
  assert.equal(terms.monthlyCents, 30000);
  assert.deepEqual(terms.platforms, ["Instagram", "TikTok"]);
  assert.equal(terms.posts.length, 2);
  assert.equal(agreementSendError(terms), null);
  assert.equal(agreementSendError({ ...terms, guidelines: null }), "Add a few lines of guidelines.");
  assert.equal(agreementSendError({ ...terms, effectiveOn: "2026-12-02" }), "The start date has to be the 1st of the month.");
  assert.equal(agreementSendError({ ...terms, expiresOn: "2026-12-15" }), "The end date has to be the last day of the month.");
  assert.equal(parseAgreementTerms({ ...blankTerms(), title: "December content partnership", effectiveOn: "2026-12-01", expiresOn: "2026-12-15" }), null);
  assert.equal(parseAgreementTerms({ ...blankTerms(), platforms: ["Instagram"], postMix: ["TikTok::Video::1"] }), null);
});

test("only an unsent draft can be deleted", () => {
  assert.equal(agreementDraftDeletable({ status: "draft", sentAt: null, questions: [] }), true);
  assert.equal(agreementDraftDeletable({ status: "awaiting_signature", sentAt: "2026-11-19T17:07:34.578Z", questions: [] }), false);
  assert.equal(agreementDraftDeletable({ status: "draft", sentAt: "2026-11-19T17:07:34.578Z", questions: [] }), false);
  assert.equal(agreementDraftDeletable({ status: "draft", sentAt: null, questions: [{}] }), false);
  assert.equal(agreementDraftDeletable({ status: "signed", sentAt: null, questions: [] }), false);
});

test("negotiation keeps a sent agreement under sent until it is accepted", () => {
  const question = { id: "q1", text: "Why?", askedAt: "2026-11-19T17:08:40.994Z", reply: null, repliedAt: null };
  const asked = agreement({ status: "awaiting_signature", current: true, sentAt: "2026-11-19T17:07:34.578Z", replacedAt: "2026-11-19T17:21:00.000Z", questions: [question] });
  const askedView = presentAgreement(asked, "2026-11-19");
  assert.equal(askedView.phase, "waiting");
  assert.equal(askedView.openQuestion, true);
  const answered = agreement({ status: "awaiting_signature", current: true, questions: [{ ...question, reply: "It was 3$.", repliedAt: "2026-11-19T17:10:11.744Z" }] });
  const answeredView = presentAgreement(answered, "2026-11-19");
  assert.equal(answeredView.phase, "waiting");
  assert.equal(answeredView.openQuestion, false);
  assert.equal(agreementCanWithdraw(asked), true);
  assert.equal(agreementCanWithdraw(answered), true);
  assert.equal(agreementCanWithdraw(agreement({ status: "awaiting_signature", current: true })), true);
  assert.equal(agreementCanWithdraw(agreement({ status: "signed", current: true })), false);
  assert.equal(agreementCanWithdraw(agreement({ status: "draft", current: true, sentAt: "2026-11-19T17:07:34.578Z" })), false);
  const withdrawn = agreementWithdrawUpdate();
  assert.deepEqual(withdrawn, { status: "draft" });
  assert.equal("sentAt" in withdrawn, false);
  const backToDraft = presentAgreement({ ...asked, ...withdrawn }, "2026-11-19");
  assert.equal(backToDraft.phase, "draft");
  assert.ok(backToDraft.sentAt);
  assert.deepEqual(agreementSentHold(asked), { status: "awaiting_signature", current: true });
  assert.equal(presentAgreement(agreement({ status: "signed", current: true, expiresOn: "2027-01-31" }), "2026-11-19").phase, "active");
});

test("an agreement marked accepted outside the portal is accepted for the affiliate", () => {
  const recorded = agreement({
    status: "signed",
    current: true,
    sentAt: "2026-11-19T17:07:34.578Z",
    signedAt: "2026-11-19T18:20:00.000Z",
    expiresOn: "2027-01-31",
    questions: [{ id: "q1", text: "Why?", askedAt: "2026-11-19T17:08:40.994Z", reply: "It was 3$.", repliedAt: "2026-11-19T17:10:11.744Z" }],
  });
  const view = presentAgreement(recorded, "2026-11-19");
  assert.equal(view.phase, "active");
  assert.equal(view.openQuestion, false);
  assert.equal(affiliateAgreementPlace(view.phase), "accepted");
  const stillSent = presentAgreement(agreement({ status: "awaiting_signature", current: true, questions: recorded.questions }), "2026-11-19");
  assert.equal(affiliateAgreementPlace(stillSent.phase), "unaccepted");
});

test("a reply does not replace a sent agreement, and a sent agreement cannot be shelved", () => {
  const reply = agreementReplyUpdate([{ id: "q1", text: "Why?", askedAt: "2026-11-19T17:08:40.994Z", reply: "It was 3$.", repliedAt: "2026-11-19T17:10:11.744Z" }]);
  assert.deepEqual(Object.keys(reply), ["questions"]);
  assert.throws(() => shelveForNewAgreement({ status: "awaiting_signature", sentAt: "2026-11-19T17:07:34.578Z" }), (error: unknown) => error instanceof AgreementError && error.code === "status");
  const kept = shelveForNewAgreement({ status: "draft", sentAt: "2026-11-19T17:07:34.578Z" });
  assert.equal(kept.sentAt, "2026-11-19T17:07:34.578Z");
  assert.equal(kept.current, false);
  assert.equal("replacedAt" in kept, false);
});

test("an admin can start a new agreement while earlier ones stay on file", () => {
  const declined = agreement({ status: "declined", current: false });
  const waiting = agreement({ status: "awaiting_signature", current: true });
  const active = agreement({ status: "signed", current: true, expiresOn: "2026-12-31" });
  assert.equal(agreementEditorState(null, [declined], false, "2026-11-19").canReplace, true);
  assert.equal(agreementEditorState(waiting, [], false, "2026-11-19").canReplace, true);
  const parked = parkSentAgreement(waiting);
  assert.deepEqual(parked, { current: false });
  assert.equal(presentAgreement({ ...waiting, ...parked, sentAt: "2026-11-19T17:07:34.578Z" }, "2026-11-19").phase, "waiting");
  assert.equal(agreementEditorState(active, [], false, "2026-11-19").canReplace, false);
  assert.equal(agreementEditorState(null, [], false, "2026-11-19").canReplace, false);
});

function agreement(patch: Pick<AffiliateAgreement, "status" | "current"> & Partial<AffiliateAgreement>): AffiliateAgreement {
  return {
    id: "agree1",
    code: "aa",
    title: null,
    effectiveOn: null,
    expiresOn: null,
    monthlyCents: null,
    platforms: [],
    posts: [],
    guidelines: null,
    deliverables: [],
    compensationNote: null,
    licensing: null,
    paymentConditions: null,
    filePath: null,
    fileName: null,
    contentType: null,
    signerName: null,
    signedAt: null,
    sentAt: null,
    endedAt: null,
    endNote: null,
    createdAt: null,
    replacedAt: null,
    questions: [],
    ...patch,
  };
}

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
