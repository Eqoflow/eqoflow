import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pollId, optionIndex } = await req.json();

    if (!pollId || optionIndex === undefined) {
      return Response.json({ error: 'Missing pollId or optionIndex' }, { status: 400 });
    }

    // Get the poll
    const poll = await base44.entities.Poll.get(pollId);

    if (!poll) {
      return Response.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Check if poll is still open
    const now = new Date();
    const endDate = new Date(poll.end_date);
    
    if (now > endDate) {
      return Response.json({ error: 'Poll has ended' }, { status: 400 });
    }

    // Check if user has already voted
    const voters = poll.voters || [];
    if (voters.includes(user.email)) {
      return Response.json({ error: 'You have already voted in this poll' }, { status: 400 });
    }

    // Validate option index
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return Response.json({ error: 'Invalid option index' }, { status: 400 });
    }

    // Update votes
    const votes = poll.votes || {};
    const optionKey = optionIndex.toString();
    
    if (!votes[optionKey]) {
      votes[optionKey] = [];
    }
    
    votes[optionKey].push(user.email);
    voters.push(user.email);

    const totalVotes = (poll.total_votes || 0) + 1;

    // Update the poll
    await base44.entities.Poll.update(pollId, {
      votes,
      voters,
      total_votes: totalVotes
    });

    // Award EP to voter (1 EP for voting)
    try {
      await base44.functions.invoke('awardEP', {
        actionType: 'poll_vote',
        relatedContentId: pollId,
        relatedContentType: 'poll',
        description: `Voted in poll: "${poll.question.substring(0, 30)}..."`
      });
    } catch (epError) {
      console.warn('Failed to award EP to voter:', epError);
    }

    // Award EP to poll creator (1 EP for receiving a vote)
    if (poll.created_by !== user.email) {
      try {
        await base44.functions.invoke('awardEP', {
          actionType: 'poll_vote_received',
          relatedContentId: pollId,
          relatedContentType: 'poll',
          description: `Your poll received a vote from ${user.full_name}`,
          recipientEmail: poll.created_by
        });
      } catch (epError) {
        console.warn('Failed to award EP to poll creator:', epError);
      }
    }

    return Response.json({
      success: true,
      votes,
      totalVotes
    });

  } catch (error) {
    console.error('Error casting vote:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});