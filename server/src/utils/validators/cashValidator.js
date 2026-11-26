import { z } from 'zod';

const amount = z.string().trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Ingresa un monto válido en dólares');

export const openCashSchema = z.strictObject({
    openingAmount: amount,
});

export const closeCashSchema = z.strictObject({
    cash: amount,
    card: amount,
    digital: amount,
    bitcoin: amount,
    chivoWallet: amount,
});
