/// <reference lib="webworker" />

import SparkMD5 from "spark-md5";

const MAX_DIMENSION = 1400;
const TARGET_QUALITY = 0.6;

self.onmessage = async (e: MessageEvent) => {
    const { id, file } = e.data;

    try {
        // 1. Calculate MD5 (CPU intensive)
        const arrayBuffer = await file.arrayBuffer();
        const hash = SparkMD5.ArrayBuffer.hash(arrayBuffer);
        const md5Raw = hash.match(/.{2}/g)?.map((pair) => String.fromCharCode(parseInt(pair, 16))).join("");
        const md5 = btoa(md5Raw || "");

        // 2. Compress Image (if it's an image)
        let processedFile = file;
        let width = 0;
        let height = 0;

        if (file.type.startsWith("image/") && typeof createImageBitmap !== "undefined") {
            try {
                const bitmap = await createImageBitmap(file);
                width = bitmap.width;
                height = bitmap.height;

                const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

                if (scale < 1) {
                    width = Math.max(1, Math.round(width * scale));
                    height = Math.max(1, Math.round(height * scale));

                    // Use OffscreenCanvas if available
                    if (typeof OffscreenCanvas !== "undefined") {
                        const canvas = new OffscreenCanvas(width, height);
                        const ctx = canvas.getContext("2d");
                        if (ctx) {
                            ctx.drawImage(bitmap, 0, 0, width, height);
                            const blob = await canvas.convertToBlob({
                                type: "image/webp",
                                quality: TARGET_QUALITY
                            });

                            const compressedName = file.name.replace(/\.[^.]+$/, "") + ".webp";
                            processedFile = new File([blob], compressedName, { type: "image/webp" });
                        }
                    }
                }
            } catch (imgError) {
                console.warn("Image compression failed in worker, using original", imgError);
            }
        }

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
