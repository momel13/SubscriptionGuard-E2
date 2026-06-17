# SubscriptionGuard Backend-Prototyp

## Lokaler Start

```powershell
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev
```

Das Backend laeuft standardmaessig auf `http://localhost:5001`.

## Live-Test mit Supabase

Der Frontend-Prototyp ruft beim Start `POST /api/auth/demo` auf. Fuer echte
Supabase-Tests braucht das Backend einen bestaetigten Demo-User und ein Profil in
`public.users`.

Empfohlene lokale Konfiguration in `.env`:

```dotenv
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_DEMO_EMAIL=demo@subscriptionguard.app
SUPABASE_DEMO_PASSWORD=<demo-password>
SUPABASE_DEMO_USER_NAME=Demo User
```

`SUPABASE_SERVICE_ROLE_KEY` bleibt ausschliesslich im Backend. Wenn der Key
gesetzt ist, bereitet `/api/auth/demo` den Demo-User und das zugehoerige
`public.users`-Profil automatisch vor. Danach laufen Dashboard und
`POST /api/subscriptions` mit einem echten Supabase Access Token, sodass RLS auf
`subscriptions` greift.

Ohne gueltigen Supabase-Demo-Login faellt das Backend weiterhin auf den lokalen
Demo-Modus zurueck. Der Frontend-Prototyp zeigt diesen Modus im Datenquellenlabel
an.
