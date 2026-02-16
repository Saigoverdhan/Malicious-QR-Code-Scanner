
export enum RiskLevel {
  SAFE = 'Safe',
  SUSPICIOUS = 'Suspicious',
  PHISHING = 'Phishing'
}

export interface ScanResult {
  url: string;
  risk: RiskLevel;
  confidence: number;
  reasons: string[];
  timestamp: number;
}

export interface AnalysisResponse {
  risk: RiskLevel;
  confidence: number;
  reasons: string[];
}
