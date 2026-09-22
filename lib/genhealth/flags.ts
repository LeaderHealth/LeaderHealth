/**
 * Native checkout may create unpaid patients/consults.
 * Card charges are gated separately in lib/nmi/flags.ts.
 */
export const ALLOW_LIVE_GENHEALTH_ORDERS = true;
