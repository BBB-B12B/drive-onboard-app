// src/app/api/applications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { applications } from '@/db/schema';
import { desc } from 'drizzle-orm';
import type { AppRow, VerificationStatus } from '@/lib/types';
import { sampleApplications } from '@/data/sample-data'; // Keep fallback just in case

export async function GET(_req: NextRequest) {
  try {
    const db = await getDb();

    // Select relevant columns for the list view
    const result = await db.select({
      appId: applications.appId,
      fullName: applications.fullName,
      createdAt: applications.createdAt,
      phone: applications.phone,
      status: applications.verificationStatus,
    })
      .from(applications)
      .orderBy(desc(applications.createdAt))
      .all();

    // Map to AppRow type if necessary (though Drizzle result should match mostly)
    // Note: phone and fullName might be null in DB, ensure type safety
    const mapped: AppRow[] = result.map((row: any) => ({
      appId: row.appId,
      fullName: row.fullName || 'Unknown',
      createdAt: row.createdAt || new Date().toISOString(),
      phone: row.phone || undefined,
      status: (row.status || 'pending') as VerificationStatus,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('[Applications GET Error]', error);
    // Fallback to sample data if DB fails (good for dev)
    return NextResponse.json(sampleApplications);
  }
}
