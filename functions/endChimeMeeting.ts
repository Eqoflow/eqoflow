import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { ChimeSDKMeetingsClient, DeleteMeetingCommand } from 'npm:@aws-sdk/client-chime-sdk-meetings@3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { meetingId, communityId, channelId } = await req.json();

    const region = Deno.env.get('AWS_CHIME_REGION') || 'us-east-1';
    const chime = new ChimeSDKMeetingsClient({
      region,
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY'),
      }
    });

    await chime.send(new DeleteMeetingCommand({ MeetingId: meetingId }));

    // Clear cache
    const cacheKey = `chime-meeting-${communityId}-${channelId}`;
    const cached = await base44.asServiceRole.entities.FunctionCache.filter({ function_name: cacheKey });
    if (cached.length > 0) {
      await base44.asServiceRole.entities.FunctionCache.delete(cached[0].id);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});