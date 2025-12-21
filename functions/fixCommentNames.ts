import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Admin-only function
        const currentUser = await base44.auth.me();
        if (!currentUser || currentUser.role !== 'admin') {
            return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
        }

        console.log('Starting comment name fix...');

        // Get all comments
        const allComments = await base44.asServiceRole.entities.Comment.list('-created_date', 10000);
        console.log(`Found ${allComments.length} total comments`);

        // Filter comments that need fixing (missing author_full_name or author_username)
        const commentsToFix = allComments.filter(comment => 
            !comment.author_full_name || !comment.author_username
        );

        console.log(`Found ${commentsToFix.length} comments to fix`);

        if (commentsToFix.length === 0) {
            return Response.json({ 
                success: true, 
                message: 'All comments already have proper author names',
                fixed: 0
            });
        }

        // Get unique author emails
        const authorEmails = [...new Set(commentsToFix.map(c => c.created_by))];
        console.log(`Fetching data for ${authorEmails.length} unique authors`);

        // Fetch all authors' data
        const authors = await base44.asServiceRole.entities.User.filter({
            email: { $in: authorEmails }
        });

        // Create a map of email -> user data
        const authorMap = {};
        authors.forEach(author => {
            authorMap[author.email] = {
                full_name: author.full_name || author.email.split('@')[0],
                username: author.username || author.email.split('@')[0],
                avatar_url: author.avatar_url || ''
            };
        });

        // Update comments in small batches with delays to avoid rate limiting
        let fixedCount = 0;
        const batchSize = 10; // Smaller batch size
        const delayBetweenBatches = 1000; // 1 second delay between batches

        for (let i = 0; i < commentsToFix.length; i += batchSize) {
            const batch = commentsToFix.slice(i, i + batchSize);
            
            // Process each comment in batch sequentially to avoid rate limits
            for (const comment of batch) {
                try {
                    const authorData = authorMap[comment.created_by];
                    
                    if (!authorData) {
                        console.warn(`No user found for comment ${comment.id} by ${comment.created_by}`);
                        // Use email fallback
                        const fallbackName = comment.created_by.split('@')[0];
                        await base44.asServiceRole.entities.Comment.update(comment.id, {
                            author_full_name: fallbackName,
                            author_username: fallbackName,
                            author_avatar_url: ''
                        });
                    } else {
                        await base44.asServiceRole.entities.Comment.update(comment.id, {
                            author_full_name: authorData.full_name,
                            author_username: authorData.username,
                            author_avatar_url: authorData.avatar_url
                        });
                    }
                    
                    fixedCount++;
                    
                    // Small delay between each update
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(`Error updating comment ${comment.id}:`, error.message);
                    // Continue with next comment even if one fails
                }
            }
            
            console.log(`Fixed ${fixedCount}/${commentsToFix.length} comments`);
            
            // Delay between batches
            if (i + batchSize < commentsToFix.length) {
                await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
        }

        return Response.json({
            success: true,
            message: `Successfully fixed ${fixedCount} comments`,
            fixed: fixedCount,
            total: allComments.length
        });

    } catch (error) {
        console.error('Error fixing comment names:', error);
        return Response.json({ 
            error: error.message,
            stack: error.stack 
        }, { status: 500 });
    }
});