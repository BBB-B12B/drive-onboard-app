import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const applications = sqliteTable('applications', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    appId: text('app_id').notNull().unique(),
    fullName: text('full_name'),
    nationalId: text('national_id'),
    verificationStatus: text('verification_status'),
    completenessStatus: text('completeness_status'),
    createdAt: text('created_at'), // ISO string
    updatedAt: text('updated_at'), // ISO string
    phone: text('phone'),
    rawData: text('raw_data'), // JSON string of the full manifest
});
