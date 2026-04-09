/**
 * Supabase Edge Function: send-fcm-notification
 *
 * Triggered via a Supabase Database Webhook on:
 *   Table: public.ncm_notifications
 *   Event: INSERT
 *
 * What it does:
 *  1. Reads the new ncm_notifications row from the webhook payload.
 *  2. Looks up the FCM token(s) for the target user from fcm_tokens.
 *  3. Sends a push notification via the Firebase Cloud Messaging HTTP v1 API.
 *
 * Required Supabase Secrets (set via Dashboard → Settings → Edge Functions):
 *   FIREBASE_SERVICE_ACCOUNT  — Full JSON of your Firebase service account key.
 *                               Firebase Console → Project Settings →
 *                               Service accounts → Generate new private key.
 *   FIREBASE_PROJECT_ID       — e.g. "elite-esports-mob"
 *   SUPABASE_SERVICE_ROLE_KEY — Your Supabase service role key (auto-set).
 *   SUPABASE_URL              — Your Supabase project URL (auto-set).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Types ─────────────────────────────────────────────────────────────────────
interface NCMNotificationRow {
  id:             string;
  target_user_id: string | null;
  target_duid:    string | null;
  title:          string;
  body:           string;
  data:           Record<string, unknown>;
  channel_id:     string;
  status:         string;
}

interface WebhookPayload {
  type:   'INSERT';
  table:  string;
  record: NCMNotificationRow;
  schema: string;
}

interface ServiceAccount {
  type:                        string;
  project_id:                  string;
  private_key_id:              string;
  private_key:                 string;
  client_email:                string;
  client_id:                   string;
  auth_uri:                    string;
  token_uri:                   string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url:        string;
}

// ── JWT helpers (pure Web Crypto — no external deps needed) ───────────────────
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const der = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

function base64url(data: Uint8Array | string): string {
  const bytes = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function makeJWT(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud:   sa.token_uri,
    exp:   now + 3600,
    iat:   now,
  }));
  const toSign = `${header}.${payload}`;
  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(toSign),
  );
  return `${toSign}.${base64url(new Uint8Array(sig))}`;
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const jwt = await makeJWT(sa);
  const res = await fetch(sa.token_uri, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(json)}`);
  return json.access_token as string;
}

// ── FCM HTTP v1 sender ────────────────────────────────────────────────────────
async function sendFCMMessage(
  accessToken: string,
  projectId:   string,
  fcmToken:    string,
  notif:       NCMNotificationRow,
): Promise<void> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  // Stringify all data values (FCM requires string values in data payload)
  const dataPayload: Record<string, string> = {
    ncm_id:     notif.id,
    channel_id: notif.channel_id,
  };
  for (const [k, v] of Object.entries(notif.data ?? {})) {
    dataPayload[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }

  const body = {
    message: {
      token: fcmToken,
      notification: {
        title: notif.title,
        body:  notif.body,
      },
      data: dataPayload,
      android: {
        priority:      'HIGH',
        notification: {
          channel_id:   notif.channel_id ?? 'elite-esports-default',
          default_sound: true,
          default_vibrate_timings: true,
          icon:         'ic_notification',
          color:        '#FE4C11',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: {
          aps: {
            alert: { title: notif.title, body: notif.body },
            sound: 'default',
            badge: 1,
          },
        },
      },
    },
  };

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`FCM send failed for token ${fcmToken.slice(0, 20)}…: ${err}`);
    // Don't throw — we'll continue for other tokens
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Only accept POST from Supabase webhook
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // ── 1. Parse webhook payload ────────────────────────────────────────────
    const payload = await req.json() as WebhookPayload;
    const notif   = payload.record;

    if (!notif || notif.status !== 'pending') {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    // ── 2. Load Firebase service account from secret ────────────────────────
    const saRaw     = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID') ?? 'elite-esports-mob';

    if (!saRaw) {
      console.warn('FIREBASE_SERVICE_ACCOUNT secret not set — skipping FCM delivery');
      return new Response(JSON.stringify({ skipped: true, reason: 'no_sa' }), { status: 200 });
    }

    const sa: ServiceAccount = JSON.parse(saRaw);

    // ── 3. Get OAuth2 access token ──────────────────────────────────────────
    const accessToken = await getAccessToken(sa);

    // ── 4. Look up FCM token(s) for the target user ─────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let query = supabase.from('fcm_tokens').select('token, user_id');

    if (notif.target_user_id) {
      // Targeted notification
      query = query.eq('user_id', notif.target_user_id);
    } else {
      // Broadcast — get all active tokens
      query = query.neq('token', '');
    }

    const { data: tokenRows, error } = await query;
    if (error) {
      console.error('Failed to fetch fcm_tokens:', error.message);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!tokenRows || tokenRows.length === 0) {
      console.log(`No FCM tokens found for user ${notif.target_user_id ?? 'broadcast'}`);
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
    }

    // ── 5. Send FCM to each token ───────────────────────────────────────────
    const sends = tokenRows.map((row: { token: string }) =>
      sendFCMMessage(accessToken, projectId, row.token, notif),
    );
    await Promise.allSettled(sends);

    console.log(`FCM: sent ${tokenRows.length} notification(s) for ncm_id=${notif.id}`);
    return new Response(JSON.stringify({ sent: tokenRows.length }), { status: 200 });

  } catch (err) {
    console.error('send-fcm-notification error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
