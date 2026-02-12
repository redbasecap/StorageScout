import type { Timestamp } from 'firebase/firestore';

export type Item = {
  id: string;
  name: string;
  description: string;
  boxId: string;
  location: string;
  imageUrl: string;
  userId: string;
  createdAt: Timestamp;
};

export type Box = {
  id: string;
  items: Item[];
  location?: string;
};
