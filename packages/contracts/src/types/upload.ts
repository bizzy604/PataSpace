export type CreateUploadUrlRequest = {
  filename: string;
  contentType: 'image/jpeg' | 'image/png' | 'video/mp4';
  fileSize: number;
};

export type CreateUploadUrlResponse = {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
};

export type ConfirmUploadRequest = {
  s3Key: string;
};

export type ConfirmUploadResponse = {
  s3Key: string;
  url: string;
  cdnUrl: string;
};
