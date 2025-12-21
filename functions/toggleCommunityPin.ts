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
        const { communityId, isPinned } = await req.json();

        if (!communityId) {
            return new Response(JSON.stringify({ error: 'Community ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update the community's pin status
        await base44.asServiceRole.entities.Community.update(communityId, { is_pinned: isPinned });

        return new Response(JSON.stringify({ 
            success: true, 
            message: isPinned ? 'Community pinned successfully' : 'Community unpinned successfully' 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error toggling community pin:', error);
        return new Response(JSON.stringify({ error: 'Failed to toggle community pin' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});