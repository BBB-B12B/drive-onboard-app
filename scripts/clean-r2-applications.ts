
import 'dotenv/config';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

// Bucket name from user request/wrangler.toml
const BUCKET_NAME = "driveonboard-stg";
const PREFIX = "applications/";

async function main() {
    console.log(`Starting cleanup for bucket: ${BUCKET_NAME}, prefix: ${PREFIX}`);

    if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        console.error("Error: R2_ENDPOINT, R2_ACCESS_KEY_ID, or R2_SECRET_ACCESS_KEY are missing from environment.");
        process.exit(1);
    }

    const client = new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
    });

    let continuationToken: string | undefined = undefined;
    let totalDeleted = 0;

    do {
        console.log("Listing objects...");
        const listCmd = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: PREFIX,
            ContinuationToken: continuationToken
        });

        const res = await client.send(listCmd);

        if (res.Contents && res.Contents.length > 0) {
            console.log(`Found ${res.Contents.length} objects. Deleting...`);

            const deleteCmd = new DeleteObjectsCommand({
                Bucket: BUCKET_NAME,
                Delete: {
                    Objects: res.Contents.map(c => ({ Key: c.Key })),
                    Quiet: true
                }
            });

            await client.send(deleteCmd);
            totalDeleted += res.Contents.length;
            console.log(`Deleted batch. Total so far: ${totalDeleted}`);
        } else {
            console.log("No objects found in this batch.");
        }

        continuationToken = res.NextContinuationToken;

    } while (continuationToken);

    console.log(`Cleanup complete. Total objects deleted: ${totalDeleted}`);
}

main().catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
});
