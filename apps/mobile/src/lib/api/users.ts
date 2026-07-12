/**
 * Purpose: User profile and phone-verification API functions for the mobile app.
 * Why important: phone verification is the gate in front of listing submission
 * (and M-Pesa top-ups); Clerk sign-ins arrive with no phone on record.
 * Used by: use-phone-verification, ListingReviewScreen.
 */
import type {
  PhoneVerificationRequestResponse,
  UserProfile,
} from '@pataspace/contracts';
import { apiFetch } from '../api-client';

export async function fetchMyProfile(
  getToken: () => Promise<string | null>,
): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me', getToken);
}

export async function requestPhoneVerification(
  getToken: () => Promise<string | null>,
  phoneNumber: string,
): Promise<PhoneVerificationRequestResponse> {
  return apiFetch<PhoneVerificationRequestResponse>('/users/me/phone/request-otp', getToken, {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  });
}

export async function verifyPhoneVerification(
  getToken: () => Promise<string | null>,
  phoneNumber: string,
  code: string,
): Promise<UserProfile> {
  return apiFetch<UserProfile>('/users/me/phone/verify-otp', getToken, {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, code }),
  });
}
