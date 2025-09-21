import appConfig from '@/config/app.config';
import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';


class FetchUtil {
  private api: AxiosInstance;
  constructor(baseURL: string) {
    console.log(`FetchUtil baseURL:${baseURL}`);
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      // You can add other global configurations here, like timeout.
      timeout: 5000,
    });

    // Add a request interceptor to handle authentication tokens from localStorage
    this.api.interceptors.request.use(
      (config) => {
        try {
          const token = localStorage.getItem('auth_token');
          if (token) {
            // Add the Authorization header to the request config.
            // A common standard is using "Bearer" token.
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Could not access localStorage for token:', error);
        }
        return config;
      },
      (error: AxiosError) => {
        // Handle request errors here
        return Promise.reject(error);
      }
    );
  }

  /**
   * Handles GET requests.
   * @param {string} url - The URL endpoint to hit.
   * @param {object} [params={}] - Optional query parameters to send with the request.
   * @returns {Promise<any>} A promise that resolves with the response data.
   */
  public async get<T>(url: string, params: object = {}): Promise<T> {
    try {
      const response = await this.api.get<T>(url, { params });
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Handles POST requests.
   * @param {string} url - The URL endpoint to hit.
   * @param {object} data - The data payload to send in the request body.
   * @returns {Promise<any>} A promise that resolves with the response data.
   */
  public async post<T>(url: string, data: object): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Handles PUT requests.
   * @param {string} url - The URL endpoint to hit.
   * @param {object} data - The data payload to send in the request body.
   * @returns {Promise<any>} A promise that resolves with the response data.
   */
  public async put<T>(url: string, data: object): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Handles DELETE requests.
   * @param {string} url - The URL endpoint to hit.
   * @returns {Promise<any>} A promise that resolves with the response data.
   */
  public async delete<T>(url: string): Promise<T> {
    try {
      const response = await this.api.delete<T>(url);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  /**
   * A helper method for consistent error handling.
   * @param {AxiosError} error - The error object caught from the API call.
   */
  private handleError(error: AxiosError): void {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request Setup Error:', error.message);
    }
    throw error; // Re-throw the error to be handled by the caller.
  }
}
// Create and export the instance
console.log('Creating FetchUtil instance with baseURL:', appConfig.baseURL);
const instance = new FetchUtil(appConfig.baseURL);
console.log('FetchUtil instance created successfully');
export { FetchUtil };
export const fetchUtil = instance;
