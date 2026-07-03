// supabase/functions/github-auth/index.ts
// ─────────────────────────────────────────────────────────────────
// Direct GitHub OAuth token exchange — no Supabase OAuth provider
// needed. This function:
//   1. Exchanges the GitHub `code` for an access token
//   2. Fetches the GitHub user's email + profile
//   3. Finds or creates a Supabase auth user
//   4. Returns a Supabase magic-link token the client can verify
//
// Secrets required (set in Supabase Dashboard → Edge Functions → Secrets):
//   GITHUB_CLIENT_ID      — your GitHub OAuth App client ID
//   GITHUB_CLIENT_SECRET  — your GitHub OAuth App client secret
// ─────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const { code, redirectUri } = await req.json();
    if (!code) throw new Error("Missing GitHub OAuth code");

    const CLIENT_ID     = Deno.env.get("GITHUB_CLIENT_ID");
    const CLIENT_SECRET = Deno.env.get("GITHUB_CLIENT_SECRET");
    const SUPABASE_URL  = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error("GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET not configured");
    }

    // ── 1. Exchange code for GitHub access token ──────────────────
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      }
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }
    const ghToken = tokenData.access_token;

    // ── 2. Fetch GitHub user profile ──────────────────────────────
    const [userRes, emailsRes] = await Promise.all([
      fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/json" },
      }),
      fetch("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${ghToken}`, Accept: "application/json" },
      }),
    ]);
    const ghUser   = await userRes.json();
    const ghEmails = await emailsRes.json();

    const primaryEmail =
      (Array.isArray(ghEmails)
        ? ghEmails.find((e: any) => e.primary && e.verified)?.email
        : null) || ghUser.email;

    if (!primaryEmail) throw new Error("No verified email found on GitHub account");

    const displayName = ghUser.name || ghUser.login;

    // ── 3. Find or create the Supabase user ───────────────────────
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Try to find existing user by email
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = listData?.users?.find((u) => u.email === primaryEmail);

    let userId: string;

    if (existing) {
      userId = existing.id;
      // Update GitHub metadata if missing
      if (!existing.user_metadata?.github_login) {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...existing.user_metadata,
            name: existing.user_metadata?.name || displayName,
            avatar_url: existing.user_metadata?.avatar_url || ghUser.avatar_url,
            github_login: ghUser.login,
          },
        });
      }
    } else {
      // Create new user — email already confirmed via GitHub
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: primaryEmail,
        email_confirm: true,
        user_metadata: {
          name: displayName,
          avatar_url: ghUser.avatar_url,
          github_login: ghUser.login,
          provider: "github",
        },
      });
      if (createErr) throw createErr;
      userId = created.user.id;
    }

    // ── 4. Generate a magic-link token the client can verify ──────
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: primaryEmail,
      options: { redirectTo: redirectUri },
    });
    if (linkErr) throw linkErr;

    // Return the hashed token + email so client can call verifyOtp
    return new Response(
      JSON.stringify({
        token_hash: linkData.properties.hashed_token,
        email: primaryEmail,
        name: displayName,
        avatar_url: ghUser.avatar_url,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[github-auth]", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "GitHub auth failed" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
