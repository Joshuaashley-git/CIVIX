// API Configuration for Civix Frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export const api = {
  baseURL: API_BASE_URL,
  
  // Helper function to make API requests
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();
    
    // Return the data even for error responses, so we can handle them in the calling code
    // This allows us to access error messages from the API
    return data;
  },

  // GET request
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  },

  // POST request
  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // PUT request
  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  // DELETE request
  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  },
};

// Health check function
export const checkApiHealth = async () => {
  try {
    const health = await api.get<{
      status: string;
      message: string;
      timestamp: string;
      blockchain: {
        connected: boolean;
        network: string;
      };
    }>('/health');
    return health;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    throw error;
  }
};