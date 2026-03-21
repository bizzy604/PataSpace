export type UnlockContact = {
  phoneNumber: string;
  address: string;
  latitude?: number;
  longitude?: number;
};

export type CreateUnlockRequest = {
  listingId: string;
};

export type UnlockRecord = {
  unlockId: string;
  listingId: string;
  creditsSpent: number;
  createdAt: string;
  contact: UnlockContact;
  message?: string;
};
