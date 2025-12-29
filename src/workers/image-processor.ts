/// <reference lib="webworker" />

import SparkMD5 from "spark-md5";

const MAX_DIMENSION = 1200;
const TARGET_QUALITY = 0.5;

self.onmessage = async (e: MessageEvent) => {
    const { id, file } = e.data;

    try {
        // 1. Compress Image (if it's an image)
        let processedFile = file;
        let width = 0;
        let height = 0;

        if (file.type.startsWith("image/") && typeof createImageBitmap !== "undefined") {
            try {
                const bitmap = await createImageBitmap(file);
                width = bitmap.width;
                height = bitmap.height;

                const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

                const newWidth = Math.max(1, Math.round(width * scale));
                const newHeight = Math.max(1, Math.round(height * scale));

                // Use OffscreenCanvas if available
                if (typeof OffscreenCanvas !== "undefined") {
                    const canvas = new OffscreenCanvas(newWidth, newHeight);
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);

                        // First attempt: WebP
                        let blob = await canvas.convertToBlob({
                            type: "image/webp",
                            quality: TARGET_QUALITY // 0.5
                        });

                        // Fallback logic: If WebP is too large (likely iOS falling back to PNG), try JPEG
                        if (blob.size > 800 * 1024) { // > 800KB
                            console.warn("WebP compression ineffective (size > 800KB). Falling back to JPEG.");
                            blob = await canvas.convertToBlob({
                                type: "image/jpeg",
                                quality: 0.65 // Increased from 0.5 to 0.65 for readability
                            });
                            // Rename to .jpg for consistency with content
                            const compressedName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
                            processedFile = new File([blob], compressedName, { type: "image/jpeg" });
                        } else {
                            const compressedName = file.name.replace(/\.[^.]+$/, "") + ".webp";
                            processedFile = new File([blob], compressedName, { type: "image/webp" });
                        }
                    }
                }
            } catch (imgError) {
                console.warn("Image compression failed in worker, using original", imgError);
            }
        }

        // 2. Calculate MD5 (on processed file)
        const arrayBuffer = await processedFile.arrayBuffer();
        const hash = SparkMD5.ArrayBuffer.hash(arrayBuffer);
        const md5Raw = hash.match(/.{2}/g)?.map((pair) => String.fromCharCode(parseInt(pair, 16))).join("");
        const md5 = btoa(md5Raw || "");

        self.postMessage({
            type: "complete",
            id,
            file: processedFile,
            md5,
        });

    } catch (error) {
        self.postMessage({
            type: "error",
            id,
            error: error instanceof Error ? error.message : "Unknown worker error",
        });
    }
};
