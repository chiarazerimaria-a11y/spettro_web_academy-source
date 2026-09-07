CREATE TABLE "affiliates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"referral_code" text NOT NULL,
	"referred_count" integer DEFAULT 0 NOT NULL,
	"commission_rate" numeric(5, 2) DEFAULT '15.00' NOT NULL,
	"total_earned" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'activo' NOT NULL,
	"payout_iban" text,
	"payout_paypal" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliates_email_unique" UNIQUE("email"),
	CONSTRAINT "affiliates_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'instructor' NOT NULL,
	"experience" text NOT NULL,
	"links" text,
	"message" text NOT NULL,
	"payout_iban" text,
	"payout_paypal" text,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "battle_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"battle_id" integer NOT NULL,
	"user_id" integer,
	"username" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'spectator' NOT NULL,
	"squad_id" integer,
	"squad_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"level" text DEFAULT 'principiante' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"requirements" text DEFAULT '' NOT NULL,
	"machines_needed" integer DEFAULT 5 NOT NULL,
	"points_needed" integer DEFAULT 100 NOT NULL,
	"badge_color" text DEFAULT '#00ffff' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certifications_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"spc_rewarded" boolean DEFAULT false NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "course_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"video_url" text,
	"video_urls" text,
	"duration" integer DEFAULT 0 NOT NULL,
	"is_free" boolean DEFAULT true NOT NULL,
	"content" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"level" text DEFAULT 'principiante' NOT NULL,
	"price" text DEFAULT '0' NOT NULL,
	"duration_hours" integer DEFAULT 1 NOT NULL,
	"video_url" text,
	"syllabus" text,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"level" text DEFAULT 'principiante' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"instructor" text DEFAULT 'SpettroWeb' NOT NULL,
	"duration_hours" integer DEFAULT 0 NOT NULL,
	"total_lessons" integer DEFAULT 0 NOT NULL,
	"video_url" text,
	"thumbnail_url" text,
	"is_free" boolean DEFAULT false NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"enrolled_count" integer DEFAULT 0 NOT NULL,
	"rating" real DEFAULT 4.5 NOT NULL,
	"spc_reward" integer DEFAULT 100 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctf_battles" (
	"id" serial PRIMARY KEY NOT NULL,
	"mission_id" integer,
	"mission_name" text NOT NULL,
	"squad1_id" integer,
	"squad1_name" text NOT NULL,
	"squad2_id" integer,
	"squad2_name" text NOT NULL,
	"squad1_score" integer DEFAULT 0 NOT NULL,
	"squad2_score" integer DEFAULT 0 NOT NULL,
	"prize_spc" integer DEFAULT 500 NOT NULL,
	"flag_value" text,
	"winner_id" integer,
	"winner_name" text,
	"ai_difficulty" text,
	"status" text DEFAULT 'esperando' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ctf_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" text DEFAULT 'medio' NOT NULL,
	"points" integer DEFAULT 100 NOT NULL,
	"target_ip" text DEFAULT '10.10.0.1' NOT NULL,
	"flag_format" text DEFAULT 'SpettroWeb{...}' NOT NULL,
	"flag_value" text,
	"download_url" text,
	"hints" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flag_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"machine_slug" text NOT NULL,
	"flag_type" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instructor_payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"instructor_name" text NOT NULL,
	"instructor_email" text NOT NULL,
	"iban" text,
	"paypal" text,
	"course_title" text NOT NULL,
	"gross_amount" numeric(10, 2) NOT NULL,
	"commission_rate" numeric(5, 2) DEFAULT '30.00' NOT NULL,
	"net_amount" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"paid_at" timestamp with time zone,
	"reference" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"os" text DEFAULT 'Linux' NOT NULL,
	"difficulty" text DEFAULT 'facil' NOT NULL,
	"character_type" text DEFAULT 'skull' NOT NULL,
	"points" integer DEFAULT 20 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"vulnerability" text DEFAULT '' NOT NULL,
	"techniques" text DEFAULT '' NOT NULL,
	"hints" text,
	"user_flag" text,
	"root_flag" text,
	"ip" text,
	"thumbnail_url" text,
	"download_url" text,
	"writeup_url" text,
	"video_url" text,
	"solve_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lab_machines_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"watched_seconds" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_streams" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"instructor" text NOT NULL,
	"description" text,
	"scheduled_at" timestamp with time zone,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"max_participants" integer DEFAULT 10 NOT NULL,
	"current_participants" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'programado' NOT NULL,
	"room_url" text,
	"type" text DEFAULT 'personalizado' NOT NULL,
	"price_eur" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machine_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"machine_slug" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "machines" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"platform" text DEFAULT 'VulnYX' NOT NULL,
	"difficulty" text DEFAULT 'facil' NOT NULL,
	"status" text DEFAULT 'planificada' NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"ip" text,
	"os" text,
	"techniques" text,
	"writeup_url" text,
	"video_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"buyer_id" integer NOT NULL,
	"buyer_username" text NOT NULL,
	"seller_id" integer NOT NULL,
	"seller_username" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text DEFAULT 'completada' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" integer NOT NULL,
	"seller_username" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'writeup' NOT NULL,
	"price" integer DEFAULT 50 NOT NULL,
	"download_url" text,
	"thumbnail_url" text,
	"preview_text" text,
	"tags" text[],
	"sales_count" integer DEFAULT 0 NOT NULL,
	"rating" real DEFAULT 5,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscriber_id" integer,
	"subscriber_name" text NOT NULL,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"method" text DEFAULT 'transferencia' NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"bank" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"username" text NOT NULL,
	"amount_spc" integer NOT NULL,
	"amount_eur" real NOT NULL,
	"method" text DEFAULT 'paypal' NOT NULL,
	"destination" text NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "room_bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"creator_id" integer NOT NULL,
	"creator_username" text NOT NULL,
	"acceptor_id" integer,
	"acceptor_username" text,
	"amount" integer DEFAULT 0 NOT NULL,
	"prediction" text NOT NULL,
	"status" text DEFAULT 'abierta' NOT NULL,
	"winner_id" integer,
	"is_free" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "spc_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_user_id" integer NOT NULL,
	"to_user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"note" text,
	"room_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spettro_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"type" text DEFAULT 'earned' NOT NULL,
	"description" text NOT NULL,
	"reference_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spettro_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"total_earned" integer DEFAULT 0 NOT NULL,
	"total_spent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spettro_wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "squads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"captain_name" text NOT NULL,
	"description" text,
	"emblem" text DEFAULT 'skull' NOT NULL,
	"member_count" integer DEFAULT 1 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'activa' NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"ai_difficulty" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "squads_name_unique" UNIQUE("name"),
	CONSTRAINT "squads_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"plan" text DEFAULT 'eJPTv2' NOT NULL,
	"notes" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"member_count" integer DEFAULT 1 NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"rank" text DEFAULT 'Rookie' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tournament_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"room_id" integer NOT NULL,
	"user_id" integer,
	"username" text DEFAULT 'Anonymous' NOT NULL,
	"user_color" text DEFAULT 'text-primary' NOT NULL,
	"message" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_name" text DEFAULT 'Infiltration Cup 2026' NOT NULL,
	"round" text DEFAULT 'semifinal' NOT NULL,
	"squad1_id" integer,
	"squad1_name" text DEFAULT 'Ghost Protocol' NOT NULL,
	"squad2_id" integer,
	"squad2_name" text DEFAULT 'Red Storm' NOT NULL,
	"squad1_score" integer DEFAULT 0 NOT NULL,
	"squad2_score" integer DEFAULT 0 NOT NULL,
	"machine_name" text DEFAULT 'Unknown' NOT NULL,
	"machine_ip" text DEFAULT '10.10.0.1' NOT NULL,
	"machine_download_url" text,
	"flag_format" text DEFAULT 'SpettroWeb{...}' NOT NULL,
	"flag_value" text,
	"difficulty" text DEFAULT 'medio' NOT NULL,
	"status" text DEFAULT 'esperando' NOT NULL,
	"max_participants" integer DEFAULT 20 NOT NULL,
	"current_participants" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"winner_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutoring_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tutor_id" integer NOT NULL,
	"tutor_username" text NOT NULL,
	"student_id" integer,
	"student_username" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"topics" text[],
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"price_per_session" integer DEFAULT 500 NOT NULL,
	"status" text DEFAULT 'disponible' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"meet_link" text,
	"rating" real,
	"review_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_vpn_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"username" text NOT NULL,
	"machine_slug" text NOT NULL,
	"machine_name" text NOT NULL,
	"assigned_ip" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"spawned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"stopped_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_type" text DEFAULT 'ghost' NOT NULL,
	"avatar_url" text,
	"bio" text,
	"total_points" integer DEFAULT 0 NOT NULL,
	"machines_solved" integer DEFAULT 0 NOT NULL,
	"rank" text DEFAULT 'Rookie' NOT NULL,
	"subscription_tier" text DEFAULT 'libre' NOT NULL,
	"payment_method_json" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "battle_messages" ADD CONSTRAINT "battle_messages_battle_id_ctf_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."ctf_battles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_lessons" ADD CONSTRAINT "course_lessons_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_submissions" ADD CONSTRAINT "course_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flag_submissions" ADD CONSTRAINT "flag_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_course_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."course_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machine_notes" ADD CONSTRAINT "machine_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_product_id_marketplace_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."marketplace_products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_products" ADD CONSTRAINT "marketplace_products_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_bets" ADD CONSTRAINT "room_bets_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_bets" ADD CONSTRAINT "room_bets_acceptor_id_users_id_fk" FOREIGN KEY ("acceptor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_bets" ADD CONSTRAINT "room_bets_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spc_transfers" ADD CONSTRAINT "spc_transfers_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spc_transfers" ADD CONSTRAINT "spc_transfers_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spettro_transactions" ADD CONSTRAINT "spettro_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spettro_wallets" ADD CONSTRAINT "spettro_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_chat_messages" ADD CONSTRAINT "tournament_chat_messages_room_id_tournament_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."tournament_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_chat_messages" ADD CONSTRAINT "tournament_chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutoring_sessions" ADD CONSTRAINT "tutoring_sessions_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutoring_sessions" ADD CONSTRAINT "tutoring_sessions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_vpn_sessions" ADD CONSTRAINT "user_vpn_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;