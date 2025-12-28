import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

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

export const users = sqliteTable('users', {
    id: text('id').primaryKey(), // UUID or Integer as string
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: text('role').notNull(), // admin | employee
    phone: text('phone'),
    password_hash: text('password_hash'),
    avatar_url: text('avatar_url'),
});

export const dailyReportSummary = sqliteTable('daily_report_summary', {
    email: text('email').notNull(),
    date: text('date').notNull(),
    fullName: text('full_name'),
    appId: text('app_id'),
    uploadedCount: integer('uploaded_count').notNull(),
    totalSlots: integer('total_slots').notNull(),
    lastUpdated: text('last_updated'),
    status: text('status').notNull(),
    notes: text('notes'),
}, (table) => {
    return {
        pk: primaryKey({ columns: [table.email, table.date] })
    };
});
