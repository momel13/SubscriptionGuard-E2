import type { Request, Response } from 'express';
import { createSupabaseForAccessToken } from './supabase.js';
import type { SupabaseRequestClient } from './supabase.js';

export const LOCAL_DEMO_TOKEN = process.env.LOCAL_DEMO_TOKEN || 'local-demo-token-subscriptionguard';
export const LOCAL_DEMO_USER_ID = process.env.LOCAL_DEMO_USER_ID || '00000000-0000-4000-8000-000000000001';
export const LOCAL_DEMO_EMAIL = process.env.SUPABASE_DEMO_EMAIL || 'demo@subscriptionguard.local';

type BaseAuthContext = {
  accessToken: string;
  userId: string;
  userEmail: string | undefined;
};

type LocalDemoAuthContext = BaseAuthContext & {
  isLocalDemo: true;
};

type SupabaseAuthContext = BaseAuthContext & {
  isLocalDemo: false;
  db: SupabaseRequestClient;
};

export type AuthContext = LocalDemoAuthContext | SupabaseAuthContext;

export function isLocalDemoAuth(auth: AuthContext): auth is LocalDemoAuthContext {
  return auth.isLocalDemo;
}

export async function getAuthContext(req: Request, res: Response): Promise<AuthContext | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      errors: ['Nicht autorisiert. Bearer Token fehlt.'],
    });
    return null;
  }

  const accessToken = authHeader.slice('Bearer '.length).trim();

  if (accessToken === LOCAL_DEMO_TOKEN) {
    return {
      accessToken,
      userId: LOCAL_DEMO_USER_ID,
      userEmail: LOCAL_DEMO_EMAIL,
      isLocalDemo: true,
    };
  }

  const db = createSupabaseForAccessToken(accessToken);
  const { data, error } = await db.auth.getUser(accessToken);

  if (error || !data.user) {
    res.status(401).json({
      errors: ['Nicht autorisiert. Der Supabase Access Token ist ungültig.'],
    });
    return null;
  }

  return {
    accessToken,
    userId: data.user.id,
    userEmail: data.user.email,
    isLocalDemo: false,
    db,
  };
}
