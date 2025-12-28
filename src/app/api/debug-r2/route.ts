import { NextResponse } from "next/server";
import { getR2Binding } from "@/lib/r2/binding";



export async function GET() {
    const debug: any = {
        step: "Start",
        env_vars: {
            R2Endpoint: process.env.R2_ENDPOINT ? "Set" : "Missing", // Note: Bindings don't use endpoint
            BindResult: "Pending"
        }
    };

    try {
        // 1. Get Binding
        debug.step = "Get Binding";
        const bucket = await getR2Binding();
        debug.BindResult = bucket ? "Success (Found Binding)" : "Failed (No Binding)";

        if (!bucket) {
            throw new Error("R2 Binding is null");
        }

        // 2. List Test
        debug.step = "List Objects";
        const list = await bucket.list({ limit: 1 });
        debug.list_result = {
            objects_count: list.objects.length,
            first_key: list.objects[0]?.key || "none"
        };

        // 3. Put Test
        debug.step = "Put Object";
        await bucket.put("debug-native.txt", "Hello Native R2");
        debug.put_result = "Success";

        debug.step = "Complete";
        return NextResponse.json(debug);

    } catch (error: any) {
        debug.error = error.message;
        debug.stack = error.stack;
        return NextResponse.json(debug, { status: 500 });
    }
}
