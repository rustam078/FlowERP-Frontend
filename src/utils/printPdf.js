// Send a PDF (given as an object URL) straight to the printer via a hidden iframe.
// Falls back to opening the PDF in a new tab if in-place printing is blocked.
export function printPdfFromUrl(url) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;

  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      window.open(url, '_blank');
    }
    // Keep the iframe alive long enough for the print dialog, then clean up.
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 60000);
  };

  document.body.appendChild(iframe);
}
