import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      // Always 200 with error in body so frontend doesn't see "non-2xx"
      return json(200, { error: 'Unauthorized: missing token' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing required env vars');
      return json(200, { error: 'Server misconfiguration: missing environment variables' });
    }

    // Verify caller has a valid session
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerData, error: authError } = await anonClient.auth.getUser();
    if (authError || !callerData?.user) {
      return json(200, { error: 'Unauthorized: invalid session' });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json(200, { error: 'Invalid JSON body' });
    }

    const { email, password, full_name, role, company_id, branch_id } = body || {};

    if (!email || !password || !role) {
      return json(200, { error: 'Missing required fields: email, password, role' });
    }

    // Service role client for admin actions (bypasses RLS, no session impact on caller)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Try to find an existing auth user with this email
    let userId: string | null = null;
    try {
      // listUsers can be filtered via the admin API
      const { data: list, error: listErr } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (listErr) {
        console.warn('listUsers failed', listErr.message);
      } else {
        const existing = list.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());
        if (existing) userId = existing.id;
      }
    } catch (e) {
      console.warn('Unable to list users:', (e as Error).message);
    }

    if (!userId) {
      // Create a brand new auth user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || email },
      });

      if (createError) {
        console.error('createUser error:', createError.message);
        return json(200, { error: createError.message });
      }
      userId = newUser.user.id;
    } else {
      // Update password for existing user (so credentials emailed are valid)
      try {
        await adminClient.auth.admin.updateUserById(userId, { password });
      } catch (e) {
        console.warn('updateUserById password failed:', (e as Error).message);
      }
    }

    // Ensure profile row exists (handle_new_user trigger should create it, but be safe)
    try {
      await adminClient.from('profiles').upsert(
        { user_id: userId, email, full_name: full_name || email },
        { onConflict: 'user_id' },
      );
    } catch (e) {
      console.warn('profile upsert failed:', (e as Error).message);
    }

    // Upsert role assignment (avoid duplicate-key errors on retries)
    const { error: roleError } = await adminClient
      .from('user_roles')
      .upsert(
        {
          user_id: userId,
          role,
          company_id: company_id || null,
          branch_id: branch_id || null,
        },
        { onConflict: 'user_id,role' },
      );

    if (roleError) {
      // Fallback: delete then insert
      await adminClient.from('user_roles').delete().eq('user_id', userId).eq('role', role);
      const { error: insErr } = await adminClient.from('user_roles').insert({
        user_id: userId,
        role,
        company_id: company_id || null,
        branch_id: branch_id || null,
      });
      if (insErr) {
        console.error('role assignment failed:', insErr.message);
        return json(200, { error: `Role assignment failed: ${insErr.message}` });
      }
    }

    return json(200, { user_id: userId, success: true });
  } catch (err) {
    console.error('Unhandled error:', (err as Error).message);
    // Return 200 with error in body so the SDK doesn't surface "non-2xx"
    return json(200, { error: (err as Error).message || 'Unknown error' });
  }
});
