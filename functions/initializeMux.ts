import { createClient } from 'npm:@base44/sdk@0.1.0';
import Mux from 'npm:@mux/mux-node@8.2.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    console.log('=== MUX INITIALIZATION - FINAL VERSION ===');
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Auth header missing' }), { status: 401 });
        }
        
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401 });
        }

        if (user.mux_live_stream_id && user.stream_key && user.rtmp_url) {
            return new Response(JSON.stringify({ 
                stream_key: user.stream_key, 
                rtmp_url: user.rtmp_url,
                mux_live_stream_id: user.mux_live_stream_id
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        
        // Use the secure environment variables
        const muxTokenId = Deno.env.get("MUX_TOKEN_ID");
        const muxTokenSecret = Deno.env.get("MUX_TOKEN_SECRET");

        if (!muxTokenId || !muxTokenSecret) {
            console.error("Mux credentials are not set in environment variables.");
            return new Response(JSON.stringify({ error: "Mux API credentials are not configured on the server." }), { status: 500 });
        }
        
        const mux = new Mux({ tokenId: muxTokenId, tokenSecret: muxTokenSecret });
        
        const liveStream = await mux.video.liveStreams.create({
            playback_policy: ['public'],
            reconnect_window: 60,
            new_asset_settings: {
                playback_policy: ['public'],
            },
        });

        const rtmpUrl = `rtmps://global-live.mux.com:443/app`;
        
        await base44.entities.User.update(user.id, {
            mux_live_stream_id: liveStream.id,
            stream_key: liveStream.stream_key,
            rtmp_url: rtmpUrl
        });

        return new Response(JSON.stringify({
            stream_key: liveStream.stream_key,
            rtmp_url: rtmpUrl,
            mux_live_stream_id: liveStream.id
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('!!! CRITICAL ERROR IN initializeMux !!!:', error);
        return new Response(JSON.stringify({ 
            error: `Function crashed: ${error.message}`,
            type: error.name
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});