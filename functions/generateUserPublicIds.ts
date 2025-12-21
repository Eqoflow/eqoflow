import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

// Generate a branded EqoFlow user public ID
function generateEqoFlowPublicId() {
    // Generate 12 random digits for uniqueness
    const randomDigits = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    return `eqoflow_${randomDigits}`;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Authenticate as admin
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }

        // Use service role to access all users
        const allUsers = await base44.asServiceRole.entities.User.list();
        const allDirectoryEntries = await base44.asServiceRole.entities.PublicUserDirectory.list();

        let updatedCount = 0;
        let skippedCount = 0;
        const errors = [];

        for (const currentUser of allUsers) {
            try {
                // Skip if user already has a public ID
                if (currentUser.user_public_id) {
                    skippedCount++;
                    continue;
                }

                // Generate a branded EqoFlow public ID
                let publicId = generateEqoFlowPublicId();
                
                // Ensure uniqueness by checking against existing IDs
                let isUnique = false;
                let attempts = 0;
                while (!isUnique && attempts < 10) {
                    const existingUser = allUsers.find(u => u.user_public_id === publicId);
                    const existingDirectory = allDirectoryEntries.find(d => d.user_public_id === publicId);
                    
                    if (!existingUser && !existingDirectory) {
                        isUnique = true;
                    } else {
                        publicId = generateEqoFlowPublicId();
                        attempts++;
                    }
                }

                if (!isUnique) {
                    errors.push({
                        userEmail: currentUser.email,
                        error: 'Could not generate unique ID after 10 attempts'
                    });
                    continue;
                }

                // Update User entity
                await base44.asServiceRole.entities.User.update(currentUser.id, {
                    user_public_id: publicId
                });

                // Find and update corresponding PublicUserDirectory entry
                const directoryEntry = allDirectoryEntries.find(
                    entry => entry.user_email === currentUser.email
                );

                if (directoryEntry) {
                    await base44.asServiceRole.entities.PublicUserDirectory.update(directoryEntry.id, {
                        user_public_id: publicId
                    });
                }

                updatedCount++;
            } catch (error) {
                errors.push({
                    userEmail: currentUser.email,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            message: `Successfully generated branded EqoFlow IDs for ${updatedCount} users`,
            updatedCount,
            skippedCount,
            totalUsers: allUsers.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error generating user public IDs:', error);
        return Response.json({ 
            error: error.message,
            success: false 
        }, { status: 500 });
    }
});