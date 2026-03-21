import { z } from 'zod';

export const createUploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.enum(['image/jpeg', 'image/png', 'video/mp4']),
  fileSize: z.number().int().positive(),
});

export const createUploadUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  s3Key: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export const confirmUploadSchema = z.object({
  s3Key: z.string().min(1),
});

export const confirmUploadResponseSchema = z.object({
  s3Key: z.string().min(1),
  url: z.string().url(),
  cdnUrl: z.string().url(),
});
