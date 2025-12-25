// src/app/api/applications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { applications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Manifest } from '@/lib/types';


export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appId } = await params;
  if (!appId) {
    return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
  }

  try {
    const db = await getDb();
    const appRecord = await db.select().from(applications).where(eq(applications.appId, appId)).get();

    if (!appRecord || !appRecord.appId) {
      // Fallback: If not in DB, maybe check R2? Or currently we assume full migration.
      // If we are migrating, we might want a fallback, but per plan "Move to D1", we assume D1 is source.
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!appRecord.rawData) {
      return NextResponse.json({ error: 'Application data is corrupted' }, { status: 500 });
    }

    const manifest: Manifest = JSON.parse(appRecord.rawData as string);
    return NextResponse.json(manifest);

  } catch (error) {
    console.error(`[App ${appId} GET Error]`, error);
    return NextResponse.json({ error: 'Failed to retrieve application data.' }, { status: 500 });
  }
}
