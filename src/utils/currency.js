// Central currency formatting. The symbol lives in a module-level cache that the
// AppSettingsProvider fills from the CURRENCY_SYMBOL system setting on load, so BOTH
// React components and plain modules (e.g. label printing) can format money the same way
// and a change in Settings reflects everywhere after settings reload.

let currencySymbol = '₹';

export const setCurrencySymbol = (symbol) => {
  if (symbol && typeof symbol === 'string') currencySymbol = symbol;
};

export const getCurrencySymbol = () => currencySymbol;

/**
 * Format a number as money using the configured symbol.
 * @param {number|string} value
 * @param {object} [opts]
 * @param {number} [opts.decimals=2] fraction digits
 * @param {boolean} [opts.space=false] put a space after the symbol
 */
export const formatMoney = (value, opts = {}) => {
  const { decimals = 2, space = false } = opts;
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  const num = safe.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${currencySymbol}${space ? ' ' : ''}${num}`;
};

// Whole-rupee variant (no paise) for compact displays.
export const formatMoney0 = (value, opts = {}) => formatMoney(value, { ...opts, decimals: 0 });
