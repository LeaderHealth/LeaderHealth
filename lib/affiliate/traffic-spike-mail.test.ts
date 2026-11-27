import assert from "node:assert/strict";
import { test } from "node:test";
import { trafficSpikeCopy } from "./email";
import { safeAdminNext } from "./session";

test("the spike email asks the admin to count the clicks or leave them out", () => {
  const copy = trafficSpikeCopy({ name: "Angie", detail: "Nov 12, 50 clicks in 1 hour" });
  assert.equal(copy.subject, "Unusual traffic spike to review");
  assert.match(copy.body, /Angie/);
  assert.match(copy.body, /Nov 12, 50 clicks in 1 hour/);
  assert.match(copy.body, /Count those clicks toward pay/);
  assert.match(copy.body, /leave that hour out/);
});

test("a spike review link can return only inside the admin dashboard", () => {
  assert.equal(
    safeAdminNext("/admin/affiliates/reporting?month=2026-11&review=angie"),
    "/admin/affiliates/reporting?month=2026-11&review=angie",
  );
  assert.equal(safeAdminNext("https://example.com/admin/affiliates/reporting"), "");
  assert.equal(safeAdminNext("//admin/affiliates/reporting"), "");
  assert.equal(safeAdminNext("/admin/affiliates/../overview"), "");
});
