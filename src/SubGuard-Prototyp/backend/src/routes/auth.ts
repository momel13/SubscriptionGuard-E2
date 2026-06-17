import express from 'express';
import type { User } from '@supabase/supabase-js';
import { LOCAL_DEMO_EMAIL, LOCAL_DEMO_TOKEN, LOCAL_DEMO_USER_ID } from '../auth.js';
import { createSupabaseAdminClient, supabase } from '../supabase.js';
import type { SupabaseAdminClient } from '../supabase.js';

const router = express.Router();

const DEMO_EMAIL = process.env.SUPABASE_DEMO_EMAIL || 'demo@subscriptionguard.app';
const DEMO_PASSWORD = process.env.SUPABASE_DEMO_PASSWORD || 'SubscriptionGuardDemo2026!';
const DEMO_USER_NAME = process.env.SUPABASE_DEMO_USER_NAME || 'Demo User';

async function signInDemoUser() {
  return supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
}

async function ensureDemoProfile(adminClient: SupabaseAdminClient, user: User) {
  return adminClient
    .from('users')
    .upsert({
      id: user.id,
      name: user.user_metadata?.name || DEMO_USER_NAME,
      email: user.email || DEMO_EMAIL,
      currency: 'EUR',
      monthly_budget: 80,
      notification_lead_days: 14,
    }, { onConflict: 'id' });
}

async function ensureConfirmedDemoUser() {
  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return {
      bootstrapped: false,
      warning: 'SUPABASE_SERVICE_ROLE_KEY fehlt. Demo-User kann nicht automatisch vorbereitet werden.',
    };
  }

  const usersResult = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersResult.error) {
    return {
      bootstrapped: false,
      warning: `Demo-User konnte nicht gesucht werden: ${usersResult.error.message}`,
    };
  }

  const existingUser = usersResult.data.users.find(
    (candidate) => candidate.email?.toLowerCase() === DEMO_EMAIL.toLowerCase()
  );

  const userResult = existingUser
    ? await adminClient.auth.admin.updateUserById(existingUser.id, {
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: DEMO_USER_NAME,
      },
    })
    : await adminClient.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: {
        name: DEMO_USER_NAME,
      },
    });

  if (userResult.error || !userResult.data.user) {
    return {
      bootstrapped: false,
      warning: `Demo-User konnte nicht vorbereitet werden: ${userResult.error?.message || 'Unbekannter Fehler'}`,
    };
  }

  const profileResult = await ensureDemoProfile(adminClient, userResult.data.user);

  if (profileResult.error) {
    return {
      bootstrapped: false,
      warning: `Demo-Profil konnte nicht vorbereitet werden: ${profileResult.error.message}`,
    };
  }

  return {
    bootstrapped: true,
    warning: undefined,
  };
}

router.post('/demo', async (_, res) => {
  try {
    let signInResult = await signInDemoUser();
    let session = signInResult.data.session;
    let user = signInResult.data.user;
    let error = signInResult.error;

    if (error) {
      const signUpResult = await supabase.auth.signUp({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        options: {
          data: {
            name: 'Demo User',
          },
        },
      });

      if (signUpResult.error) {
        const bootstrap = await ensureConfirmedDemoUser();
        const retry = await signInDemoUser();
        session = retry.data.session;
        user = retry.data.user;
        error = retry.error;

        if (bootstrap.warning && (error || !session?.access_token || !user)) {
        return res.json({
          accessToken: LOCAL_DEMO_TOKEN,
          user: {
            id: LOCAL_DEMO_USER_ID,
            email: LOCAL_DEMO_EMAIL,
          },
          warning: `Supabase Demo-Login nicht verfügbar: ${signUpResult.error.message}`,
        });
        }
      }

      if (!signUpResult.error && signUpResult.data.session) {
        session = signUpResult.data.session;
        user = signUpResult.data.user;
      } else if (!signUpResult.error) {
        const bootstrap = await ensureConfirmedDemoUser();
        const retry = await signInDemoUser();
        session = retry.data.session;
        user = retry.data.user;
        error = retry.error;

        if (bootstrap.warning && (error || !session?.access_token || !user)) {
          return res.json({
            accessToken: LOCAL_DEMO_TOKEN,
            user: {
              id: LOCAL_DEMO_USER_ID,
              email: LOCAL_DEMO_EMAIL,
            },
            warning: bootstrap.warning,
          });
        }
      }
    }

    if (error || !session?.access_token || !user) {
      return res.json({
        accessToken: LOCAL_DEMO_TOKEN,
        user: {
          id: LOCAL_DEMO_USER_ID,
          email: LOCAL_DEMO_EMAIL,
        },
        warning: 'Supabase Demo-Login ist nicht verfügbar. Lokaler Demo-Token wird verwendet.',
      });
    }

    const adminClient = createSupabaseAdminClient();
    if (adminClient) {
      const profileResult = await ensureDemoProfile(adminClient, user);

      if (profileResult.error) {
        return res.json({
          accessToken: LOCAL_DEMO_TOKEN,
          user: {
            id: LOCAL_DEMO_USER_ID,
            email: LOCAL_DEMO_EMAIL,
          },
          warning: `Supabase Demo-Profil nicht verfuegbar: ${profileResult.error.message}`,
        });
      }
    }

    return res.json({
      accessToken: session.access_token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Demo auth failed:', error);
    return res.status(500).json({
      errors: ['Demo-Login konnte wegen eines Serverfehlers nicht gestartet werden.'],
    });
  }
});

export default router;
