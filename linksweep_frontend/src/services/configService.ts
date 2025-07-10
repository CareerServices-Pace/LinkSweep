import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

// Axios instance with default config
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Axios interceptor for Authorization Header (optional, since you're using cookies)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ConfigData {
  maxDepth: number;
  timeout: number;
  excludePaths: string;
  retryCount: number;
  autoScan: number;
  autoScanTimes: string;
}

export interface SavedConfiguration {
  scanID: number;
  userID: number;
  startURL: string;
  config: ConfigData;
  createdAt: string;
  modifiedAt: string;
}

export interface SaveConfigRequest {
  config: {
    startURL: string;
    maxDepth: number;
    timeout: number;
    excludePaths: string;
    retryCount: number;
    autoScan: number;
    autoScanTimes: string;
  };
}

export interface UpdateConfigRequest extends SaveConfigRequest {
  scanID: number;
}

export const configService = {
  async getAllConfigurations(): Promise<SavedConfiguration[]> {
    const response = await apiClient.get<{ success: boolean; data: SavedConfiguration[] }>('/config/');
    return response.data.data;
  },

  async getConfiguration(scanID: number): Promise<SavedConfiguration> {
    const response = await apiClient.get<{ success: boolean; data: SavedConfiguration }>(`/config/${scanID}`);
    return response.data.data;
  },

  async saveConfiguration(config: SaveConfigRequest): Promise<void> {
    await apiClient.post('/config/save', config);
  },

  async updateConfiguration(data: UpdateConfigRequest): Promise<void> {
    await apiClient.put('/config/update', data);
  },

  async deleteConfiguration(scanID: number): Promise<void> {
    await apiClient.delete(`/config/${scanID}`);
  },

  async triggerScan(scanID: number): Promise<void> {
    await apiClient.post(`/config/scan/${scanID}`);
  },

};