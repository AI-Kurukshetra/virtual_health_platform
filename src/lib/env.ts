import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const clientEnvResult = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!clientEnvResult.success) {
  throw new Error(
    `Invalid Supabase client environment configuration: ${clientEnvResult.error.message}`,
  );
}

const serverEnvResult = serverEnvSchema.safeParse({
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

if (!serverEnvResult.success) {
  throw new Error(
    `Invalid Supabase server environment configuration: ${serverEnvResult.error.message}`,
  );
}

export const clientEnv = clientEnvResult.data;

export const serverEnv = serverEnvResult.data;

export function requireServiceRoleKey() {
  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for privileged server operations.",
    );
  }

  return serverEnv.SUPABASE_SERVICE_ROLE_KEY;
}
