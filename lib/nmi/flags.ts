/**
 * Native checkout may tokenize cards and create unpaid GenHealth orders.
 * NMI sales and PATCH-paid stay off until this is flipped.
 */
export const ALLOW_LIVE_NMI_CHARGES = false;
