// src/app/api/download-form/route.tsx
export const runtime = 'nodejs'; // Use Node.js runtime

import { NextRequest, NextResponse } from 'next/server';
import type { Manifest } from '@/lib/types';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '@/app/api/r2/_client';
import { requireR2Bucket } from '@/lib/r2/env';

// Import aot templates 
import {
  ApplicationFormTemplate,
  TransportContractTemplate,
  GuaranteeContractTemplate
} from './templates';

const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz-K0rRj8ibF1aasEOo2jBPWDq765Nm5doz9LePYfzz3ZoPoqUTEXEEKJxLqVKhRHOu/exec";

// Helper: Fetch image from R2 and convert to Base64
async function fetchImageBase64(r2Key: string): Promise<string | null> {
  try {
    const bucket = requireR2Bucket();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: r2Key,
    });
    const r2 = await getR2Client();
    const response = await r2.send(command);
    if (!response.Body) return null;

    // Convert stream to buffer
    // @ts-ignore - transformToByteArray exists in newer SDKs but sometimes TS complains
    const byteArray = await response.Body.transformToByteArray();
    const buffer = Buffer.from(byteArray);
    const base64 = buffer.toString('base64');
    const mimeType = response.ContentType || 'image/png';

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Failed to fetch image for key ${r2Key}:`, error);
    return null;
  }
}

async function getHtmlTemplate(filename: string, data: Manifest, signatures?: { applicant?: string | null, guarantor?: string | null }): Promise<string> {
  let template;

  // Inject signatures into data 
  const dataWithSignatures = {
    ...data,
    signatures: signatures
  };

  if (filename.includes('application-form') || filename.includes('ใบสมัครงาน')) {
    template = <ApplicationFormTemplate data={dataWithSignatures} />;
  } else if (filename.includes('transport-contract') || filename.includes('สัญญาจ้าง')) {
    template = <TransportContractTemplate data={dataWithSignatures} />;
  } else if (filename.includes('guarantee-contract') || filename.includes('สัญญาค้ำประกัน')) {
    if (!data.guarantor?.firstName && !data.guarantor?.lastName) {
      throw new Error('ไม่พบข้อมูลผู้ค้ำประกัน (Guarantor data is missing)');
    }
    template = <GuaranteeContractTemplate data={dataWithSignatures} />;
  } else {
    throw new Error('Invalid filename for template selection');
  }

  const { renderToStaticMarkup } = await import('react-dom/server');
  return renderToStaticMarkup(template);
}

export async function POST(req: NextRequest) {
  try {
    const { filename, data } = (await req.json()) as { filename: string; data: Manifest };

    if (!filename || !data) {
      return NextResponse.json({ error: 'Filename and data are required' }, { status: 400 });
    }

    // Fetch signatures if they exist in R2
    let applicantSigBase64: string | null = null;
    let guarantorSigBase64: string | null = null;

    if (data.docs?.signature?.r2Key) {
      applicantSigBase64 = await fetchImageBase64(data.docs.signature.r2Key);
    }

    if (data.docs?.guarantorSignature?.r2Key) {
      guarantorSigBase64 = await fetchImageBase64(data.docs.guarantorSignature.r2Key);
    }

    // 1. สร้าง HTML string จาก React template พร้อมลายเซ็น
    const htmlContent = await getHtmlTemplate(filename, data, {
      applicant: applicantSigBase64,
      guarantor: guarantorSigBase64
    });

    // 2. ส่ง HTML ไปให้ Google Apps Script เพื่อแปลง
    const gasResponse = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html: htmlContent,
        filename: filename
      }),
      // เพิ่ม timeout (เช่น 30 วินาที)
      signal: AbortSignal.timeout(30000),
    });

    if (!gasResponse.ok) {
      const errorText = await gasResponse.text();
      throw new Error(`Google Apps Script failed: ${gasResponse.status} ${errorText}`);
    }

    const result = await gasResponse.json();
    if (result.error) {
      throw new Error(`Google Apps Script Error: ${result.error}`);
    }

    // 3. ถอดรหัส Base64 PDF ที่ได้กลับมา
    // note: GAS might return 'base64' (clean) or 'base64Pdf' (legacy) depending on implementation version. 
    // Checking previous 'HEAD' it used 'base64Pdf'. Checking 'Incoming' it used 'base64'. 
    // Let's safe check both or trust Incoming code structure. Incoming uses 'result.base64'.
    const pdfBytes = Buffer.from(result.base64 || result.base64Pdf, 'base64');

    // 4. ส่งไฟล์ PDF กลับไปให้ผู้ใช้
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`);

    return new NextResponse(pdfBytes, { status: 200, headers });

  } catch (error) {
    console.error('[Download Form Error]', error);
    const message = error instanceof Error ? error.message : 'An internal server error occurred.';
    return NextResponse.json({ error: `PDF Generation Failed: ${message}` }, { status: 500 });
  }
}

