const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, name, email, password, role } = await req.json();

    if (!to || !email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subject = `Welcome to Alyah Menu – Your ${role} Account`;
    const body = `
Hello ${name || email},

Your ${role} account on Alyah Menu has been created.

Login URL: ${req.headers.get('origin') || 'https://alyah-orderly-flow.lovable.app'}/login
Email: ${email}
Temporary Password: ${password}

Please log in and change your password immediately.

Best regards,
Alyah Menu Team
    `.trim();

    // Log the email for demo purposes
    console.log('=== CREDENTIAL EMAIL ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    console.log('========================');

    return new Response(JSON.stringify({ success: true, message: 'Email logged (demo mode)' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
