const WIN_ANSI = new Map([
  ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85], ['†', 0x86],
  ['‡', 0x87], ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a], ['‹', 0x8b], ['Œ', 0x8c],
  ['Ž', 0x8e], ['‘', 0x91], ['’', 0x92], ['“', 0x93], ['”', 0x94], ['•', 0x95],
  ['–', 0x96], ['—', 0x97], ['™', 0x99], ['š', 0x9a], ['›', 0x9b], ['œ', 0x9c],
  ['ž', 0x9e], ['Ÿ', 0x9f],
]);

const pdfString = (value) => [...String(value ?? '')].map((character) => {
  const code = character.codePointAt(0);
  const byte = code <= 0xff ? code : WIN_ANSI.get(character);
  if (byte === undefined || byte < 32) return '?';
  if (byte === 0x28 || byte === 0x29 || byte === 0x5c) return `\\${String.fromCharCode(byte)}`;
  if (byte < 127) return String.fromCharCode(byte);
  return `\\${byte.toString(8).padStart(3, '0')}`;
}).join('');

const wrap = (value, limit = 54) => {
  const words = String(value ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > limit) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
};

const text = (value, x, y, size = 10, bold = false) =>
  `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${pdfString(value)}) Tj ET`;

const rule = (y) => `q 0.8 G 50 ${y} m 545 ${y} l S Q`;
const money = (value) => `$${Number(value ?? 0).toFixed(2)}`;

const pageHeader = (sale, pageNumber) => {
  const isCcf = sale.documentType === 'CCF';
  const title = isCcf ? 'Comprobante de credito fiscal (CCF)' : 'Factura consumidor final';
  const label = `${isCcf ? 'CCF' : 'Factura'} #${String(sale.documentNumber).padStart(6, '0')}`;
  return [
    text('ORIGENES SV', 50, 790, 20, true),
    text('RESTAURANTE - EL SALVADOR', 50, 772, 9),
    text(title, 330, 790, 11, true),
    text(label, 330, 772, 10, true),
    text(`Fecha: ${new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(sale.date))}`, 50, 738),
    text(`Cliente: ${sale.customerName || 'Consumidor final'}`, 50, 720),
    ...(sale.customerNit ? [text(`NIT: ${sale.customerNit}`, 50, 702)] : []),
    ...(sale.customerNrc ? [text(`NRC: ${sale.customerNrc}`, 50, 684)] : []),
    text(`Atendio: ${sale.employee?.name ?? ''}`, 50, sale.customerNrc ? 666 : sale.customerNit ? 666 : 702),
    rule(646),
    text('Cant.', 50, 629, 9, true),
    text('Producto', 100, 629, 9, true),
    text('Precio unitario', 380, 629, 9, true),
    text('Importe', 490, 629, 9, true),
    rule(620),
    text(`Pagina ${pageNumber}`, 485, 28, 8),
  ];
};

const buildPageStreams = (sale) => {
  const detailLines = [];
  for (const detail of sale.details ?? []) {
    const names = wrap(detail.product?.name ?? 'Producto', 42);
    detailLines.push({ quantity: detail.quantity, name: names[0], price: money(detail.unitPrice), amount: money(detail.subtotal) });
    for (const continuation of names.slice(1)) detailLines.push({ name: continuation, continuation: true });
  }

  const pages = [];
  const remaining = [...detailLines];
  const lastPageRows = remaining.splice(Math.max(0, remaining.length - 30));
  while (remaining.length) pages.push(remaining.splice(0, 37));
  pages.push(lastPageRows);

  return pages.map((rows, index) => {
    const commands = pageHeader(sale, index + 1);
    let y = 602;
    for (const row of rows) {
      if (row.continuation) {
        commands.push(text(row.name, 100, y, 9));
      } else {
        commands.push(text(row.quantity, 50, y, 9));
        commands.push(text(row.name, 100, y, 9));
        commands.push(text(row.price, 380, y, 9));
        commands.push(text(row.amount, 490, y, 9));
      }
      y -= 14;
    }

    if (index === pages.length - 1) {
      y = Math.max(y - 8, 80);
      commands.push(rule(y));
      commands.push(text(`Subtotal: ${money(sale.subtotal)}`, 390, y - 20, 10));
      commands.push(text(`IVA (13%): ${money(sale.tax)}`, 390, y - 38, 10));
      commands.push(text(`TOTAL: ${money(sale.total)}`, 390, y - 62, 13, true));
      const paymentText = (sale.payments ?? []).map((payment) =>
        `${payment.method.replaceAll('_', ' ')} ${money(payment.amount)}`).join(' / ');
      commands.push(text(`Pago: ${paymentText || 'No especificado'}`, 50, Math.max(y - 84, 42), 9));
      commands.push(text('Gracias por su compra - Origenes SV', 50, 28, 9));
    }
    return commands.join('\n');
  });
};

export const createInvoicePdf = (sale) => {
  if (!sale?.documentNumber || !Array.isArray(sale.details)) {
    throw new Error('No hay suficiente información para generar el PDF de la factura.');
  }

  const streams = buildPageStreams(sale);
  const pageIds = streams.map((_, index) => 5 + index * 2);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ];

  for (let index = 0; index < streams.length; index += 1) {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const stream = streams[index];
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  }

  let document = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(document.length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) document += `${String(offset).padStart(10, '0')} 00000 n \n`;
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(document);
};

export const downloadInvoicePdf = (sale) => {
  const bytes = createInvoicePdf(sale);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const type = sale.documentType === 'CCF' ? 'CCF' : 'Factura';
  const number = String(sale.documentNumber).padStart(6, '0');
  anchor.href = url;
  anchor.download = `${type}-${number}.pdf`;
  anchor.hidden = true;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
