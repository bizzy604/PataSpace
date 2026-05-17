/**
 * Purpose: User profile API functions (fetch and update current user).
 * Why important: Centralises user API calls for the profile page.
 * Used by: ProfileOverviewPage, ProfileEditPage.
 */
import type { UserProfile } from '@pataspace/contracts';
import { clientFetch, serverFetch } from './client';

export async function fetchCurrentUser(
  getToken: () => Promise<string | null>,
): Promise<UserProfile> {
  return clientFetch<UserProfile>('/users/me', getToken);
}

export async function getCurrentUser(token: string | null): Promise<UserProfile> {
  return serverFetch<UserProfile>('/users/me', token);
}
