import { listCatalog } from "./catalog";
import { matchCatalogItem } from "./match";
import type { CatalogItem } from "./types";
import { genHealthRequest } from "./client";
import { ALLOW_LIVE_GENHEALTH_ORDERS } from "./flags";
import { US_STATES } from "./usStates";

export type CheckoutInput = {
  clientProductId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  street1: string;
  city: string;
  state: string;
  zip: string;
  product?: string;
  variant?: string;
};

export type CheckoutResult = {
  dryRun: boolean;
  orderId: string;
  patientId: string;
  patientStatus: string;
  productName: string;
  amount: number | null;
  magicLink: string | null;
  paymentStatus: string;
};

function field(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function email(value: string) {
  return value.trim().toLowerCase();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function patientIdFrom(data: unknown): string {
  const record = asRecord(data);
  if (!record) return "";
  const patient = asRecord(record.patient);
  const rows = Array.isArray(record.patients) ? record.patients : patient ? [patient] : [];
  for (const row of rows) {
    const item = asRecord(row);
    const id = field(item?.patientId) || field(item?.patient_id) || field(item?.id);
    if (id) return id;
  }
  return field(record.patientId) || field(record.patient_id);
}

function orderIdFrom(data: unknown): string {
  const record = asRecord(data);
  if (!record) return "";
  const first = Array.isArray(record.orders) ? asRecord(record.orders[0]) : null;
  return field(record.orderId) || field(first?.orderId);
}

function magicLinkFrom(data: unknown) {
  const record = asRecord(data);
  const link = field(record?.magicLink);
  return link || null;
}

function adultDob(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const dob = new Date(`${value}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return false;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return dob <= cutoff;
}

export function parseCheckoutInput(body: unknown): { ok: true; value: CheckoutInput } | { ok: false; error: string } {
  const record = asRecord(body);
  if (!record) return { ok: false, error: "Checkout details are required." };

  const state = field(record.state).toUpperCase();
  const value: CheckoutInput = {
    clientProductId: field(record.clientProductId),
    firstName: field(record.firstName),
    lastName: field(record.lastName),
    email: email(field(record.email)),
    phone: field(record.phone),
    dateOfBirth: field(record.dateOfBirth),
    street1: field(record.street1),
    city: field(record.city),
    state,
    zip: field(record.zip),
    product: field(record.product),
    variant: field(record.variant),
  };

  if (!value.clientProductId) return { ok: false, error: "Choose a treatment." };
  if (!value.firstName || !value.lastName) return { ok: false, error: "Enter your first and last name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) return { ok: false, error: "Enter a valid email." };
  if (value.phone.replace(/\D/g, "").length < 10) return { ok: false, error: "Enter a valid phone number." };
  if (!adultDob(value.dateOfBirth)) return { ok: false, error: "You must be 18 or older." };
  if (!value.street1 || !value.city || !value.zip) return { ok: false, error: "Enter a complete shipping address." };
  if (!US_STATES.some((item) => item.code === value.state)) return { ok: false, error: "Choose a valid U.S. state." };

  return { ok: true, value };
}

async function resolvePatient(input: CheckoutInput) {
  const lookup = await genHealthRequest("/v2/client/patients", {
    query: { email: input.email },
  });

  if (lookup.success) {
    const patientId = patientIdFrom(lookup.data);
    if (!patientId) {
      throw new Error("Patient lookup succeeded but no patient id was returned.");
    }
    return { patientId, patientStatus: "existing", magicLink: magicLinkFrom(lookup.data) };
  }

  if (lookup.status !== 404) {
    throw Object.assign(new Error(lookup.error || "Could not look up this email."), { status: lookup.status });
  }

  const created = await genHealthRequest("/v2/client/patients", {
    method: "POST",
    body: {
      patient: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth,
        address: {
          street1: input.street1,
          city: input.city,
          state: input.state,
          zip: input.zip,
        },
      },
      send_email: false,
    },
  });

  if (!created.success) {
    if (created.status === 409) {
      const retry = await genHealthRequest("/v2/client/patients", {
        query: { email: input.email },
      });
      const patientId = patientIdFrom(retry.data);
      if (retry.success && patientId) {
        return { patientId, patientStatus: "existing", magicLink: magicLinkFrom(retry.data) };
      }
    }
    throw Object.assign(new Error(created.error || "Could not create the patient record."), {
      status: created.status,
    });
  }

  const patientId = patientIdFrom(created.data);
  if (!patientId) {
    throw new Error("Patient created but no patient id was returned.");
  }

  return { patientId, patientStatus: "new", magicLink: magicLinkFrom(created.data) };
}

async function createOrder(item: CatalogItem, patientId: string) {
  const order: Record<string, unknown> = {
    clientProductId: item.clientProductId,
    payment_status: "unpaid",
    tracking: { source: "leaderhealth_web" },
  };
  if (item.amount != null) order.amount = item.amount;

  const path =
    item.kind === "lab"
      ? "/v2/client/labs/requests"
      : `/v2/client/patients/${encodeURIComponent(patientId)}/consults`;

  const body: Record<string, unknown> = {
    patient_id: patientId,
    order,
    send_email: false,
  };

  const response = await genHealthRequest(path, { method: "POST", body });
  if (!response.success) {
    throw Object.assign(new Error(response.error || "Could not create the order."), {
      status: response.status,
    });
  }

  const orderId = orderIdFrom(response.data);
  if (!orderId) {
    throw new Error("Order created but no order id was returned.");
  }

  const data = asRecord(response.data);
  return {
    orderId,
    magicLink: magicLinkFrom(response.data),
    paymentStatus: field(data?.paymentStatus) || "unpaid",
  };
}

export async function placeCheckoutOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const catalog = await listCatalog();
  const item =
    catalog.find((entry) => entry.clientProductId === input.clientProductId) ??
    matchCatalogItem(catalog, {
      clientProductId: input.clientProductId,
      product: input.product,
      variant: input.variant,
    });
  if (!item) {
    throw Object.assign(new Error("This treatment is no longer available."), { status: 404 });
  }
  if (item.excludedStates.includes(input.state)) {
    throw Object.assign(new Error(`This treatment is not available in ${input.state}.`), { status: 400 });
  }

  if (!ALLOW_LIVE_GENHEALTH_ORDERS) {
    console.info("[checkout] dry-run: catalog matched, no GenHealth patient or order write");
    return {
      dryRun: true,
      orderId: `preview-${item.clientProductId}`,
      patientId: "",
      patientStatus: "not_sent",
      productName: item.displayName || item.name,
      amount: item.amount,
      magicLink: null,
      paymentStatus: "not_sent",
    };
  }

  const patient = await resolvePatient(input);
  const order = await createOrder(item, patient.patientId);

  return {
    dryRun: false,
    orderId: order.orderId,
    patientId: patient.patientId,
    patientStatus: patient.patientStatus,
    productName: item.displayName || item.name,
    amount: item.amount,
    magicLink: order.magicLink || patient.magicLink,
    paymentStatus: order.paymentStatus,
  };
}
