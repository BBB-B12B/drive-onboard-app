/**
 * Resolve the Cloudflare R2 bucket name from environment variables.
 * We support both `R2_BUCKET` and `R2_BUCKET_NAME` for convenience,
 * since different deployment environments may expose either variant.
 */
export function getR2Bucket(): string | undefined {
  return process.env.R2_BUCKET || process.env.R2_BUCKET_NAME;
}

/**
 * Helper that ensures an R2 bucket value is available.
 * Throws a descriptive error so callers can handle it consistently.
 */
export function requireR2Bucket(): string {
  const bucket = getR2Bucket();
  if (!bucket) {
    throw new Error(
      'R2 bucket environment variable is not set. Configure R2_BUCKET or R2_BUCKET_NAME.'
    );
  }
  return bucket;
}

