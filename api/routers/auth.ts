import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, verificationCodes } from "@db/schema";
import { eq, and, gt } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";
import { env } from "../lib/env";

// JWT secret 一律来自环境变量(见 .env.example),绝不硬编码在源码里
const JWT_SECRET = new TextEncoder().encode(env.jwtSecret);

// ============================================
// Password helpers
// ============================================
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const computed = crypto.scryptSync(password, salt, 64).toString("hex");
  return computed === hash;
}

// ============================================
// SMS Service - Mock (Replace with real API)
// ============================================
// TODO: Replace this with your real SMS API
// e.g., Aliyun SMS, Tencent Cloud SMS, etc.
interface SMSService {
  sendCode(phone: string, code: string): Promise<boolean>;
}

class MockSMSService implements SMSService {
  async sendCode(phone: string, code: string): Promise<boolean> {
    // In development: just log the code to console
    console.log(`[SMS MOCK] Sending code ${code} to ${phone}`);
    // TODO: Replace with real SMS API call:
    // const response = await fetch('https://your-sms-api.com/send', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${SMS_API_KEY}` },
    //   body: JSON.stringify({ phone, code }),
    // });
    // return response.ok;
    return true;
  }
}

const smsService: SMSService = new MockSMSService();

// ============================================
// Helpers
// ============================================

function generateCode(): string {
  // 6-digit random code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createToken(userId: number, phone: string): Promise<string> {
  return new SignJWT({ sub: String(userId), phone })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return payload as { sub: string; phone: string };
  } catch {
    return null;
  }
}

// ============================================
// Auth Router
// ============================================

export const authRouter = createRouter({
  // Send verification code
  sendCode: publicQuery
    .input(z.object({ phone: z.string().regex(/^1[3-9]\d{9}$/, "Invalid phone number") }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Save code to database
      await db.insert(verificationCodes).values({
        phone: input.phone,
        code,
        expiresAt,
      });

      // Send via SMS (mock for now)
      const sent = await smsService.sendCode(input.phone, code);

      if (!sent) {
        return { success: false, message: "Failed to send SMS" };
      }

      return { success: true, message: "Verification code sent", code };
    }),

  // Verify code and login/register
  verifyCode: publicQuery
    .input(
      z.object({
        phone: z.string().regex(/^1[3-9]\d{9}$/, "Invalid phone number"),
        code: z.string().length(6, "Code must be 6 digits"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Find valid code
      const [record] = await db
        .select()
        .from(verificationCodes)
        .where(
          and(
            eq(verificationCodes.phone, input.phone),
            eq(verificationCodes.code, input.code),
            eq(verificationCodes.used, 0),
            gt(verificationCodes.expiresAt, new Date())
          )
        )
        .orderBy(verificationCodes.createdAt)
        .limit(1);

      if (!record) {
        return { success: false, message: "Invalid or expired code" };
      }

      // Mark code as used
      await db
        .update(verificationCodes)
        .set({ used: 1 })
        .where(eq(verificationCodes.id, record.id));

      // Find or create user
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.phone, input.phone))
        .limit(1);

      if (!user) {
        // Auto-register new user
        const result = await db.insert(users).values({
          phone: input.phone,
          nickname: `User_${input.phone.slice(-4)}`,
        });
        const userId = Number(result[0].insertId);
        [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
      }

      if (!user) {
        return { success: false, message: "Failed to create user" };
      }

      // Create JWT token
      const token = await createToken(user.id, user.phone);

      return {
        success: true,
        token,
        hasPassword: !!user.passwordHash,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
        },
      };
    }),

  // Login with phone + password
  loginPassword: publicQuery
    .input(
      z.object({
        phone: z.string().regex(/^1[3-9]\d{9}$/, "Invalid phone number"),
        password: z.string().min(6, "密码至少6位"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.phone, input.phone))
        .limit(1);

      if (!user || !user.passwordHash) {
        return { success: false, message: "账号未设置密码，请使用验证码登录" };
      }

      if (!verifyPassword(input.password, user.passwordHash)) {
        return { success: false, message: "密码错误" };
      }

      const token = await createToken(user.id, user.phone);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
        },
      };
    }),

  // Set password (requires auth)
  setPassword: publicQuery
    .input(
      z.object({
        password: z.string().min(6, "密码至少6位"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const authHeader = ctx.req.headers.get("authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return { success: false, message: "请先登录" };
      }
      const payload = await verifyToken(authHeader.slice(7));
      if (!payload) return { success: false, message: "登录已过期" };

      const db = getDb();
      const passwordHash = hashPassword(input.password);

      await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, Number(payload.sub)));

      return { success: true, message: "密码设置成功" };
    }),

  // Get current user
  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token);
    if (!payload) return null;

    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(payload.sub)))
      .limit(1);

    if (!user) return null;

    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      role: user.role,
    };
  }),
});
