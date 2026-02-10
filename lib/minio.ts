import * as Minio from "minio";

// MinIO client configuration
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: parseInt(process.env.MINIO_PORT || "9000"),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
});

// Bucket names
export const BUCKETS = {
  DOCUMENTS: "documents",
  AVATARS: "avatars",
  UPLOADS: "uploads",
} as const;

// Ensure bucket exists
export async function ensureBucket(bucketName: string): Promise<void> {
  const exists = await minioClient.bucketExists(bucketName);
  if (!exists) {
    await minioClient.makeBucket(bucketName);
    console.log(`Bucket '${bucketName}' created successfully`);
  }
}

// Initialize all buckets
export async function initializeBuckets(): Promise<void> {
  for (const bucket of Object.values(BUCKETS)) {
    await ensureBucket(bucket);
  }
}

// Upload file to MinIO
export async function uploadFile(
  bucketName: string,
  objectName: string,
  filePath: string,
  metadata?: Record<string, string>
): Promise<string> {
  await minioClient.fPutObject(bucketName, objectName, filePath, metadata || {});
  return objectName;
}

// Upload buffer to MinIO
export async function uploadBuffer(
  bucketName: string,
  objectName: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  const metadata: Record<string, string> = {};
  if (contentType) {
    metadata["Content-Type"] = contentType;
  }
  await minioClient.putObject(bucketName, objectName, buffer, buffer.length, metadata);
  return objectName;
}

// Get presigned URL for downloading
export async function getPresignedUrl(
  bucketName: string,
  objectName: string,
  expirySeconds: number = 3600
): Promise<string> {
  return await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
}

// Get presigned URL for uploading
export async function getPresignedUploadUrl(
  bucketName: string,
  objectName: string,
  expirySeconds: number = 3600
): Promise<string> {
  return await minioClient.presignedPutObject(bucketName, objectName, expirySeconds);
}

// Delete file from MinIO
export async function deleteFile(
  bucketName: string,
  objectName: string
): Promise<void> {
  await minioClient.removeObject(bucketName, objectName);
}

// Delete multiple files from MinIO
export async function deleteFiles(
  bucketName: string,
  objectNames: string[]
): Promise<void> {
  await minioClient.removeObjects(bucketName, objectNames);
}

// List files in a bucket with prefix
export async function listFiles(
  bucketName: string,
  prefix?: string
): Promise<Minio.BucketItem[]> {
  return new Promise((resolve, reject) => {
    const objects: Minio.BucketItem[] = [];
    const stream = minioClient.listObjects(bucketName, prefix, true);
    
    stream.on("data", (obj) => objects.push(obj));
    stream.on("error", reject);
    stream.on("end", () => resolve(objects));
  });
}

// Get file info
export async function getFileInfo(
  bucketName: string,
  objectName: string
): Promise<Minio.BucketItemStat> {
  return await minioClient.statObject(bucketName, objectName);
}

// Copy file within MinIO
export async function copyFile(
  sourceBucket: string,
  sourceObject: string,
  destBucket: string,
  destObject: string
): Promise<void> {
  const copyConditions = new Minio.CopyConditions();
  await minioClient.copyObject(
    destBucket,
    destObject,
    `/${sourceBucket}/${sourceObject}`,
    copyConditions
  );
}

// Generate unique object name with timestamp
export function generateObjectName(
  originalName: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_");
  const objectName = `${baseName}_${timestamp}_${randomStr}.${extension}`;
  return prefix ? `${prefix}/${objectName}` : objectName;
}

export { minioClient };
export default minioClient;
