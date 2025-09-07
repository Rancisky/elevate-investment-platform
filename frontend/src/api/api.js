// API Configuration - CENTRALIZED FOR ALL COMPONENTS
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// API utility functions
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add authorization token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    console.log(`Making API call to: ${url}`);
    const response = await fetch(url, config);
    
    console.log(`Response status for ${endpoint}: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Response data for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Direct API URL access for components that need it
export const API_URL = API_BASE_URL;

// Legacy support - some components might use this
export const API_BASE_URL_EXPORT = API_BASE_URL;

// Default export
export default apiRequest;