CREATE TABLE "offices" (
	"office_id" uuid DEFAULT uuidv7(),
	"owner_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL CONSTRAINT "uk_offices_channel_id" UNIQUE,
	"office_name" varchar(50) NOT NULL CONSTRAINT "uk_offices_office_name" UNIQUE,
	"key_id" varchar(20) NOT NULL CONSTRAINT "uk_offices_key_id" UNIQUE,
	"key_name" varchar(50) NOT NULL CONSTRAINT "uk_offices_key_name" UNIQUE,
	"updated_at" iso_date_time NOT NULL,
	"created_at" iso_date_time NOT NULL,
	CONSTRAINT "pk_offices" PRIMARY KEY("office_id")
);
--> statement-breakpoint
CREATE TABLE "static_messages" (
	"static_message_id" uuid DEFAULT uuidv7(),
	"name" varchar(50) NOT NULL CONSTRAINT "uk_static_messages_name" UNIQUE,
	"guild_id" varchar(20) NOT NULL,
	"channel_id" varchar(20) NOT NULL,
	"message_id" varchar(20) NOT NULL,
	"updated_at" iso_date_time NOT NULL,
	"created_at" iso_date_time NOT NULL,
	CONSTRAINT "pk_static_messages" PRIMARY KEY("static_message_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" varchar(20),
	"updated_at" iso_date_time NOT NULL,
	"created_at" iso_date_time NOT NULL,
	CONSTRAINT "pk_users" PRIMARY KEY("user_id")
);
--> statement-breakpoint
ALTER TABLE "offices" ADD CONSTRAINT "fk_offices_owner_user_id" FOREIGN KEY ("owner_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;