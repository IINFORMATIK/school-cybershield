
export enum SecurityLevel {
  LOW = 'Низкий',
  MEDIUM = 'Средний',
  HIGH = 'Высокий',
  CRITICAL = 'Критический'
}

export interface Device {
  id: string;
  ip: string;
  mac: string;
  hostname: string;
  os: string;
  type: 'Workstation' | 'Server' | 'Router' | 'IoT' | 'Printer';
  status: 'Online' | 'Offline' | 'Suspicious';
  lastSeen: string;
  vulnerabilities: number;
}

export interface Vulnerability {
  id: string;
  deviceId: string;
  severity: SecurityLevel;
  title: string;
  description: string;
  recommendation: string;
}

export interface WifiNetwork {
  ssid: string;
  bssid: string;
  signal: number;
  security: string;
  channel: number;
  isRogue: boolean;
}

export interface SecurityScan {
  timestamp: string;
  deviceCount: number;
  threatsFound: number;
  networkHealth: number;
  vulnerabilities: Vulnerability[];
}
