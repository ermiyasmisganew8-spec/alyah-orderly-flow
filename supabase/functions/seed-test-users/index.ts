import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  const companyId = "a1b2c3d4-e5f6-4890-abcd-ef1234567890";
  const branchId = "b2c3d4e5-f6a7-4901-bcde-f12345678901";

  const users = [
    { email: "staff@canoe.com", password: "staff123", role: "staff", company_id: companyId, branch_id: branchId, name: "Staff User" },
    { email: "branchadmin@canoe.com", password: "admin123", role: "branch_admin", company_id: companyId, branch_id: branchId, name: "Branch Admin" },
    { email: "companyadmin@canoe.com", password: "company123", role: "company_admin", company_id: companyId, branch_id: null, name: "Company Admin" },
    { email: "superadmin@alyah.com", password: "super123", role: "platform_admin", company_id: null, branch_id: null, name: "Platform Admin" },
  ];

  const results = [];

  for (const u of users) {
    // Check if user exists
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users?.find((x: any) => x.email === u.email);

    let userId: string;
    if (found) {
      userId = found.id;
      // Update password
      await admin.auth.admin.updateUserById(userId, { password: u.password });
      results.push({ email: u.email, status: "updated" });
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.name },
      });
      if (error) {
        results.push({ email: u.email, status: "error", message: error.message });
        continue;
      }
      userId = data.user.id;
      results.push({ email: u.email, status: "created" });
    }

    // Upsert role
    const { error: delErr } = await admin.from("user_roles").delete().eq("user_id", userId);
    const rolePayload: any = { user_id: userId, role: u.role };
    if (u.company_id) rolePayload.company_id = u.company_id;
    if (u.branch_id) rolePayload.branch_id = u.branch_id;
    await admin.from("user_roles").insert(rolePayload);
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
