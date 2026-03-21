export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum ListingStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  UNLOCKED = 'UNLOCKED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  DELETED = 'DELETED',
  REJECTED = 'REJECTED',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum TransactionType {
  PURCHASE = 'PURCHASE',
  SPEND = 'SPEND',
  REFUND = 'REFUND',
  BONUS = 'BONUS',
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  DUE = 'DUE',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum ConfirmationSide {
  OUTGOING_TENANT = 'OUTGOING_TENANT',
  INCOMING_TENANT = 'INCOMING_TENANT',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}
