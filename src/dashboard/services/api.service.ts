import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { AuthService } from "./auth.service";

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = AuthService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Capture Observability Headers
        const traceId = response.headers['x-trace-id'];
        const agentId = response.headers['x-agent-id'];
        
        if (traceId) {
          console.debug(`[Trace] ${traceId} @ ${agentId || 'unknown'}`);
          // Optionally store in a global state or context for UI display
          sessionStorage.setItem('last_trace_id', traceId);
          sessionStorage.setItem('last_agent_id', agentId || '');
        }
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await AuthService.refreshAccessToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            AuthService.logout();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(this.handleError(error));
      },
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const { data, status } = error.response as AxiosResponse<any>;
      return {
        message: data?.message || "An error occurred",
        statusCode: status,
        errors: data?.errors,
      };
    }

    if (error.request) {
      return {
        message: "No response from server",
        statusCode: 0,
      };
    }

    return {
      message: error.message || "An unexpected error occurred",
      statusCode: 0,
    };
  }

  // Generic request methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Update base URL
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  // Get raw axios instance for advanced usage
  getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiService = new ApiService();
export default apiService;
