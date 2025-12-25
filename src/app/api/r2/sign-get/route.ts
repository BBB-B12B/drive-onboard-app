
import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3"; 
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; 
import { z } from "zod"; 
import { r2 } from "../_client";
import { requireR2Bucket } from "@/lib/r2/env";

const Body = z.object({ r2Key: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const { r2Key } = Body.parse(await req.json());
    
    // TODO: ตรวจสิทธิ์: admin เห็นได้ทั้งหมด; applicant เห็นเฉพาะ path ของตน
    // For now, we allow all for simplicity during development.
    
    const bucket = requireR2Bucket();

    const url = await getSignedUrl(
        r2, 
        new GetObjectCommand({ Bucket: bucket, Key: r2Key }), 
        { expiresIn: Number(process.env.R2_PRESIGN_GET_TTL||300) }
    );
    
    return NextResponse.json({ url });

  } catch (error) {
      console.error("Error signing GET URL:", error);
      if (error instanceof z.ZodError) {
          return NextResponse.json({ error: "Invalid request body", details: error.issues }, { status: 400 });
      }
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
