import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Box, Button, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import salesService from '../services/salesService';
import InvoiceLayout from '../components/InvoiceLayout';
import { useT } from '../../../contexts/LanguageContext';

const InvoicePreview = () => {
  const t = useT();
  const navigate = useNavigate();
  const { saleId } = useParams();
  const invoiceRef = useRef(null);

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ['invoicePreview', saleId],
    queryFn: () => salesService.getInvoicePreview(saleId),
    enabled: Boolean(saleId),
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;

    const element = invoiceRef.current;
    const canvas = await html2canvas(element, {
      scale: Math.max(2, window.devicePixelRatio || 2),
      useCORS: true,
      backgroundColor: '#ffffff',
      width: element.offsetWidth,
      height: element.offsetHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth;
    const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);

    let heightLeft = imgHeight - pageHeight;
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${invoice.invoiceNumber || invoice.invoice || invoice.invoiceNo || saleId}.pdf`);
  };

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/sales/${saleId}`)}>
          {t('common.back', 'Back')}
        </Button>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={() => window.print()}>
            {t('common.print', 'Print')}
          </Button>
          <Button variant="contained" onClick={handleDownloadPdf}>
            {t('sales.downloadPdf', 'Download PDF')}
          </Button>
        </Box>
      </Box>
      <Box>
        <InvoiceLayout ref={invoiceRef} invoice={invoice || {}} />
      </Box>
    </Box>
  );
};

export default InvoicePreview;
