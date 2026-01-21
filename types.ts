
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface MediaItem {
  id: string;
  url: string;
  type: MediaType;
  title: string;
  description?: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
  size?: string;
}

export type TabType = 'library' | 'videos' | 'for-you' | 'favorites' | 'search' | 'settings';

export interface AppSettings {
  theme: 'light' | 'dark';
  gridSize: 'small' | 'medium' | 'large';
  autoTagging: boolean;
  storageUsage: number;
  uploadSpeedLimit: 'unlimited' | '10mbps' | '5mbps' | '1mbps';
  wifiOnly: boolean;
}
