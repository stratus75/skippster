/**
 * In-memory store for development and testing
 */

import { StoredIdentity, StoredHandleReservation } from './types';

export class MemoryStore {
  private static instance: MemoryStore;
  private identities: Map<string, StoredIdentity> = new Map();
  private handles: Map<string, StoredHandleReservation> = new Map();

  private constructor() {}

  static getInstance(): MemoryStore {
    if (!MemoryStore.instance) {
      MemoryStore.instance = new MemoryStore();
    }
    return MemoryStore.instance;
  }

  /**
   * Store identity by DID
   */
  storeIdentity(did: string, identity: StoredIdentity): void {
    this.identities.set(did, identity);
  }

  /**
   * Get identity by DID
   */
  getIdentity(did: string): StoredIdentity | null {
    return this.identities.get(did) || null;
  }

  /**
   * Store handle reservation
   */
  storeHandleReservation(reservation: StoredHandleReservation): void {
    this.handles.set(reservation.handle, reservation);
  }

  /**
   * Get handle reservation
   */
  getHandleReservation(handle: string): StoredHandleReservation | null {
    return this.handles.get(handle) || null;
  }

  /**
   * Get all handle reservations
   */
  getAllHandleReservations(): StoredHandleReservation[] {
    return Array.from(this.handles.values());
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.identities.clear();
    this.handles.clear();
  }
}