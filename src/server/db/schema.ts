import {
  int,
  sqliteTable,
  text,
  uniqueIndex,
  index,
  primaryKey,
  real,
} from "drizzle-orm/sqlite-core";
import { sql, relations, type SQL } from "drizzle-orm";
import { ulid } from "ulid";
import type { AdapterAccount } from "next-auth/adapters";

const createPrefixedUlid = (prefix: string) => {
  return `${prefix}_${ulid()}`;
};

// Users table
export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createPrefixedUlid("user")),
    name: text("name").notNull(),
    age: int("age"),
    email: text("email").notNull(),
  },
  (users) => ({
    // Index for fast querying users by email
    emailIndex: uniqueIndex("users_email_idx").on(users.email),
    nameIndex: index("user_name_index").on(users.name),
  }),
);

// Posts table
export const posts = sqliteTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createPrefixedUlid("post")),
    title: text("title").notNull(),
    content: text("content").notNull(),
    views: int("views").notNull().default(0),
    estimatedReadingLength: real("length").generatedAlwaysAs(
      (): SQL => sql`(LENGTH(${posts.content}) * 1.0) / 863`,
      { mode: "stored" },
    ),
    // Automatically set and updating createdAd and updatedAt columns to unix epoch time in seconds
    createdAt: int("created_at", { mode: "number" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: int("updated_at", { mode: "number" }).$onUpdate(
      () => sql`(unixepoch())`,
    ),
  },
  (posts) => ({
    createdAtIndex: index("posts_created_at_index").on(posts.createdAt),
  }),
);

// userPosts join table supports many-to-many relationship between users and posts, as a post may have multiple authors and an author may have multiple posts
export const userPostsTable = sqliteTable(
  "user_posts_table",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.postId] }),
  }),
);

//* Optional relations for queries API
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(userPostsTable),
  accounts: many(accounts),
}));

export const userPostsRelations = relations(userPostsTable, ({ one }) => ({
  user: one(users, {
    fields: [userPostsTable.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [userPostsTable.postId],
    references: [posts.id],
  }),
}));

export const postsRelations = relations(posts, ({ many }) => ({
  authors: many(userPostsTable),
}));

//* NextAuth.js tables
export const accounts = sqliteTable(
  "account",
  {
    userId: text("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: text("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: text("provider", { length: 255 }).notNull(),
    providerAccountId: text("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: int("expires_at"),
    token_type: text("token_type", { length: 255 }),
    scope: text("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: text("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = sqliteTable(
  "session",
  {
    sessionToken: text("session_token", { length: 255 }).notNull().primaryKey(),
    userId: text("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: int("expires", { mode: "timestamp" }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_userId_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = sqliteTable(
  "verification_token",
  {
    identifier: text("identifier", { length: 255 }).notNull(),
    token: text("token", { length: 255 }).notNull(),
    expires: int("expires", { mode: "timestamp" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);
