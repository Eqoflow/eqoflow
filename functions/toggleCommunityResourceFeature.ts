import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { resourceId, isFeatured } = await req.json();
        if (!resourceId) {
            return new Response(JSON.stringify({ error: 'Resource ID is required.' }), { status: 400 });
        }

        // Fetch the resource to get the community ID
        const resource = await base44.asServiceRole.entities.CommunityResource.get(resourceId);
        if (!resource) {
            return new Response(JSON.stringify({ error: 'Resource not found.' }), { status: 404 });
        }

        // Fetch the community to verify ownership
        const community = await base44.asServiceRole.entities.Community.get(resource.community_id);
        if (!community) {
            return new Response(JSON.stringify({ error: 'Community not found.' }), { status: 404 });
        }

        // Check if the current user is the creator of the community
        if (community.created_by !== user.email) {
            return new Response(JSON.stringify({ error: 'You are not authorized to modify this resource.' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update the resource
        const updatedResource = await base44.asServiceRole.entities.CommunityResource.update(resourceId, {
            is_featured: isFeatured,
        });

        return new Response(JSON.stringify({ success: true, resource: updatedResource }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error toggling resource feature status:', error);
        return new Response(JSON.stringify({ error: 'An internal error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});