import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    // Verify user is authenticated
    if (!(await base44.auth.isAuthenticated())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { content, contentType, contentId } = await req.json();

        if (!content) {
            return new Response(JSON.stringify({ error: 'Content is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // FIXED: Much more lenient AI moderation prompt
        const moderationPrompt = `
You are a content moderator for a social media platform. Review the following ${contentType} and determine if it should be approved or flagged.

IMPORTANT: Only flag content if it contains:
1. Explicit hate speech targeting individuals or groups
2. Direct threats of violence or self-harm
3. Spam or obvious bot content
4. Illegal content (not just controversial topics)

DO NOT flag content for:
- Personal opinions or viewpoints
- Political discussions
- Business or promotional content
- Casual conversation
- Creative expression
- Technical discussions
- General complaints or feedback

Content to review: "${content}"

Respond with exactly one word: "approved" or "flagged"

If flagged, also provide a brief reason after a comma.
Example responses:
- "approved"
- "flagged, contains direct threats of violence"
`;

        try {
            // Use the base44 integration instead of direct import
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: moderationPrompt
            });

            let moderationResult = 'approved';
            let moderationReason = null;

            if (typeof result === 'string') {
                const parts = result.toLowerCase().trim().split(',');
                const decision = parts[0].trim();
                
                if (decision === 'flagged') {
                    moderationResult = 'flagged';
                    moderationReason = parts[1] ? parts[1].trim() : 'Flagged by AI moderator';
                }
            }

            // Update the content's moderation status
            if (contentType === 'post' && contentId) {
                try {
                    await base44.asServiceRole.entities.Post.update(contentId, {
                        moderation_status: moderationResult,
                        ...(moderationReason && { 
                            moderation_details: { 
                                reason: moderationReason,
                                notes: 'Reviewed by AI moderator'
                            } 
                        })
                    });
                } catch (updateError) {
                    console.warn('Failed to update post moderation status:', updateError);
                }
            }

            return new Response(JSON.stringify({
                success: true,
                moderation_result: moderationResult,
                moderation_reason: moderationReason
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (llmError) {
            console.error('LLM moderation failed:', llmError);
            // FIXED: If AI fails, default to approved instead of flagged
            return new Response(JSON.stringify({
                success: true,
                moderation_result: 'approved',
                moderation_reason: null
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

    } catch (error) {
        console.error('Content review error:', error);
        return new Response(JSON.stringify({ 
            error: 'Failed to review content',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});