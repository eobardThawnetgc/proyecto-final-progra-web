const WIN_ANSI = new Map([['á', 0xe1], ['é', 0xe9], ['í', 0xed], ['ó', 0xf3], ['ú', 0xfa], ['Á', 0xc1], ['É', 0xc9], ['Í', 0xcd], ['Ó', 0xd3], ['Ú', 0xda], ['ñ', 0xf1], ['Ñ', 0xd1], ['ü', 0xfc], ['Ü', 0xdc], ['–', 0x96]]);
const pdfString = (value) => [...String(value ?? '')].map((character) => {
    const code = character.codePointAt(0);
    const byte = code <= 0xff ? code : WIN_ANSI.get(character);
    if (byte === undefined || byte < 32) return '?';
    if ([0x28, 0x29, 0x5c].includes(byte)) return `\\${String.fromCharCode(byte)}`;
    return byte < 127 ? String.fromCharCode(byte) : `\\${byte.toString(8).padStart(3, '0')}`;
}).join('');

const text = (value, x, y, size = 11, bold = false) => `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${pdfString(value)}) Tj ET`;
const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;
const date = (value) => new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));

export const createPayrollPdf = (payroll) => {
    if (!payroll?.employee?.name || !payroll.periodStart || !payroll.periodEnd) throw new Error('Faltan datos para generar el comprobante de planilla.');
    const rows = [
        text('ORÍGENES SV', 54, 780, 20, true),
        text('COMPROBANTE DE PAGO DE PLANILLA', 54, 744, 14, true),
        text(`Empleado: ${payroll.employee.name}`, 54, 704, 12, true),
        text(`Cargo: ${payroll.employee.position || '—'}`, 54, 684),
        text(`Período: ${date(payroll.periodStart)} al ${date(payroll.periodEnd)}`, 54, 664),
        text(`Comprobante: ${payroll.id}`, 54, 644),
        'q 0.75 G 54 620 m 541 620 l S Q',
        text('Detalle', 54, 596, 11, true),
        text('Salario bruto', 54, 566), text(money(payroll.grossSalary), 440, 566),
        text('ISSS', 54, 540), text(`- ${money(payroll.isss)}`, 440, 540),
        text('AFP', 54, 514), text(`- ${money(payroll.afp)}`, 440, 514),
        text('ISR', 54, 488), text(`- ${money(payroll.incomeTax)}`, 440, 488),
        'q 0.75 G 54 466 m 541 466 l S Q',
        text('Salario neto pagado', 54, 436, 13, true), text(money(payroll.netSalary), 430, 436, 13, true),
        text('Documento generado por el sistema de gestión Orígenes SV.', 54, 76, 9),
    ].join('\n');
    const objects = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [5 0 R] /Count 1 >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>`,
        `<< /Length ${rows.length} >>\nstream\n${rows}\nendstream`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new TextEncoder().encode(pdf);
};

export const downloadPayrollPdf = (payroll) => {
    const blob = new Blob([createPayrollPdf(payroll)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Planilla-${payroll.id}-${String(payroll.employee.name).trim().replace(/[^\p{L}\p{N}-]+/gu, '-')}.pdf`;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
