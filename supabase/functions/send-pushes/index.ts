// Supabase Edge Function (Deno). Invoked every minute by pg_cron; sends any
// scheduled pushes whose fire_at has passed. See WEBPUSH_SETUP.md.
//
// Deploy:  supabase functions deploy send-pushes
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
//          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically)
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

Deno.serve(async () => {
  const nowIso = new Date().toISOString()

  const { data: due, error } = await supabase
    .from('scheduled_pushes')
    .select('id, user_id, title, body')
    .eq('sent', false)
    .lte('fire_at', nowIso)
    .limit(200)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  for (const row of due ?? []) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, subscription')
      .eq('user_id', row.user_id)

    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          s.subscription,
          JSON.stringify({ title: row.title, body: row.body }),
        )
        sent++
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode
        // Subscription is gone — remove it so we stop trying.
        if (code === 404 || code === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', s.endpoint)
        }
      }
    }

    await supabase.from('scheduled_pushes').update({ sent: true }).eq('id', row.id)
  }

  // Tidy up: drop sent rows older than a day.
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString()
  await supabase
    .from('scheduled_pushes')
    .delete()
    .eq('sent', true)
    .lt('fire_at', dayAgo)

  return new Response(
    JSON.stringify({ processed: (due ?? []).length, sent }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
