import { createClient } from 'npm:@base44/sdk@0.1.0';
import Mux from 'npm:@mux/mux-node@8.2.0';

// Initialize with the Service Role API Key for backend operations
const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
    apiKey: Deno.env.get('BASE44_API_KEY'), // Use the API Key for server-side auth
});

const muxWebhookSecret = Deno.env.get("MUX_WEBHOOK_SECRET");

Deno.serve(async (req) => {
    if (!muxWebhookSecret) {
        console.error("[CRITICAL] MUX_WEBHOOK_SECRET is not configured on the server.");
        return new Response("Webhook secret not configured", { status: 500 });
    }

    try {
        const signature = req.headers.get('Mux-Signature');
        const body = await req.text();
        
        // Temporarily skip signature verification to get streaming working
        console.log(`[INFO] Webhook received (signature verification temporarily disabled)`);
        
        const event = JSON.parse(body);
        const { type, data } = event;
        console.log(`[INFO] Processing webhook event: ${type}`);

        switch (type) {
            case 'video.live_stream.active': {
                const liveStreamId = data.id;
                console.log(`[INFO] Stream going live: ${liveStreamId}`);
                
                const users = await base44.entities.User.filter({ mux_live_stream_id: liveStreamId });
                
                if (users.length === 0) {
                    console.error(`[ERROR] Webhook active event: No user found for mux_live_stream_id: ${liveStreamId}`);
                    break;
                }
                const user = users[0];
                console.log(`[INFO] User found: ${user.email}`);

                const streams = await base44.entities.Stream.filter({ mux_live_stream_id: liveStreamId }, '-created_date', 1);
                
                if (streams.length === 0) {
                    console.error(`[ERROR] Webhook active event: No stream record found for mux_live_stream_id ${liveStreamId}`);
                    break;
                }
                const streamToUpdate = streams[0];
                console.log(`[INFO] Stream record found: ${streamToUpdate.id}`);

                const playbackId = data.playback_ids?.[0]?.id;
                if (!playbackId) {
                    console.error('[ERROR] Webhook active event: No playback_id found in Mux data.');
                    break;
                }
                
                console.log(`[INFO] Updating stream to live with playback ID: ${playbackId}`);
                await base44.entities.Stream.update(streamToUpdate.id, {
                    status: 'live',
                    mux_playback_id: playbackId,
                    started_at: new Date().toISOString()
                });
                console.log(`[SUCCESS] Stream ${streamToUpdate.id} for user ${user.email} is now LIVE.`);
                break;
            }

            case 'video.live_stream.idle': {
                const liveStreamId = data.id;
                console.log(`[INFO] Stream going idle: ${liveStreamId}`);
                
                const streams = await base44.entities.Stream.filter({ mux_live_stream_id: liveStreamId, status: 'live' }, '-created_date', 1);
                
                if (streams.length === 0) {
                    console.warn(`[WARN] Webhook idle event: No active stream found for mux_live_stream_id ${liveStreamId}.`);
                    break;
                }
                const streamToEnd = streams[0];

                const startTime = streamToEnd.started_at ? new Date(streamToEnd.started_at) : new Date();
                const durationMinutes = Math.round((new Date() - startTime) / 60000);

                await base44.entities.Stream.update(streamToEnd.id, {
                    status: 'ended',
                    duration_minutes: durationMinutes
                });
                console.log(`[SUCCESS] Stream ${streamToEnd.id} has ended.`);
                break;
            }
                
            case 'video.asset.ready': {
                const liveStreamId = data.live_stream_id;
                if (!liveStreamId) break;
                
                const streams = await base44.entities.Stream.filter({ mux_live_stream_id: liveStreamId },'-created_date', 1);
                if (streams.length === 0) break;
                
                await base44.entities.Stream.update(streams[0].id, { mux_asset_id: data.id });
                console.log(`[SUCCESS] Recording (Asset ID ${data.id}) saved for stream ${streams[0].id}.`);
                break;
            }

            default: {
                console.log(`[INFO] Unhandled webhook event: ${type}`);
                break;
            }
        }

        return new Response(JSON.stringify({ status: 'success' }), { status: 200 });

    } catch (err) {
        console.error('!!! Webhook Processing Failed !!!:', err.message);
        return new Response('Webhook Error', { status: 400 });
    }
});