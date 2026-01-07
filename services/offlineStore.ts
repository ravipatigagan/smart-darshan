export interface OfflineItem {
  id: string;
  type: 'ANALYTICS' | 'CHAT_MSG' | 'ALERT';
  payload: any;
  timestamp: number;
}

const STORAGE_KEY = 'divyadrishti_offline_queue';

export const queueData = (type: 'ANALYTICS' | 'CHAT_MSG' | 'ALERT', payload: any): number => {
  const currentQueue: OfflineItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const newItem: OfflineItem = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    type,
    payload,
    timestamp: Date.now()
  };
  currentQueue.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentQueue));
  return currentQueue.length;
};

export const getQueueCount = (): number => {
  const currentQueue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return currentQueue.length;
};

export const syncOfflineData = async (): Promise<number> => {
  // Simulate network latency and processing
  const currentQueue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const count = currentQueue.length;
  
  if (count === 0) return 0;

  await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate upload time
  
  // Clear queue
  localStorage.removeItem(STORAGE_KEY);
  return count;
};