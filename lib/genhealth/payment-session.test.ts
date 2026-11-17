import assert from "node:assert/strict";
import { test } from "node:test";
import { readCompletedPayment, readNmiTokenizationKey, readPaymentSession } from "./payment-session-read";

test("reads an NMI payment session and a completed subscription order", () => {
  const session = readPaymentSession({
    paymentSessionId: "sess_1",
    paymentSessionToken: "tok_1",
    paymentProcessor: "nmi",
    subscribing: true,
  });
  assert.deepEqual(session, {
    id: "sess_1",
    token: "tok_1",
    processor: "nmi",
    subscribing: true,
  });

  assert.equal(
    readNmiTokenizationKey({
      paymentProcessor: "nmi",
      publicConfig: { tokenizationKey: "pk_test" },
    }),
    "pk_test",
  );
  assert.equal(readNmiTokenizationKey({ paymentProcessor: "stripe", publicConfig: { publicKey: "pk" } }), "");

  const paid = readCompletedPayment({
    orderId: "ord_1",
    status: "paid",
    amountCents: 17900,
    magicLink: "https://portal.example/in",
    subscription: { status: "active", enrollmentId: "enr_1" },
  });
  assert.equal(paid?.orderId, "ord_1");
  assert.equal(paid?.amount, 179);
  assert.equal(paid?.subscriptionStatus, "active");
  assert.equal(paid?.magicLink, "https://portal.example/in");
});
