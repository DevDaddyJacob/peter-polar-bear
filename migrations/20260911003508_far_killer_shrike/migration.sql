CREATE TABLE "static_messages" (
	"static_message_id" bigint GENERATED ALWAYS AS IDENTITY (sequence name "static_messages_static_message_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 50),
	"name" varchar(50) NOT NULL CONSTRAINT "uk_static_messages_name" UNIQUE,
	"guild_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"message_id" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "pk_static_messages" PRIMARY KEY("static_message_id")
);
