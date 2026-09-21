export function countPhoneDigits(value: string) {
  return (String(value).match(/\d/g) || []).length;
}

export function isValidEmail(value: string) {
  const trimmed = value.trim();
  return Boolean(trimmed) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function isValidDateOfBirth(iso: string) {
  const trimmed = String(iso).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return false;
  const [year, month, day] = trimmed.split("-").map(Number);
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) {
    return false;
  }
  const today = new Date();
  const youngest = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const oldest = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
  return birth <= youngest && birth >= oldest;
}

export function isValidUsZip(zip: string) {
  return /^\d{5}$/.test(String(zip || "").trim());
}

export function isPoBoxAddress(line: string) {
  const trimmed = String(line || "").trim();
  if (!trimmed) return false;
  if (/\bp\.?\s*o\.?\s*box\b/i.test(trimmed)) return true;
  if (/\bpost\s+office\s+box\b/i.test(trimmed)) return true;
  return /^\s*box\s+\d/i.test(trimmed);
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function getDobInputBounds() {
  const now = new Date();
  const max = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  const min = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
  return {
    max: `${max.getFullYear()}-${pad2(max.getMonth() + 1)}-${pad2(max.getDate())}`,
    min: `${min.getFullYear()}-${pad2(min.getMonth() + 1)}-${pad2(min.getDate())}`,
  };
}

export type ContactState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
};

export type ShippingState = {
  address1: string;
  city: string;
  state: string;
  zip: string;
  discreet: boolean;
};

export type ConsentState = {
  terms: boolean;
  privacy: boolean;
  telehealth: boolean;
  hipaa: boolean;
  marketing: boolean;
};

export function isDetailsComplete(contact: ContactState) {
  return Boolean(
    contact.firstName.trim() &&
      contact.lastName.trim() &&
      isValidEmail(contact.email) &&
      countPhoneDigits(contact.phone) >= 10 &&
      isValidDateOfBirth(contact.dob),
  );
}

export function isScreeningComplete(answer: string, consent: ConsentState) {
  return (
    answer === "no" &&
    consent.terms &&
    consent.privacy &&
    consent.telehealth &&
    consent.hipaa &&
    consent.marketing
  );
}

export function isShippingComplete(shipping: ShippingState) {
  return Boolean(
    shipping.address1.trim() &&
      shipping.city.trim() &&
      shipping.state.trim() &&
      isValidUsZip(shipping.zip),
  );
}
