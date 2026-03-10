import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } from 'npm:@aws-sdk/client-chime-sdk-meetings@3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { channelId, communityId } = await req.json();
    if (!channelId || !communityId) {
      return Response.json({ error: 'Missing channelId or communityId' }, { status: 400 });
    }

    const region = Deno.env.get('AWS_CHIME_REGION') || 'us-east-1';
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      return Response.json({ error: 'AWS credentials not configured' }, { status: 500 });
    }

    const chime = new ChimeSDKMeetingsClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      }
    });

    // Create meeting
    const meetingRes = await chime.send(new CreateMeetingCommand({
      ClientRequestToken: `${communityId}-${channelId}-${Date.now()}`,
      MediaRegion: region,
      ExternalMeetingId: `${communityId}-${channelId}`,
    }));

    // Create attendee
    const attendeeRes = await chime.send(new CreateAttendeeCommand({
      MeetingId: meetingRes.Meeting.MeetingId,
      ExternalUserId: user.email,
    }));

    return Response.json({
      meeting: meetingRes.Meeting,
      attendee: attendeeRes.Attendee,
    });
  } catch (error) {
    console.error('Chime error:', error);
    return Response.json({ error: error.message || 'Failed to create meeting' }, { status: 500 });
  }
});