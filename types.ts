
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

export interface EnterpriseGatewayConfig {
  whatsappToken: string;
  phoneNumberId: string;
  officialSenderName: string;
  gatewayStatus: 'CONNECTED' | 'DISCONNECTED' | 'STANDBY';
  useCorsProxy: boolean;
}

export interface StaffAlert {
  id: string;
  role: StaffRole;
  message: string;
  sender: string;
  timestamp: Date;
  isRead: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  language?: Language;
}

export interface CrowdMetric {
  zoneId: string;
  zoneName: string;
  density: number; // 0-100
  status: 'SAFE' | 'MODERATE' | 'CRITICAL';
  flowRate: number; // people per minute
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  zone?: string;
}
