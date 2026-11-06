// Payment mode display labels. CREDIT is shown as "Udhaar (Credit)" so it never
// reads like the DUE payment status (the two used to share the word "CREDIT").
const MODE_LABEL = { CREDIT: 'Udhaar (Credit)' };

export const modeLabel = (mode) => (mode ? (MODE_LABEL[mode] || mode.replace(/_/g, ' ')) : '—');
