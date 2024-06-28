import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://3.108.9.65:5000', // Ensure this is the correct base URL for your API
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('API Response Error:', error.response.data);
        console.error('API Response Status:', error.response.status);
        console.error('API Response Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('API Request Error:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('API Configuration Error:', error.message);
      }
      console.error('API Error Config:', error.config);
      return Promise.reject(error);
  }
);

export default apiClient;
