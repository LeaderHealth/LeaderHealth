import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { refundSignal, settlesOrder, webhookEvent, webhookOrder, webhookSigned, STATUS_EVENT } from "./webhook";

test("a status update reads a wrapped order id and order status", () => {
  const body = {
    type: "order.status_updated",
    data: { order: { orderId: "ord_9", orderStatus: "partially_refunded" } },
  };
  const order = webhookOrder(body);
  assert.equal(webhookEvent(body, null), STATUS_EVENT);
  assert.equal(order.orderId, "ord_9");
  assert.equal(order.orderStatus, "partially_refunded");
  assert.equal(order.paymentStatus, "");
  assert.equal(settlesOrder(STATUS_EVENT, order), true);
  assert.equal(refundSignal(STATUS_EVENT, order), true);
});

test("a status update with no status still settles when the order id is present", () => {
  const order = webhookOrder({ event: STATUS_EVENT, orderId: "ord_2" });
  assert.equal(order.present.paymentStatus, false);
  assert.equal(order.present.orderStatus, false);
  assert.equal(settlesOrder(STATUS_EVENT, order), true);
  assert.equal(refundSignal(STATUS_EVENT, order), false);
});

test("a raw body signature still matches", () => {
  const raw = "{}";
  const secret = "plain-secret";
  const signature = createHmac("sha256", secret).update(raw).digest("hex");
  const headers = new Headers({ "x-genhealth-signature": signature });
  assert.equal(webhookSigned(headers, raw, secret), true);
  assert.equal(webhookSigned(headers, raw, "other-secret"), false);
});

test("a whsec signature covers the webhook id, timestamp, and raw body", () => {
  const raw = JSON.stringify({ event: STATUS_EVENT, orderId: "ord_1", orderStatus: "refunded" });
  const secret = `whsec_${Buffer.from("test-secret-key").toString("base64")}`;
  const id = "msg_123";
  const timestamp = "1710000000";
  const key = Buffer.from(secret.slice("whsec_".length), "base64");
  const signature = createHmac("sha256", key).update(`${id}.${timestamp}.${raw}`).digest("base64");
  const headers = new Headers({
    "webhook-id": id,
    "webhook-timestamp": timestamp,
    "webhook-signature": `v1,${signature}`,
  });
  assert.equal(webhookSigned(headers, raw, secret), true);
  assert.equal(webhookSigned(headers, `${raw} `, secret), false);
});
