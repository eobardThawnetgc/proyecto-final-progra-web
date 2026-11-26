
const currencyFormatter = new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
});

export const paymentStatuses = {
    PENDING: { label: 'Pendiente', color: 'warning' },
    PARTIAL: { label: 'Parcial', color: 'info' },
    PAID: { label: 'Pagada', color: 'success' },
};

export const money = (value) => currencyFormatter.format(Number(value) || 0);

export const unitCostMoney = (value) => new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
}).format(Number(value) || 0);

const formatDate = (value) => {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
};

export const invoiceDate = formatDate;
export const paymentDate = formatDate;

export const lineCents = ({ quantity, unitCost }) => {
    const quantityText = String(quantity);
    const costText = String(unitCost);

    if (!/^\d{1,9}$/.test(quantityText) ||
        !/^\d{1,8}(\.\d{1,6})?$/.test(costText)) {
        return 0n;
    }

    const units = BigInt(quantityText);

    const [whole, fraction = ''] = costText.split('.');

    const costMillionths =
        BigInt(whole) * 1000000n +
        BigInt(fraction.padEnd(6, '0'));

    return (
        BigInt(units) * costMillionths + 5000n
    ) / 10000n;
};
