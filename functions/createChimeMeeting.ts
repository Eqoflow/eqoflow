import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand, GetMeetingCommand } from 'npm:@aws-sdk/client-chime-sdk-meetings@3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { channelId, communityId } = await req.json();
    const cacheKey = `chime-meeting-${communityId}-${channelId}`;

    const region = Deno.env.get('AWS_CHIME_REGION') || 'us-east-1';
    const chime = new ChimeSDKMeetingsClient({
      region,
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY'),
      }
    });

    // Check cache for existing meeting
    let meetingId = null;
    try {
      const cached = await base44.asServiceRole.entities.FunctionCache.filter({ function_name: cacheKey });
      if (cached.length > 0) {
        meetingId = cached[0].cached_response?.meetingId;
        // Verify meeting still exists
        try {
          await chime.send(new GetMeetingCommand({ MeetingId: meetingId }));
        } catch (e) {
          meetingId = null;
          try {
            await base44.asServiceRole.entities.FunctionCache.delete(cached[0].id);
          } catch (deleteErr) {
            // Cache deletion failed, continue anyway
          }
        }
      }
    } catch (cacheErr) {
      // FunctionCache might not exist or be accessible, skip cache
      meetingId = null;
    }

    // Create new meeting if needed
    if (!meetingId) {
      const res = await chime.send(new CreateMeetingCommand({
        ClientRequestToken: `${communityId}-${channelId}-${Date.now()}`,
        MediaRegion: region,
        ExternalMeetingId: `${communityId}-${channelId}`,
      }));
      meetingId = res.Meeting.MeetingId;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await base44.asServiceRole.entities.FunctionCache.create({
        function_name: cacheKey,
        cached_response: { meetingId },
        expires_at: expiresAt,
      });
    }

    // Get full meeting info
    const meetingRes = await chime.send(new GetMeetingCommand({ MeetingId: meetingId }));

    // Create attendee for this user
    const attendeeRes = await chime.send(new CreateAttendeeCommand({
      MeetingId: meetingId,
      ExternalUserId: user.email,
    }));

    return Response.json({
      meeting: meetingRes.Meeting,
      attendee: attendeeRes.Attendee,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});