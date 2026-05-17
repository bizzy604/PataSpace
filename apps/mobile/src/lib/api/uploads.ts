/**
 * Purpose: Two-stage S3 upload API for the mobile app.
 * Why important: Listing creation requires confirmed S3 assets; this module handles
 *   presigned URL generation, direct S3 upload, and upload confirmation.
 * Used by: mobile-app-provider (submitDraft).
 */
import * as FileSystem from 'expo-file-system/legacy';
import type {
  ConfirmUploadResponse,
  CreateUploadUrlResponse,
} from '@pataspace/contracts';
import { apiFetch } from '../api-client';

export async function requestUploadUrl(
  getToken: () => Promise<string | null>,
  filename: string,
  contentType: 'image/jpeg' | 'image/png' | 'video/mp4',
  fileSize: number,
): Promise<CreateUploadUrlResponse> {
  return apiFetch<CreateUploadUrlResponse>('/uploads/presigned-url', getToken, {
    method: 'POST',
    body: JSON.stringify({ filename, contentType, fileSize }),
  });
}

export async function confirmUploadedAsset(
  getToken: () => Promise<string | null>,
  s3Key: string,
): Promise<ConfirmUploadResponse> {
  return apiFetch<ConfirmUploadResponse>('/uploads/confirm', getToken, {
    method: 'POST',
    body: JSON.stringify({ s3Key }),
  });
}

/**
 * PUT a file directly to S3 via presigned URL using expo-file-system.
 * React Native's fetch() and XHR stall or error on binary PUT uploads in Hermes;
 * FileSystem.uploadAsync handles local file URIs reliably on both Android and iOS.
 */
async function putToS3(uploadUrl: string, fileUri: string, contentType: string): Promise<void> {
  const result = await FileSystem.uploadAsync(uploadUrl, fileUri, {
    httpMethod: 'PUT',
    headers: { 'Content-Type': contentType },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`S3 upload failed: ${result.status} — check bucket exists and IAM permissions`);
  }
}

async function uploadAndConfirmAsset(
  getToken: () => Promise<string | null>,
  uri: string,
  filename: string,
  contentType: 'image/jpeg' | 'video/mp4',
): Promise<ConfirmUploadResponse> {
  const info = await FileSystem.getInfoAsync(uri);
  const fileSize = info.exists ? info.size : 0;

  const { uploadUrl, s3Key } = await requestUploadUrl(getToken, filename, contentType, fileSize);

  await putToS3(uploadUrl, uri, contentType);

  return confirmUploadedAsset(getToken, s3Key);
}

/**
 * Uploads a photo from a local URI to S3 and confirms it with the backend.
 */
export async function uploadAndConfirmPhoto(
  getToken: () => Promise<string | null>,
  uri: string,
  index: number,
): Promise<ConfirmUploadResponse> {
  return uploadAndConfirmAsset(getToken, uri, `photo-${index + 1}.jpg`, 'image/jpeg');
}

export async function uploadAndConfirmVideo(
  getToken: () => Promise<string | null>,
  uri: string,
): Promise<ConfirmUploadResponse> {
  return uploadAndConfirmAsset(getToken, uri, 'walkthrough.mp4', 'video/mp4');
}
