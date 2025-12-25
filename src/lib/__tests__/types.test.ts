import { describe, it, expect } from 'vitest';
import { ManifestSchema, FileRefSchema } from '../types';

describe('FileRefSchema', () => {
    it('should validate a valid FileRef', () => {
        const validFileRef = {
            r2Key: 'applications/123/doc.pdf',
            mime: 'application/pdf',
            size: 1024,
            md5: 'abc123',
        };
        expect(() => FileRefSchema.parse(validFileRef)).not.toThrow();
    });

    it('should allow optional md5', () => {
        const fileRefWithoutMd5 = {
            r2Key: 'applications/123/doc.pdf',
            mime: 'application/pdf',
            size: 1024,
        };
        expect(() => FileRefSchema.parse(fileRefWithoutMd5)).not.toThrow();
    });

    it('should reject missing required fields', () => {
        const invalidFileRef = {
            r2Key: 'applications/123/doc.pdf',
        };
        expect(() => FileRefSchema.parse(invalidFileRef)).toThrow();
    });
});

describe('ManifestSchema - Applicant Validation', () => {
    const validApplicant = {
        prefix: 'นาย',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        nationalId: '1234567890123',
        nationalIdIssueDate: new Date('2020-01-01'),
        nationalIdExpiryDate: new Date('2030-01-01'),
        dateOfBirth: new Date('1990-01-01'),
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
    };

    const validApplicationDetails = {
        criminalRecord: 'no',
        applicationDate: new Date('2024-01-01'),
    };

    const validVehicle = {
        type: 'four-wheel',
        brand: 'Toyota',
        model: 'Hilux Revo',
    };

    it('should validate a complete valid manifest', () => {
        const validManifest = {
            applicant: validApplicant,
            applicationDetails: validApplicationDetails,
            vehicle: validVehicle,
        };
        expect(() => ManifestSchema.parse(validManifest)).not.toThrow();
    });

    it('should reject invalid national ID (not 13 digits)', () => {
        const invalidApplicant = {
            ...validApplicant,
            nationalId: '123456', // Only 6 digits
        };
        const manifest = {
            applicant: invalidApplicant,
            applicationDetails: validApplicationDetails,
            vehicle: validVehicle,
        };
        const result = ManifestSchema.safeParse(manifest);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some(i => i.path.includes('nationalId'))).toBe(true);
        }
    });

    it('should reject non-numeric national ID', () => {
        const invalidApplicant = {
            ...validApplicant,
            nationalId: '12345678901ab',
        };
        const manifest = {
            applicant: invalidApplicant,
            applicationDetails: validApplicationDetails,
            vehicle: validVehicle,
        };
        const result = ManifestSchema.safeParse(manifest);
        expect(result.success).toBe(false);
    });

    it('should reject invalid phone number (not starting with 0)', () => {
        const invalidApplicant = {
            ...validApplicant,
            mobilePhone: '1234567890', // Doesn't start with 0
        };
        const manifest = {
            applicant: invalidApplicant,
            applicationDetails: validApplicationDetails,
            vehicle: validVehicle,
        };
        const result = ManifestSchema.safeParse(manifest);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some(i => i.path.includes('mobilePhone'))).toBe(true);
        }
    });

    it('should reject phone number with wrong length', () => {
        const invalidApplicant = {
            ...validApplicant,
            mobilePhone: '0123', // Too short
        };
        const manifest = {
            applicant: invalidApplicant,
            applicationDetails: validApplicationDetails,
            vehicle: validVehicle,
        };
        const result = ManifestSchema.safeParse(manifest);
        expect(result.success).toBe(false);
    });

    it('should reject invalid postal code (not 5 digits)', () => {
        const invalidApplicant = {
            ...validApplicant,
            currentAddress: {
                ...validApplicant.currentAddress,
                postalCode: '1026', // Only 4 digits
            },
        };
        const manifest = {
            applicant: invalidApplicant,
            applicationDetails: validApplicationDetails,
            vehicle: validVehicle,
        };
        const result = ManifestSchema.safeParse(manifest);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some(i => i.path.includes('postalCode'))).toBe(true);
        }
    });

    it('should require permanent address when isPermanentAddressSame is false', () => {
        const invalidApplicant = {
            ...validApplicant,
            isPermanentAddressSame: false,
            permanentAddress: undefined,
        };
        const manifest = {
            applicant: invalidApplicant,
            applicationDetails: validApplicationDetails,
            vehicle: validVehicle,
        };
        const result = ManifestSchema.safeParse(manifest);
        expect(result.success).toBe(false);
    });

    it('should accept when isPermanentAddressSame is false with valid permanent address', () => {
        const validApplicantWithPermanentAddr = {
            ...validApplicant,
            isPermanentAddressSame: false,
            permanentAddress: {
                subDistrict: 'สามเสนใน',
                district: 'ดินแดง',
                province: 'กรุงเทพมหานคร',
                postalCode: '10400',
            },
        };
        const manifest = {
            applicant: validApplicantWithPermanentAddr,
            applicationDetails: validApplicationDetails,
            vehicle: validVehicle,
        };
        expect(() => ManifestSchema.parse(manifest)).not.toThrow();
    });
});

