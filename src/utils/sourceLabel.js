// Translate a backend product/batch source code (PURCHASED / MANUFACTURED / BOTH / PRODUCTION)
// to the current language, reusing the shared products.source.* keys. Backend data is unchanged.
export const sourceLabel = (t, code) => {
  const c = String(code || '').toUpperCase();
  if (c === 'PURCHASED') return t('products.source.purchased', 'Purchased');
  if (c === 'BOTH') return t('products.source.both', 'Both');
  if (c === 'MANUFACTURED' || c === 'PRODUCTION' || c === 'MADE') return t('products.source.made', 'Made');
  return code || '—';
};
