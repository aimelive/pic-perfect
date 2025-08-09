import type { Timestamp } from 'firebase/firestore';

export interface Image {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  tags: string[];
  createdAt: Timestamp;
}
