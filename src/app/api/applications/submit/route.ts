// src/app/api/applications/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Manifest } from '@/lib/types';
import { revalidateTag } from 'next/cache';
import { getDb } from '@/lib/db';
import { applications } from '@/db/schema';
import { eq } from 'drizzle-orm';

// We don't use the ManifestSchema directly because it has derived/read-only fields
const SubmitBodySchema = z.object({
  appId: z.string(),
  manifest: z.any(), // In a real app, you would validate the manifest with a more specific Zod schema
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appId, manifest } = SubmitBodySchema.parse(body) as { appId: string; manifest: Manifest };

    // Ensure fullName is correctly assembled before saving
    manifest.applicant.fullName = `${manifest.applicant.firstName} ${manifest.applicant.lastName}`.trim();
    if (manifest.guarantor) {
      manifest.guarantor.fullName = `${manifest.guarantor.firstName || ''} ${manifest.guarantor.lastName || ''}`.trim() || undefined;
    }

    const normalizedStatus = manifest.status ?? { completeness: 'incomplete', verification: 'pending' };
    normalizedStatus.completeness = normalizedStatus.completeness ?? 'incomplete';
    normalizedStatus.verification = normalizedStatus.verification ?? 'pending';
    manifest.status = normalizedStatus;

    const db = await getDb();

    // Check if exists using Drizzle
    const existingApp = await db.select().from(applications).where(eq(applications.appId, appId)).get();

    // FIX: .get() might return {} if not found with this proxy setup, which is truthy.
    if (existingApp && existingApp.appId) {
      // Update existing using Drizzle
      await db.update(applications)
        .set({
          fullName: manifest.applicant.fullName,
          verificationStatus: manifest.status.verification,
          completenessStatus: manifest.status.completeness,
          phone: manifest.applicant.mobilePhone || manifest.applicant.homePhone || "",
          rawData: JSON.stringify(manifest),
          updatedAt: new Date().toISOString()
        })
        .where(eq(applications.appId, appId));
    } else {
      // Insert new using Drizzle
      const safeCreatedAt = manifest.createdAt ?? new Date().toISOString();
      const phone = manifest.applicant.mobilePhone || manifest.applicant.homePhone || "";

      await db.insert(applications).values({
        appId: appId,
        fullName: manifest.applicant.fullName,
        nationalId: manifest.applicant.nationalId,
        verificationStatus: manifest.status.verification,
        completenessStatus: manifest.status.completeness,
        createdAt: safeCreatedAt,
        updatedAt: safeCreatedAt,
        phone: phone,
        rawData: JSON.stringify(manifest)
      });
    }

    // --- Step 3: Revalidate caches ---
    revalidateTag('r2-index');
    revalidateTag(`r2-app-${appId}`);

    return NextResponse.json({ ok: true, appId });

  } catch (error) {
    console.error('[Submit Error]', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 });
  }
}