describe('ManifestSchema - Application Details Validation', () => {
    const validApplicant = {
        prefix: 'นาย',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        nationalId: '1234567890123',
        nationalIdIssueDate: new Date('2020-01-01'),
        nationalIdExpiryDate: new Date('2030-01-01'),
        dateOfBirth: new Date('1990-01-01'),
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
    };

    const validVehicle = {
        type: 'four-wheel',
        brand: 'Toyota',
        model: 'Hilux Revo',
    };

    it('should require criminal record details when criminalRecord is yes', () => {
        const invalidDetails = {
            criminalRecord: 'yes',
            criminalRecordDetails: undefined,
            applicationDate: new Date('2024-01-01'),
        };
        const manifest = {
            applicant: validApplicant,
            applicationDetails: invalidDetails,
            vehicle: validVehicle,
        };
        const result = ManifestSchema.safeParse(manifest);
        expect(result.success).toBe(false);
    });

    it('should accept criminal record details when criminalRecord is yes', () => {
        const validDetails = {
            criminalRecord: 'yes',
            criminalRecordDetails: 'รายละเอียดประวัติอาชญากรรม',
            applicationDate: new Date('2024-01-01'),
        };
        const manifest = {
            applicant: validApplicant,
            applicationDetails: validDetails,
            vehicle: validVehicle,
        };
        expect(() => ManifestSchema.parse(manifest)).not.toThrow();
    });
});

describe('ManifestSchema - Vehicle Validation', () => {
    const validApplicant = {
        prefix: 'นาย',
        firstName: 'สมชาย',
        lastName: 'ใจดี',
        nationalId: '1234567890123',
        nationalIdIssueDate: new Date('2020-01-01'),
        nationalIdExpiryDate: new Date('2030-01-01'),
        dateOfBirth: new Date('1990-01-01'),
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
    };

    const validApplicationDetails = {
        criminalRecord: 'no',
        applicationDate: new Date('2024-01-01'),
    };

    it('should require vehicle type', () => {
        const invalidVehicle = {
            brand: 'Toyota',
            model: 'Hilux Revo',
        };
        const manifest = {
            applicant: validApplicant,
            applicationDetails: validApplicationDetails,
            vehicle: invalidVehicle,
        };
        const result = ManifestSchema.safeParse(manifest);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some(i => i.path.includes('type'))).toBe(true);
        }
    });

    it('should accept other brand with brandOther and modelOther', () => {
        const vehicleWithOther = {
            type: 'four-wheel',
            brand: 'other',
            brandOther: 'Custom Brand',
            modelOther: 'Custom Model',
        };
        const manifest = {
            applicant: validApplicant,
            applicationDetails: validApplicationDetails,
            vehicle: vehicleWithOther,
        };
        expect(() => ManifestSchema.parse(manifest)).not.toThrow();
    });

    it('should require model when brand is not other', () => {
        const vehicleWithoutModel = {
            type: 'four-wheel',
            brand: 'Toyota',
            // Missing model
        };
        const manifest = {
            applicant: validApplicant,
            applicationDetails: validApplicationDetails,
            vehicle: vehicleWithoutModel,
        };
        const result = ManifestSchema.safeParse(manifest);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some(i => i.path.includes('model'))).toBe(true);
        }
    });
});
