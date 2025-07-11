
import axios from 'axios';
import { apiClient } from './Auth';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  // Get token from localStorage or your auth context
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ScanResult {
  runID: number;
  scanID: number;
  startURL: string;
  totalLinks: number;
  brokenLinks: number;
  runStartedAt: string;
  runEndedAt: string;
}

export interface ScanHistoryResponse {
  success: boolean;
  data: ScanResult[];
}

export interface DashboardSummary {
  broken_links_last_scan: number;
  scans_this_week: number;
  total_users: number;
}

export interface ScanHistory {
  id: number;
  startURL: string;
  totalLinks: number;
  brokenLinks: number;
  createdAt: string;
}

function getNewYorkTimestampFilename(scanId: number): string {
  const now = new Date();

  // Format the date in America/New_York time zone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';

  const formatted = `${get('year')}-${get('month')}-${get('day')}_${get('hour')}-${get('minute')}-${get('second')}`;
  return `Scan_Report_${scanId}_${formatted}.xlsx`;
}


export class dashboardService {
  static async getDashboardSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<DashboardSummary>('/dashboard/stats');
    return response.data;
  }

  static async getRecentScans(): Promise<ScanHistoryResponse> {
    try {
      const response = await apiClient.get('/history/recent');
      console.log("Hello: ", response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      throw new Error('Failed to load scan history. Please try again.');
    }
  }

  static async downloadScanReport(runID: number): Promise<void> {
    const response = await apiClient.get(`/history/${runID}/download`, {
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'];
    let fileName = getNewYorkTimestampFilename(runID);


    // Extract filename from response headers
    if (disposition) {
      const matches = disposition.match(/filename="?([^"]+)"?/);
      if (matches && matches[1]) {
        fileName = matches[1];
      }
    }

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

export default dashboardService;
