import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertAdmin } from "../_auth";
import { getR2Binding } from "@/lib/r2/binding";

const Body = z.object({
  r2Keys: z.array(z.string().min(1)).min(1, "r2Keys array cannot be empty"),
});

export async function POST(req: NextRequest) {
  try {
    await assertAdmin(req);

    const { r2Keys } = Body.parse(await req.json());
    const r2 = await getR2Binding();

    // R2 Binding delete accepts string or string[]
    await r2.delete(r2Keys);

    // Native binding doesn't return detailed per-object success/fail like S3 SDK
    // We assume batch delete request was accepted.
    return NextResponse.json({
      message: "Objects deleted successfully.",
      deleted: r2Keys
    });

  } catch (error: any) {
    console.error("[R2 DeleteObjects Error]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { error: `Could not delete objects. Reason: ${errorMessage}` },
      { status: 500 }
    );
  }
}


