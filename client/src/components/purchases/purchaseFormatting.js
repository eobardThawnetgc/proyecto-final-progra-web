
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
