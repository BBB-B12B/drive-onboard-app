CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`app_id` text NOT NULL,
	`full_name` text,
	`national_id` text,
	`verification_status` text,
	`completeness_status` text,
	`created_at` text,
	`updated_at` text,
	`phone` text,
	`raw_data` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_app_id_unique` ON `applications` (`app_id`);