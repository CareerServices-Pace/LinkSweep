
import { apiClient } from './Auth';

export interface ScanResult {
  runID: number;
  scanID: number;
  startURL: string;
  totalLinks: number;
  brokenLinks: number;
  runStartedAt: string;
  runEndedAt:string;
}

export interface ScanResultDetail {
  source_page: string;
  link: string;
  status_code: number;
  status_text: string;
  link_type: string;
  fixGuide: string
}

export interface ScanHistoryResponse {
  success: boolean;
  data: ScanResult[];
}

export interface ScanResultDataResponse {
  success: boolean;
  data: ScanResultDetail[];
}

export class HistoryService {

  static async getAllScanHistory(): Promise<ScanHistoryResponse> {
    try {
      const response = await apiClient.get('/history/all');
      console.log("Hello: ", response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch scan history:', error);
      throw new Error('Failed to load scan history. Please try again.');
    }
  }

  static async getScanDetails(runID: number): Promise<ScanResultDataResponse> {
    try {
      const response = await apiClient.get(`/history/${runID}/full`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch scan details:', error);
      throw new Error('Failed to load scan details. Please try again.');
    }
  }
}

export default HistoryService;