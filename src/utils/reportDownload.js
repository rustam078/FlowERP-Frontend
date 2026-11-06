import axiosInstance from '../services/axios';
import dayjs from 'dayjs';
import { printPdfFromUrl } from './printPdf';

// Reports can span thousands of rows, so give them far longer than the default request timeout.
const REPORT_TIMEOUT_MS = 180000;

// Report file-name token: "Jan_2026" for a full calendar month, else "01Jan2026_to_15Jan2026".
export function periodToken(from, to) {
  const f = dayjs(from);
  const t = dayjs(to);
  if (!f.isValid() || !t.isValid()) return 'report';
  if (f.date() === 1 && t.isSame(f.endOf('month'), 'day')) {
    return f.format('MMM_YYYY');
  }
  return `${f.format('DDMMMYYYY')}_to_${t.format('DDMMMYYYY')}`;
}

// Current calendar month, used when the page has no date range selected.
export function currentMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { fromDate: fmt(first), toDate: fmt(last) };
}

function filenameFromHeaders(headers, fallback) {
  const cd = (headers && (headers['content-disposition'] || headers['Content-Disposition'])) || '';
  const match = /filename="?([^";]+)"?/.exec(cd);
  return match ? match[1] : fallback;
}

// Error bodies arrive as a Blob (responseType blob), so read the JSON message out of it.
async function toReadableError(err) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      return new Error(parsed.message || 'Download failed');
    } catch {
      return new Error('Download failed');
    }
  }
  return err instanceof Error ? err : new Error('Download failed');
}

// Download a report blob from a GET endpoint, honoring the server-provided filename.
export async function downloadReport(path, params, fallbackName) {
  let response;
  try {
    response = await axiosInstance.get(path, { params, responseType: 'blob', timeout: REPORT_TIMEOUT_MS });
  } catch (err) {
    throw await toReadableError(err);
  }
  const name = filenameFromHeaders(response.headers, fallbackName);
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

// Fetch a PDF report and send it straight to the printer instead of downloading.
export async function printReport(path, params) {
  let response;
  try {
    response = await axiosInstance.get(path, { params, responseType: 'blob', timeout: REPORT_TIMEOUT_MS });
  } catch (err) {
    throw await toReadableError(err);
  }
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  printPdfFromUrl(url);
}
