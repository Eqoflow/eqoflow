import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    // Check if user is authenticated and is admin
    if (!(await base44.auth.isAuthenticated())) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { postId, isPinned } = await req.json();

        if (!postId) {
            return new Response(JSON.stringify({ error: 'Post ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // If pinning this post, first unpin any other pinned posts
        if (isPinned) {
            const currentlyPinnedPosts = await base44.asServiceRole.entities.Post.filter({ is_pinned: true });
            for (const pinnedPost of currentlyPinnedPosts) {
                await base44.asServiceRole.entities.Post.update(pinnedPost.id, { is_pinned: false });
            }
        }

        // Update the target post
        await base44.asServiceRole.entities.Post.update(postId, { is_pinned: isPinned });

        return new Response(JSON.stringify({ 
            success: true, 
            message: isPinned ? 'Post pinned successfully' : 'Post unpinned successfully' 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error toggling post pin:', error);
        return new Response(JSON.stringify({ error: 'Failed to toggle post pin' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});