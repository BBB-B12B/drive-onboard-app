// src/app/api/applications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { applications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Manifest } from '@/lib/types';
import { sampleManifests } from '@/data/sample-data'; // Keep fallback

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
      // Fallback for dev/mock: check sample data
      const sample = sampleManifests[appId];
      if (sample) {
        return NextResponse.json(sample);
      }
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!appRecord.rawData) {
      return NextResponse.json({ error: 'Application data is corrupted' }, { status: 500 });
    }

    const manifest: Manifest = JSON.parse(appRecord.rawData as string);
    return NextResponse.json(manifest);

  } catch (error) {
    console.error(`[App ${appId} GET Error]`, error);
    // Fallback on error
    const sample = sampleManifests[appId];
    if (sample) {
      return NextResponse.json(sample);
    }
    return NextResponse.json({ error: 'Failed to retrieve application data.' }, { status: 500 });
  }
}
