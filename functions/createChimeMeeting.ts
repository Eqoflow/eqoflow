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
    const cached = await base44.asServiceRole.entities.FunctionCache.filter({ cache_key: cacheKey });
    if (cached.length > 0) {
      meetingId = cached[0].cache_value;
      // Verify meeting still exists
      try {
        await chime.send(new GetMeetingCommand({ MeetingId: meetingId }));
      } catch (e) {
        meetingId = null;
        await base44.asServiceRole.entities.FunctionCache.delete(cached[0].id);
      }
    }

    // Create new meeting if needed
    if (!meetingId) {
      const res = await chime.send(new CreateMeetingCommand({
        ClientRequestToken: `${communityId}-${channelId}-${Date.now()}`,
        MediaRegion: 'auto',
        ExternalMeetingId: `${communityId}-${channelId}`,
      }));
      meetingId = res.Meeting.MeetingId;
      await base44.asServiceRole.entities.FunctionCache.create({
        cache_key: cacheKey,
        cache_value: meetingId,
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