/**
 * Integration Tests for R2 Storage Operations
 * 
 * These tests require proper R2 credentials in .env file:
 * - R2_ENDPOINT
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET or R2_BUCKET_NAME
 * 
 * Run with: npm test -- --run src/lib/__tests__/r2-integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Test data
const TEST_APP_ID = `test-integration-${Date.now()}`;
const TEST_MANIFEST = {
    appId: TEST_APP_ID,
    createdAt: new Date().toISOString(),
    applicant: {
        prefix: 'นาย',
        firstName: 'ทดสอบ',
        lastName: 'ระบบ',
        fullName: 'ทดสอบ ระบบ',
        nationalId: '1234567890123',
        nationalIdIssueDate: '2020-01-01',
        nationalIdExpiryDate: '2030-01-01',
        dateOfBirth: '1990-01-01',
        height: 175,
        weight: 70,
        gender: 'male',
        maritalStatus: 'single',
        currentAddress: {
            subDistrict: 'บางนา',
            district: 'บางนา',
            province: 'กรุงเทพมหานคร',
            postalCode: '10260',
        },
        isPermanentAddressSame: true,
        mobilePhone: '0812345678',
        residenceType: 'own',
        militaryStatus: 'exempt',
    },
    applicationDetails: {
        criminalRecord: 'no',
        applicationDate: '2024-01-01',
    },
    vehicle: {
        type: 'four-wheel',
        brand: 'Toyota',
        model: 'Hilux Revo',
        plateNo: 'กข 1234',
        color: 'ขาว',
    },
    status: {
        completeness: 'incomplete',
        verification: 'pending',
    },
};

describe('R2 Storage Integration Tests', () => {
    let r2Client: S3Client;
    let bucket: string;
    let manifestKey: string;

    // Check if R2 credentials are available
    const hasR2Credentials = !!(
        process.env.R2_ENDPOINT &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        (process.env.R2_BUCKET || process.env.R2_BUCKET_NAME)
    );

    beforeAll(() => {
        if (!hasR2Credentials) {
            console.warn('⚠️  R2 credentials not found. Integration tests will be skipped.');
            return;
        }

        r2Client = new S3Client({
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID!,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
        });

        bucket = process.env.R2_BUCKET || process.env.R2_BUCKET_NAME!;
        manifestKey = `applications/${TEST_APP_ID}/manifest.json`;
    });

    afterAll(async () => {
        // Cleanup: Delete test data after tests
        if (!hasR2Credentials || !r2Client) return;

        try {
            await r2Client.send(new DeleteObjectCommand({
                Bucket: bucket,
                Key: manifestKey,
            }));
            console.log(`✅ Cleaned up test data: ${manifestKey}`);
        } catch (error) {
            // Ignore if already deleted
        }
    });

    it('should have R2 credentials configured', () => {
        if (!hasR2Credentials) {
            console.warn('Skipping: R2 credentials not available');
            return;
        }
        expect(process.env.R2_ENDPOINT).toBeDefined();
        expect(process.env.R2_ACCESS_KEY_ID).toBeDefined();
        expect(process.env.R2_SECRET_ACCESS_KEY).toBeDefined();
        expect(bucket).toBeDefined();
    });

    it('should submit manifest to R2 and retrieve it back', async () => {
        if (!hasR2Credentials) {
            console.warn('Skipping: R2 credentials not available');
            return;
        }

        // Step 1: Submit (PUT) manifest to R2
        const putCommand = new PutObjectCommand({
            Bucket: bucket,
            Key: manifestKey,
            Body: JSON.stringify(TEST_MANIFEST),
            ContentType: 'application/json',
        });

        await r2Client.send(putCommand);
        console.log(`✅ Submitted manifest to: ${manifestKey}`);

        // Step 2: Fetch (GET) manifest from R2
        const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: manifestKey,
        });

        const response = await r2Client.send(getCommand);
        const bodyString = await response.Body?.transformToString();
        expect(bodyString).toBeDefined();

        const retrievedManifest = JSON.parse(bodyString!);
        console.log(`✅ Retrieved manifest from: ${manifestKey}`);

        // Step 3: Verify data integrity
        expect(retrievedManifest.appId).toBe(TEST_MANIFEST.appId);
        expect(retrievedManifest.applicant.firstName).toBe(TEST_MANIFEST.applicant.firstName);
        expect(retrievedManifest.applicant.lastName).toBe(TEST_MANIFEST.applicant.lastName);
        expect(retrievedManifest.applicant.fullName).toBe(TEST_MANIFEST.applicant.fullName);
        expect(retrievedManifest.applicant.nationalId).toBe(TEST_MANIFEST.applicant.nationalId);
        expect(retrievedManifest.applicant.mobilePhone).toBe(TEST_MANIFEST.applicant.mobilePhone);
        expect(retrievedManifest.vehicle.brand).toBe(TEST_MANIFEST.vehicle.brand);
        expect(retrievedManifest.vehicle.model).toBe(TEST_MANIFEST.vehicle.model);
        expect(retrievedManifest.status.verification).toBe(TEST_MANIFEST.status.verification);
    });

    it('should preserve all applicant fields when roundtripped', async () => {
        if (!hasR2Credentials) {
            console.warn('Skipping: R2 credentials not available');
            return;
        }

        // Fetch the previously stored manifest
        const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: manifestKey,
        });

        const response = await r2Client.send(getCommand);
        const bodyString = await response.Body?.transformToString();
        const retrievedManifest = JSON.parse(bodyString!);

        // Verify ALL applicant fields are preserved
        const originalApplicant = TEST_MANIFEST.applicant;
        const retrievedApplicant = retrievedManifest.applicant;

        expect(retrievedApplicant.prefix).toBe(originalApplicant.prefix);
        expect(retrievedApplicant.firstName).toBe(originalApplicant.firstName);
        expect(retrievedApplicant.lastName).toBe(originalApplicant.lastName);
        expect(retrievedApplicant.fullName).toBe(originalApplicant.fullName);
        expect(retrievedApplicant.nationalId).toBe(originalApplicant.nationalId);
        expect(retrievedApplicant.dateOfBirth).toBe(originalApplicant.dateOfBirth);
        expect(retrievedApplicant.height).toBe(originalApplicant.height);
        expect(retrievedApplicant.weight).toBe(originalApplicant.weight);
        expect(retrievedApplicant.gender).toBe(originalApplicant.gender);
        expect(retrievedApplicant.maritalStatus).toBe(originalApplicant.maritalStatus);
        expect(retrievedApplicant.mobilePhone).toBe(originalApplicant.mobilePhone);
        expect(retrievedApplicant.residenceType).toBe(originalApplicant.residenceType);
        expect(retrievedApplicant.militaryStatus).toBe(originalApplicant.militaryStatus);
        expect(retrievedApplicant.isPermanentAddressSame).toBe(originalApplicant.isPermanentAddressSame);

        // Verify address
        expect(retrievedApplicant.currentAddress.subDistrict).toBe(originalApplicant.currentAddress.subDistrict);
        expect(retrievedApplicant.currentAddress.district).toBe(originalApplicant.currentAddress.district);
        expect(retrievedApplicant.currentAddress.province).toBe(originalApplicant.currentAddress.province);
        expect(retrievedApplicant.currentAddress.postalCode).toBe(originalApplicant.currentAddress.postalCode);
    });

    it('should preserve vehicle and status fields when roundtripped', async () => {
        if (!hasR2Credentials) {
            console.warn('Skipping: R2 credentials not available');
            return;
        }

        const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: manifestKey,
        });

        const response = await r2Client.send(getCommand);
        const bodyString = await response.Body?.transformToString();
        const retrievedManifest = JSON.parse(bodyString!);

        // Verify vehicle fields
        expect(retrievedManifest.vehicle.type).toBe(TEST_MANIFEST.vehicle.type);
        expect(retrievedManifest.vehicle.brand).toBe(TEST_MANIFEST.vehicle.brand);
        expect(retrievedManifest.vehicle.model).toBe(TEST_MANIFEST.vehicle.model);
        expect(retrievedManifest.vehicle.plateNo).toBe(TEST_MANIFEST.vehicle.plateNo);
        expect(retrievedManifest.vehicle.color).toBe(TEST_MANIFEST.vehicle.color);

        // Verify status fields
        expect(retrievedManifest.status.completeness).toBe(TEST_MANIFEST.status.completeness);
        expect(retrievedManifest.status.verification).toBe(TEST_MANIFEST.status.verification);

        // Verify application details
        expect(retrievedManifest.applicationDetails.criminalRecord).toBe(TEST_MANIFEST.applicationDetails.criminalRecord);
        expect(retrievedManifest.applicationDetails.applicationDate).toBe(TEST_MANIFEST.applicationDetails.applicationDate);
    });

    it('should update manifest and verify changes', async () => {
        if (!hasR2Credentials) {
            console.warn('Skipping: R2 credentials not available');
            return;
        }

        // Update the manifest
        const updatedManifest = {
            ...TEST_MANIFEST,
            status: {
                completeness: 'complete',
                verification: 'approved',
            },
        };

        // PUT updated manifest
        await r2Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: manifestKey,
            Body: JSON.stringify(updatedManifest),
            ContentType: 'application/json',
        }));

        // GET and verify
        const response = await r2Client.send(new GetObjectCommand({
            Bucket: bucket,
            Key: manifestKey,
        }));

        const bodyString = await response.Body?.transformToString();
        const retrievedManifest = JSON.parse(bodyString!);

        // Verify status was updated
        expect(retrievedManifest.status.completeness).toBe('complete');
        expect(retrievedManifest.status.verification).toBe('approved');

        // But other fields remain unchanged
        expect(retrievedManifest.applicant.firstName).toBe(TEST_MANIFEST.applicant.firstName);
        expect(retrievedManifest.vehicle.brand).toBe(TEST_MANIFEST.vehicle.brand);
    });
});
