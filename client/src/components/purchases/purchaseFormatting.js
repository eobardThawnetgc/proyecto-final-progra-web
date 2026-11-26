const currency = new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' });
const dateFormat = new Intl.DateTimeFormat('es-SV', { timeZone: 'UTC', dateStyle: 'medium' });

export const money = (amount) => currency.format(Number(amount));
export const invoiceDate = (date) => dateFormat.format(new Date(date));

export const paymentStatuses = {
    PENDING: { label: 'Pendiente', color: 'danger' },
    PARTIAL: { label: 'Pago parcial', color: 'warning' },
    PAID: { label: 'Pagada', color: 'success' },
};

export const lineCents = ({ quantity, unitCost }) => {
    if (!/^\d{1,9}(\.\d{1,3})?$/.test(quantity) || !/^\d{1,8}(\.\d{1,2})?$/.test(unitCost)) return 0n;
    const thousandths = BigInt(Math.round(Number(quantity) * 1000));
    const cents = BigInt(Math.round(Number(unitCost) * 100));
    return (thousandths * cents + 500n) / 1000n;
};
