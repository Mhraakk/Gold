import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = redisUrl && redisToken ? new Redis({
  url: redisUrl,
  token: redisToken,
}) : null;

// Helper to check and consume budget
export async function consumeAiBudget(
  userId: string,
  purpose: string,
  model: string,
  estimatedTokens: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) {
    console.warn("Redis is not configured. Allowing request without budget check.");
    return { allowed: true, remaining: 99999 };
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const budgetKey = `ai_budget:${today}`;
  const maxBudget = parseInt(process.env.AI_DAILY_TOKEN_BUDGET || "1000", 10);

  try {
    // We use a simple INCRBY. If it doesn't exist, it creates it.
    // We will do a check first.
    const currentStr = await redis.get<string>(budgetKey);
    const current = currentStr ? parseInt(currentStr, 10) : 0;

    if (current + estimatedTokens > maxBudget) {
      return { allowed: false, remaining: Math.max(0, maxBudget - current) };
    }

    const newValue = await redis.incrby(budgetKey, estimatedTokens);
    
    // Set expiry for 48 hours to be safe
    if (newValue === estimatedTokens) {
      await redis.expire(budgetKey, 48 * 60 * 60);
    }

    // Log the usage
    const logKey = `ai_logs:${today}`;
    await redis.lpush(logKey, JSON.stringify({
      timestamp: new Date().toISOString(),
      userId,
      purpose,
      model,
      tokens: estimatedTokens
    }));

    return { allowed: true, remaining: maxBudget - newValue };
  } catch (error) {
    console.error("Redis Error:", error);
    // Allow if redis fails to not break the app entirely, but ideally we should fail.
    return { allowed: false, remaining: 0 };
  }
}

export async function getAiBudgetStats() {
  if (!redis) return { used: 0, total: 1000 };
  const today = new Date().toISOString().split("T")[0];
  const budgetKey = `ai_budget:${today}`;
  const maxBudget = parseInt(process.env.AI_DAILY_TOKEN_BUDGET || "1000", 10);
  const currentStr = await redis.get<string>(budgetKey);
  const used = currentStr ? parseInt(currentStr, 10) : 0;
  return { used, total: maxBudget };
}
