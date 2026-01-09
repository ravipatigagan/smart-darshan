
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ANALYTICS = 'ANALYTICS',
  ASSISTANT = 'ASSISTANT',
  SETTINGS = 'SETTINGS',
  ENDOWMENTS_OVERVIEW = 'ENDOWMENTS_OVERVIEW',
  COMPLIANCE_VAULT = 'COMPLIANCE_VAULT',
  TEMPLE_ONBOARDING = 'TEMPLE_ONBOARDING',
  EMERGENCY_OVERSIGHT = 'EMERGENCY_OVERSIGHT',
  TEMPLE_DETAILS = 'TEMPLE_DETAILS',
}

export enum Language {
  TELUGU = 'Telugu',
  HINDI = 'Hindi',
  ENGLISH = 'English',
}

export type StaffRole = 'SECURITY' | 'VOLUNTEER' | 'MEDICAL' | 'ADMIN' | 'ALL';

export type AdvisoryCategory = 'CONGESTION' | 'DARSHAN_PAUSE' | 'ROUTE_GUIDE' | 'EMERGENCY';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export type AlertStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISPATCHED' | 'RESOLVED';

export interface TacticalStep {
  id: string;
  instruction: string;
  isCompleted: boolean;
}

export interface ProposedAlert {
  id: string;
  category: AdvisoryCategory;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  status: AlertStatus;
  playbookSteps?: TacticalStep[];
}

export interface IncidentLifecycle {
  id: string;
  category: AdvisoryCategory;
  severity: AlertSeverity;
  description: string;
  t1_detected: Date;
  t2_approved?: Date;
  t3_dispatched?: Date;
  t4_resolved?: Date;
  adminInvolved: string;
  status: 'ACTIVE' | 'RESOLVED';
  isSOS?: boolean;
}

export interface AlertAuditEntry {
  id: string;
  alertId: string;
  action: 'CREATE' | 'EDIT' | 'APPROVE' | 'REJECT' | 'DISPATCH' | 'RESOLVE';
  admin: string;
  timestamp: Date;
  details: string;
}

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

export interface TempleStatus {
  id: string;
  name: string;
  location: string;
  density: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  activeAlerts: number;
  incidentCount: number;
  lastUpdate: Date;
  isMock: boolean;
}

export interface ZoneConfig {
  id: string;
  name: string;
  type: 'ENTRY' | 'EXIT' | 'QUEUE' | 'SANCTUM';
  cctvCount: number;
}

export interface TempleConfig {
  id: string;
  name: string;
  district: string;
  archetype: 'QUAD_GOPURAM' | 'LINEAR_CAVE' | 'MULTI_QUEUE';
  gates: number;
  zones: ZoneConfig[];
  queueTypes: string[];
}
