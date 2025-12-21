import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // We allow unauthenticated impressions for now to capture all views,
        // but this could be restricted later if needed.
        const { postId } = await req.json();

        if (!postId) {
            return new Response(JSON.stringify({ error: 'Post ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Use asServiceRole to bypass RLS for a simple increment operation.
        // This is efficient and doesn't require complex read/write permissions.
        const post = await base44.asServiceRole.entities.Post.get(postId);

        if (!post) {
            // Fail silently if post not found, it might have been deleted.
            return new Response(JSON.stringify({ success: true, message: 'Post not found, impression not recorded.' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const newImpressionsCount = (post.impressions_count || 0) + 1;

        await base44.asServiceRole.entities.Post.update(postId, {
            impressions_count: newImpressionsCount,
        });

        return new Response(JSON.stringify({ success: true, newCount: newImpressionsCount }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        // Log the error but don't fail the user's experience over an impression count.
        console.error('Error recording post impression:', error.message);
        return new Response(JSON.stringify({ error: 'Internal server error during impression recording.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});