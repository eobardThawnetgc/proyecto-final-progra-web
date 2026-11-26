const currency = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const unitCostCurrency = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD', maximumFractionDigits: 6 });
const dateFormat = new Intl.DateTimeFormat('es-SV', { timeZone: 'UTC', dateStyle: 'medium' });
const paymentDateFormat = new Intl.DateTimeFormat('es-SV', { timeZone: 'America/El_Salvador', dateStyle: 'short', timeStyle: 'short' });

export const money = (amount) => currency.format(Number(amount));
export const unitCostMoney = (amount) => unitCostCurrency.format(Number(amount));
export const invoiceDate = (date) => dateFormat.format(new Date(date));
export const paymentDate = (date) => paymentDateFormat.format(new Date(date));

export const paymentStatuses = {
    PENDING: { label: 'Pendiente', color: 'danger' },
    PARTIAL: { label: 'Pago parcial', color: 'warning' },
    PAID: { label: 'Pagada', color: 'success' },
};

export const lineCents = ({ quantity, unitCost }) => {
    const units = Number(quantity);
    const cost = Number(unitCost);
    if (!Number.isInteger(units) || units < 1 || units > 999999999 || !Number.isFinite(cost) || cost < 0 || cost >= 100000000) return 0n;
    const costMillionths = BigInt(Math.round(cost * 1000000));
    return (BigInt(units) * costMillionths + 5000n) / 10000n;
};
