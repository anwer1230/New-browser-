export interface ChromeTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading?: boolean;
  history: string[];
  historyIndex: number;
  isIncognito?: boolean;
  isMuted?: boolean;
  zoomLevel?: number;
}

export interface ChromeBookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  folder?: string;
}

export interface ChromeHistoryItem {
  id: string;
  title: string;
  url: string;
  timestamp: number;
  domain: string;
}

export interface ChromeDownloadItem {
  id: string;
  filename: string;
  url: string;
  size: string;
  progress: number;
  status: 'completed' | 'downloading' | 'failed';
  timestamp: number;
}
