/**
 * Handle management for Skippster
 */

export interface Handle {
  value: string; // alice.skippster.social
  did: string; // did:plc:...
}

export enum HandleDomain {
  SKIPPSTER_SOCIAL = 'skippster.social',
  SKIPPSTER_TUBE = 'skippster.tube',
  LOCALHOST = 'localhost',
}

export interface HandleReservation {
  handle: string;
  did: string;
  reservedAt: Date;
  expiresAt?: Date;
  signature?: string;
}