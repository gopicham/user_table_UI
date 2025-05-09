// Updated pdfService.js with axios
import axios from 'axios';

export const generateEmployeePDF = async () => {
  try {
    const response = await axios({
      url: `${process.env.REACT_APP_API_BASE_URL}/document/v1/pdf`,
      method: 'GET',
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('PDF generation failed:', {
      error: error.response?.data || error.message,
      status: error.response?.status,
      config: error.config
    });
    throw error;
  }
};