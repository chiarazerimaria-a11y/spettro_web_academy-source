import { pgTable, serial, text, integer, numeric, boolean, timestamp, real } from "drizzle-orm/pg-core";

export const subscribersTable = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"),
  plan: text("plan").notNull().default("eJPTv2"),
  notes: text("notes"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  level: text("level").notNull().default("principiante"),
  category: text("category").notNull().default("general"),
  instructor: text("instructor").notNull().default("SpettroWeb"),
  durationHours: integer("duration_hours").notNull().default(0),
  totalLessons: integer("total_lessons").notNull().default(0),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  isFree: boolean("is_free").notNull().default(false),
  isPremium: boolean("is_premium").notNull().default(false),
  enrolledCount: integer("enrolled_count").notNull().default(0),
  rating: real("rating").notNull().default(4.5),
  spcReward: integer("spc_reward").notNull().default(100),
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  subscriberId: integer("subscriber_id"),
  subscriberName: text("subscriber_name").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  method: text("method").notNull().default("transferencia"),
  status: text("status").notNull().default("pendiente"),
  reference: text("reference").notNull().default(""),
  bank: text("bank"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const machinesTable = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  platform: text("platform").notNull().default("VulnYX"),
  difficulty: text("difficulty").notNull().default("facil"),
  status: text("status").notNull().default("planificada"),
  points: integer("points").notNull().default(0),
  ip: text("ip"),
  os: text("os"),
  techniques: text("techniques"),
  writeupUrl: text("writeup_url"),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const labMachinesTable = pgTable("lab_machines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  os: text("os").notNull().default("Linux"),
  difficulty: text("difficulty").notNull().default("facil"),
  characterType: text("character_type").notNull().default("skull"),
  points: integer("points").notNull().default(20),
  description: text("description").notNull().default(""),
  vulnerability: text("vulnerability").notNull().default(""),
  techniques: text("techniques").notNull().default(""),
  hints: text("hints"),
  userFlag: text("user_flag"),
  rootFlag: text("root_flag"),
  ip: text("ip"),
  thumbnailUrl: text("thumbnail_url"),
  downloadUrl: text("download_url"),
  writeupUrl: text("writeup_url"),
  videoUrl: text("video_url"),
  solveCount: integer("solve_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const teamsTable = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  memberCount: integer("member_count").notNull().default(1),
  totalPoints: integer("total_points").notNull().default(0),
  rank: text("rank").notNull().default("Rookie"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const certificationsTable = pgTable("certifications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  level: text("level").notNull().default("principiante"),
  description: text("description").notNull().default(""),
  requirements: text("requirements").notNull().default(""),
  machinesNeeded: integer("machines_needed").notNull().default(5),
  pointsNeeded: integer("points_needed").notNull().default(100),
  badgeColor: text("badge_color").notNull().default("#00ffff"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  avatarType: text("avatar_type").notNull().default("ghost"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  totalPoints: integer("total_points").notNull().default(0),
  machinesSolved: integer("machines_solved").notNull().default(0),
  rank: text("rank").notNull().default("Rookie"),
  subscriptionTier: text("subscription_tier").notNull().default("libre"),
  paymentMethodJson: text("payment_method_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("instructor"),
  experience: text("experience").notNull(),
  links: text("links"),
  message: text("message").notNull(),
  payoutIban: text("payout_iban"),
  payoutPaypal: text("payout_paypal"),
  status: text("status").notNull().default("pendiente"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const affiliatesTable = pgTable("affiliates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  referralCode: text("referral_code").notNull().unique(),
  referredCount: integer("referred_count").notNull().default(0),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("15.00"),
  totalEarned: numeric("total_earned", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("activo"),
  payoutIban: text("payout_iban"),
  payoutPaypal: text("payout_paypal"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const courseSubmissionsTable = pgTable("course_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  level: text("level").notNull().default("principiante"),
  price: text("price").notNull().default("0"),
  durationHours: integer("duration_hours").notNull().default(1),
  videoUrl: text("video_url"),
  syllabus: text("syllabus"),
  status: text("status").notNull().default("pendiente"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Instructor Payouts ────────────────────────────────────────────────────────
export const instructorPayoutsTable = pgTable("instructor_payouts", {
  id: serial("id").primaryKey(),
  instructorName: text("instructor_name").notNull(),
  instructorEmail: text("instructor_email").notNull(),
  iban: text("iban"),
  paypal: text("paypal"),
  courseTitle: text("course_title").notNull(),
  grossAmount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("30.00"),
  netAmount: numeric("net_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pendiente"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  reference: text("reference"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Live Streams ─────────────────────────────────────────────────────────────
export const liveStreamsTable = pgTable("live_streams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  instructor: text("instructor").notNull(),
  description: text("description"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  maxParticipants: integer("max_participants").notNull().default(10),
  currentParticipants: integer("current_participants").notNull().default(0),
  status: text("status").notNull().default("programado"),
  roomUrl: text("room_url"),
  type: text("type").notNull().default("personalizado"),
  priceEur: numeric("price_eur", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Attack Squads ────────────────────────────────────────────────────────────
export const squadsTable = pgTable("squads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  captainName: text("captain_name").notNull(),
  description: text("description"),
  emblem: text("emblem").notNull().default("skull"),
  memberCount: integer("member_count").notNull().default(1),
  totalPoints: integer("total_points").notNull().default(0),
  level: integer("level").notNull().default(1),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  status: text("status").notNull().default("activa"),
  isBot: boolean("is_bot").notNull().default(false),
  aiDifficulty: text("ai_difficulty"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── CTF Missions ─────────────────────────────────────────────────────────────
export const ctfMissionsTable = pgTable("ctf_missions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull().default("medio"),
  points: integer("points").notNull().default(100),
  targetIp: text("target_ip").notNull().default("10.10.0.1"),
  flagFormat: text("flag_format").notNull().default("SpettroWeb{...}"),
  flagValue: text("flag_value"),
  downloadUrl: text("download_url"),
  hints: text("hints"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── SpettroCoin Wallets ──────────────────────────────────────────────────────
export const spettroWalletsTable = pgTable("spettro_wallets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id),
  balance: integer("balance").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── SpettroCoin Transactions ─────────────────────────────────────────────────
export const spettroTransactionsTable = pgTable("spettro_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  amount: integer("amount").notNull(),
  type: text("type").notNull().default("earned"),
  description: text("description").notNull(),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Course Enrollments ───────────────────────────────────────────────────────
export const courseEnrollmentsTable = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id),
  progress: integer("progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  spcRewarded: boolean("spc_rewarded").notNull().default(false),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ─── Tournament Rooms ─────────────────────────────────────────────────────────
export const tournamentRoomsTable = pgTable("tournament_rooms", {
  id: serial("id").primaryKey(),
  tournamentName: text("tournament_name").notNull().default("Infiltration Cup 2026"),
  round: text("round").notNull().default("semifinal"),
  squad1Id: integer("squad1_id"),
  squad1Name: text("squad1_name").notNull().default("Ghost Protocol"),
  squad2Id: integer("squad2_id"),
  squad2Name: text("squad2_name").notNull().default("Red Storm"),
  squad1Score: integer("squad1_score").notNull().default(0),
  squad2Score: integer("squad2_score").notNull().default(0),
  machineName: text("machine_name").notNull().default("Unknown"),
  machineIp: text("machine_ip").notNull().default("10.10.0.1"),
  machineDownloadUrl: text("machine_download_url"),
  flagFormat: text("flag_format").notNull().default("SpettroWeb{...}"),
  flagValue: text("flag_value"),
  difficulty: text("difficulty").notNull().default("medio"),
  status: text("status").notNull().default("esperando"),
  maxParticipants: integer("max_participants").notNull().default(20),
  currentParticipants: integer("current_participants").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  winnerName: text("winner_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tournamentChatMessagesTable = pgTable("tournament_chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull().references(() => tournamentRoomsTable.id),
  userId: integer("user_id").references(() => usersTable.id),
  username: text("username").notNull().default("Anonymous"),
  userColor: text("user_color").notNull().default("text-primary"),
  message: text("message").notNull(),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── SPC Transfers (P2P) ─────────────────────────────────────────────────────
export const spcTransfersTable = pgTable("spc_transfers", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => usersTable.id),
  toUserId: integer("to_user_id").notNull().references(() => usersTable.id),
  amount: integer("amount").notNull(),
  note: text("note"),
  roomId: integer("room_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Room Bets ────────────────────────────────────────────────────────────────
export const roomBetsTable = pgTable("room_bets", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  creatorId: integer("creator_id").notNull().references(() => usersTable.id),
  creatorUsername: text("creator_username").notNull(),
  acceptorId: integer("acceptor_id").references(() => usersTable.id),
  acceptorUsername: text("acceptor_username"),
  amount: integer("amount").notNull().default(0),
  prediction: text("prediction").notNull(),
  status: text("status").notNull().default("abierta"),
  winnerId: integer("winner_id").references(() => usersTable.id),
  isFree: boolean("is_free").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

// ─── Marketplace ─────────────────────────────────────────────────────────────
export const marketplaceProductsTable = pgTable("marketplace_products", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => usersTable.id),
  sellerUsername: text("seller_username").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default("writeup"), // writeup|script|tool|notes|course|mentoring
  price: integer("price").notNull().default(50), // in SPC
  downloadUrl: text("download_url"),
  thumbnailUrl: text("thumbnail_url"),
  previewText: text("preview_text"),
  tags: text("tags").array(),
  salesCount: integer("sales_count").notNull().default(0),
  rating: real("rating").default(5.0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const marketplaceOrdersTable = pgTable("marketplace_orders", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => marketplaceProductsTable.id),
  buyerId: integer("buyer_id").notNull().references(() => usersTable.id),
  buyerUsername: text("buyer_username").notNull(),
  sellerId: integer("seller_id").notNull().references(() => usersTable.id),
  sellerUsername: text("seller_username").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("completada"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Tutoring Sessions ────────────────────────────────────────────────────────
export const tutoringSessionsTable = pgTable("tutoring_sessions", {
  id: serial("id").primaryKey(),
  tutorId: integer("tutor_id").notNull().references(() => usersTable.id),
  tutorUsername: text("tutor_username").notNull(),
  studentId: integer("student_id").references(() => usersTable.id),
  studentUsername: text("student_username"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  topics: text("topics").array(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  pricePerSession: integer("price_per_session").notNull().default(500), // SPC
  status: text("status").notNull().default("disponible"), // disponible|reservada|completada|cancelada
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  meetLink: text("meet_link"),
  rating: real("rating"),
  reviewText: text("review_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Payout Requests ──────────────────────────────────────────────────────────
export const payoutRequestsTable = pgTable("payout_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  username: text("username").notNull(),
  amountSpc: integer("amount_spc").notNull(),
  amountEur: real("amount_eur").notNull(),
  method: text("method").notNull().default("paypal"), // paypal|bank|bizum
  destination: text("destination").notNull(), // email/IBAN/phone
  status: text("status").notNull().default("pendiente"), // pendiente|aprobado|rechazado|pagado
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

// ─── CTF Battles ─────────────────────────────────────────────────────────────
export const ctfBattlesTable = pgTable("ctf_battles", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id"),
  missionName: text("mission_name").notNull(),
  squad1Id: integer("squad1_id"),
  squad1Name: text("squad1_name").notNull(),
  squad2Id: integer("squad2_id"),
  squad2Name: text("squad2_name").notNull(),
  squad1Score: integer("squad1_score").notNull().default(0),
  squad2Score: integer("squad2_score").notNull().default(0),
  prizeSpc: integer("prize_spc").notNull().default(500),
  flagValue: text("flag_value"),
  winnerId: integer("winner_id"),
  winnerName: text("winner_name"),
  aiDifficulty: text("ai_difficulty"),
  status: text("status").notNull().default("esperando"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── VPN Sessions ─────────────────────────────────────────────────────────────
export const userVpnSessionsTable = pgTable("user_vpn_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  username: text("username").notNull(),
  machineSlug: text("machine_slug").notNull(),
  machineName: text("machine_name").notNull(),
  assignedIp: text("assigned_ip").notNull(),
  status: text("status").notNull().default("active"), // active|stopped
  spawnedAt: timestamp("spawned_at", { withTimezone: true }).notNull().defaultNow(),
  stoppedAt: timestamp("stopped_at", { withTimezone: true }),
});

// ─── Course Lessons ───────────────────────────────────────────────────────────
export const courseLessonsTable = pgTable("course_lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => coursesTable.id),
  order: integer("order").notNull().default(0),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  videoUrl: text("video_url"),           // legacy single URL (kept for compat)
  videoUrls: text("video_urls"),         // JSON: {"es":"...", "en":"...", "it":"..."}
  duration: integer("duration").notNull().default(0), // seconds
  isFree: boolean("is_free").notNull().default(true),  // preview lessons
  content: text("content"),              // markdown notes
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Lesson Progress ──────────────────────────────────────────────────────────
export const lessonProgressTable = pgTable("lesson_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  lessonId: integer("lesson_id").notNull().references(() => courseLessonsTable.id),
  courseId: integer("course_id").notNull().references(() => coursesTable.id),
  completed: boolean("completed").notNull().default(false),
  watchedSeconds: integer("watched_seconds").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Flag Submissions ─────────────────────────────────────────────────────────
export const flagSubmissionsTable = pgTable("flag_submissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  machineSlug: text("machine_slug").notNull(),
  flagType: text("flag_type").notNull(), // 'user' | 'root'
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  isCorrect: boolean("is_correct").notNull().default(false),
});

// ─── Machine Notes ────────────────────────────────────────────────────────────
export const machineNotesTable = pgTable("machine_notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  machineSlug: text("machine_slug").notNull(),
  content: text("content").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Battle Messages ──────────────────────────────────────────────────────────
export const battleMessagesTable = pgTable("battle_messages", {
  id: serial("id").primaryKey(),
  battleId: integer("battle_id").notNull().references(() => ctfBattlesTable.id),
  userId: integer("user_id"),
  username: text("username").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("spectator"), // squad|spectator
  squadId: integer("squad_id"),
  squadName: text("squad_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
