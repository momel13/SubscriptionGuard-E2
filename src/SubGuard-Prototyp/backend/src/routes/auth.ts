import express from 'express';
import { LOCAL_DEMO_EMAIL, LOCAL_DEMO_TOKEN, LOCAL_DEMO_USER_ID } from '../auth.js';
import { supabase } from '../supabase.js';

const router = express.Router();

const DEMO_EMAIL = process.env.SUPABASE_DEMO_EMAIL || 'demo@subscriptionguard.local';
const DEMO_PASSWORD = process.env.SUPABASE_DEMO_PASSWORD || 'SubscriptionGuardDemo2026!';

async function signInDemoUser() {
  return supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  });
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
        return res.json({
          accessToken: LOCAL_DEMO_TOKEN,
          user: {
            id: LOCAL_DEMO_USER_ID,
            email: LOCAL_DEMO_EMAIL,
          },
          warning: `Supabase Demo-Login nicht verfügbar: ${signUpResult.error.message}`,
        });
      }

      if (signUpResult.data.session) {
        session = signUpResult.data.session;
        user = signUpResult.data.user;
      } else {
        const retry = await signInDemoUser();
        session = retry.data.session;
        user = retry.data.user;
        error = retry.error;
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
