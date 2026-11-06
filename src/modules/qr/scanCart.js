/**
 * Merge a scanned unit into a sale's item list.
 *
 * Rules (agreed in design):
 *  - Same product + same batch + same printed price → increment qty, append serial.
 *  - Different batch or price → new line (via makeNewItem).
 *  - A serial already present anywhere in the cart → rejected.
 *
 * `items`       current item array (each may carry productId, batchNumber, sellingPrice, serials, quantity)
 * `unit`        scan result: { serial, productId, productName, batchNumber, printedPrice, status }
 * `makeNewItem` (unit) => a form-specific new item object (must include serials:[serial], quantity:1)
 *
 * Returns { items, error }. On error, items is unchanged.
 */
export function mergeScannedUnit(items, unit, makeNewItem) {
  if (!unit) return { items, error: 'Nothing scanned.' };
  if (unit.status && unit.status !== 'AVAILABLE') {
    return { items, error: `Unit ${unit.serial} is ${String(unit.status).toLowerCase()} — cannot sell.` };
  }

  const alreadyInCart = items.some((it) => Array.isArray(it.serials) && it.serials.includes(unit.serial));
  if (alreadyInCart) {
    return { items, error: `${unit.serial} is already in this sale.` };
  }

  const idx = items.findIndex(
    (it) =>
      it.productId === unit.productId &&
      it.batchNumber === unit.batchNumber &&
      Number(it.sellingPrice) === Number(unit.printedPrice)
  );

  if (idx !== -1) {
    const next = items.map((it, i) =>
      i === idx
        ? { ...it, quantity: Number(it.quantity || 0) + 1, serials: [...(it.serials || []), unit.serial] }
        : it
    );
    return { items: next };
  }

  return { items: [...items, makeNewItem(unit)] };
}
