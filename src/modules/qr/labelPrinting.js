import QRCode from 'qrcode';
import { DEFAULT_LABEL_CONFIG } from './qrService';
import { getCurrencySymbol } from '../../utils/currency';

/** Shared label CSS, used by both the print window and the Settings live preview. */
export const LABEL_CSS = `
  .label {
    border: 1px dashed #94a3b8;
    border-radius: 6px;
    padding: 8px 6px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    page-break-inside: avoid;
    box-sizing: border-box;
  }
  .label.vname-on { flex-direction: row; gap: 6px; }
  .label .col { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .label .qr { width: 100%; max-width: 120px; height: auto; }
  .label .name { font-size: 12px; font-weight: 700; line-height: 1.2; }
  .label .vname { writing-mode: vertical-rl; transform: rotate(180deg); font-size: 12px; font-weight: 700; white-space: nowrap; }
  .label .price { font-size: 14px; font-weight: 800; color: #059669; }
  .label .serial { font-size: 10px; color: #64748b; font-family: monospace; }
`;

const money = (v) => `${getCurrencySymbol()}${Number(v).toLocaleString('en-IN')}`;

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Class for the label wrapper given the config. */
export function labelClass(config = DEFAULT_LABEL_CONFIG) {
  return `label${config.nameVertical && config.showName ? ' vname-on' : ''}`;
}

/**
 * Inner HTML for one label. `unit` must already carry `qrDataUrl`.
 * Fields are shown/hidden per config; product name can run vertically on the left.
 */
export function labelInnerHtml(unit, config = DEFAULT_LABEL_CONFIG) {
  const name = escapeHtml(unit.productName || '');
  const parts = [];

  if (config.showName && config.nameVertical) {
    parts.push(`<div class="vname">${name}</div>`);
  }

  const col = [`<img class="qr" src="${unit.qrDataUrl}" alt="${escapeHtml(unit.serial)}" />`];
  if (config.showName && !config.nameVertical) col.push(`<div class="name">${name}</div>`);
  if (config.showPrice) col.push(`<div class="price">${money(unit.printedPrice)}</div>`);
  if (config.showSerial) col.push(`<div class="serial">${escapeHtml(unit.serial)}</div>`);

  parts.push(`<div class="col">${col.join('')}</div>`);
  return parts.join('');
}

/** Generate a QR PNG data URL for a unit's payload (or bare serial). */
export async function toQrDataUrl(unit) {
  return QRCode.toDataURL(unit.qrPayload || unit.serial, { margin: 1, width: 240 });
}

/** Full print-sheet HTML for the given label cards (shared by iframe print + preview). */
export function labelSheetHtml(cards, batchNumber) {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>QR Labels ${batchNumber ? '- ' + escapeHtml(batchNumber) : ''}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; }
  .sheet { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 10px; }
  ${LABEL_CSS}
  @media print { .label { border-color: #cbd5e1; } @page { margin: 8mm; } }
</style>
</head>
<body>
  <div class="sheet">${cards}</div>
</body>
</html>`;
}

/**
 * Render a QR label sheet for the given units and open the print dialog.
 * Prints through a hidden iframe so no pop-up window (and no pop-up blocker) is involved.
 */
export async function printLabels(units, { batchNumber, config = DEFAULT_LABEL_CONFIG } = {}) {
  if (!units || units.length === 0) return;

  const withQr = await Promise.all(
    units.map(async (u) => ({ ...u, qrDataUrl: await toQrDataUrl(u) }))
  );

  const cards = withQr
    .map((u) => `<div class="${labelClass(config)}">${labelInnerHtml(u, config)}</div>`)
    .join('');

  const html = labelSheetHtml(cards, batchNumber);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  await waitForImages(doc);
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => iframe.remove(), 1000);
}

/** Resolve once every image in the doc has loaded (QR data URLs are near-instant; 2s safety cap). */
function waitForImages(doc) {
  return new Promise((resolve) => {
    const imgs = Array.from(doc.images || []);
    if (imgs.length === 0) return resolve();
    let left = imgs.length;
    const done = () => { if (--left <= 0) resolve(); };
    imgs.forEach((img) => (img.complete ? done() : (img.onload = img.onerror = done)));
    setTimeout(resolve, 2000);
  });
}
