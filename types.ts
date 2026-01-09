
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  ASSISTANT = 'ASSISTANT',
  SETTINGS = 'SETTINGS',
}

export enum Language {
  TELUGU = 'Telugu',
  HINDI = 'Hindi',
  ENGLISH = 'English',
}

export type StaffRole = 'SECURITY' | 'VOLUNTEER' | 'MEDICAL' | 'ADMIN' | 'ALL';

export type AdvisoryCategory = 'CONGESTION' | 'DARSHAN_PAUSE' | 'ROUTE_GUIDE' | 'EMERGENCY';

export interface AdvisoryLog {
  id: string;
  templateId: AdvisoryCategory;
  fields: Record<string, string>;
  finalMessage: string;
  channels: {
    push: 'EXECUTED';
    sms: 'SIMULATED';
    voice: 'SIMULATED';
  };
  timestamp: Date;
}

export interface EnterpriseGatewayConfig {
  whatsappToken: string;
  phoneNumberId: string;
  relayUrl: string; 
  officialSenderName: string;
  gatewayStatus: 'CONNECTED' | 'DISCONNECTED' | 'STANDBY';
  useCorsProxy: boolean;
}

export interface CrowdMetric {
  zoneId: string;
  zoneName: string;
  density: number; 
  status: 'SAFE' | 'MODERATE' | 'CRITICAL';
  flowRate: number; 
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  language?: Language;
}
