export type MonetizationType = 'free' | 'donations' | 'payperview' | 'subscription';

export interface Video {
  id: string;
  did: string;
  title: string;
  description: string | null;
  thumbnailCid: string | null;
  magnetLink: string;
  duration: number;
  views: number;
  tags: string[] | null;
  monetizationType: MonetizationType;
  price: number | null;
  currency: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoUpload {
  title: string;
  description?: string;
  tags?: string[];
  monetizationType: MonetizationType;
  price?: number;
  currency?: string;
}