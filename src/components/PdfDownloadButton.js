// src/components/PdfDownloadButton.js
import React from 'react';
import { generateEmployeePDF } from '../services/pdfService';
import { FaFilePdf } from 'react-icons/fa'; // Using react-icons instead

const PdfDownloadButton = () => {
  const handleDownload = async () => {
    try {
      const pdfBlob = await generateEmployeePDF();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'employees.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        padding: '8px 16px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginLeft: '10px'
      }}
    >
      <FaFilePdf />
      Export to PDF
    </button>
  );
};

export default PdfDownloadButton;