/**
 * Purpose: Two-stage S3 upload API for the mobile app.
 * Why important: Listing creation requires confirmed S3 assets; this module handles
 *   presigned URL generation, direct S3 upload, and upload confirmation.
 * Used by: mobile-app-provider (submitDraft).
 */
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

async function uploadAndConfirmAsset(
  getToken: () => Promise<string | null>,
  uri: string,
  filename: string,
  contentType: 'image/jpeg' | 'video/mp4',
): Promise<ConfirmUploadResponse> {
  const blob = await fetch(uri).then((r) => r.blob());
  const { uploadUrl, s3Key } = await requestUploadUrl(getToken, filename, contentType, blob.size);

  const result = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });
  if (!result.ok) {
    throw new Error(`S3 upload failed: ${result.status}`);
  }

  return confirmUploadedAsset(getToken, s3Key);
}

/**
 * Fetches a local file URI as a blob, uploads it directly to S3 via a presigned
 * PUT URL, then calls the confirm endpoint. Returns the confirmed asset response.
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
