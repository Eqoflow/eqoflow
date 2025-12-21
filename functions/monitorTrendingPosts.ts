import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function can be called by admin or run on schedule
    // For now, we'll allow admin access for testing
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    console.log('🤖 Starting AI trending content analysis...');

    // Step 1: Fetch recent posts that haven't been fully analyzed yet
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const recentPosts = await base44.asServiceRole.entities.Post.filter({
      created_date: { $gt: twentyFourHoursAgo },
      privacy_level: 'public', // Only analyze public posts
      moderation_status: 'approved' // Only analyze approved posts
    }, '-created_date', 50); // Limit to 50 most recent posts

    console.log(`📊 Found ${recentPosts.length} recent posts to analyze`);

    // Step 2: Get all active AI branding categories for reference
    const activeCategories = await base44.asServiceRole.entities.AIBrandingCategory.filter({
      is_active: true
    });

    const categoryNames = activeCategories.map(cat => cat.name);
    console.log(`🏷️  Active categories: ${categoryNames.join(', ')}`);

    let alertsCreated = 0;
    let postsAnalyzed = 0;

    // Step 3: Process each post
    for (const post of recentPosts) {
      try {
        postsAnalyzed++;
        
        // Skip if already has suggested categories (already analyzed)
        if (!post.ai_suggested_categories || post.ai_suggested_categories.length === 0) {
          
          // Use LLM to analyze content and suggest categories
          console.log(`🧠 Analyzing post ${post.id} for categories...`);
          
          const analysisPrompt = `Analyze this social media post and determine which categories it belongs to.

POST CONTENT: "${post.content}"
POST TAGS: ${post.tags ? post.tags.join(', ') : 'None'}

AVAILABLE CATEGORIES: ${categoryNames.join(', ')}

Please return a JSON object with:
- "categories": An array of category names that best describe this content (maximum 3 categories)
- "confidence": A number from 0-100 indicating how confident you are in the categorization
- "reasoning": A brief explanation of why you chose these categories

Only use categories from the available list. If none fit well, return an empty categories array.`;

          try {
            const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
              prompt: analysisPrompt,
              response_json_schema: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: { type: "string" }
                  },
                  confidence: { type: "number" },
                  reasoning: { type: "string" }
                }
              }
            });

            console.log(`✅ LLM analysis for post ${post.id}:`, llmResponse);

            // Update post with AI suggested categories
            if (llmResponse.categories && llmResponse.categories.length > 0) {
              await base44.asServiceRole.entities.Post.update(post.id, {
                ai_suggested_categories: llmResponse.categories,
                ai_branding_status: 'trending' // Mark as being considered for branding
              });
            }

            // Add the AI response to the post for trending analysis
            post.ai_analysis = llmResponse;
            post.ai_suggested_categories = llmResponse.categories || [];

          } catch (llmError) {
            console.error(`❌ LLM analysis failed for post ${post.id}:`, llmError);
            continue;
          }
        }

        // Step 4: Calculate performance metrics and check for trending status
        const postAgeHours = (Date.now() - new Date(post.created_date).getTime()) / (1000 * 60 * 60);
        
        // Calculate velocity (engagements per hour)
        const totalEngagements = (post.likes_count || 0) + (post.comments_count || 0) + (post.reposts_count || 0);
        const velocity = postAgeHours > 0 ? totalEngagements / postAgeHours : totalEngagements;
        
        // Calculate engagement rate (if we have impression data)
        const engagementRate = post.impressions_count > 0 ? (totalEngagements / post.impressions_count) * 100 : 0;

        const performanceMetrics = {
          velocity: Math.round(velocity * 100) / 100,
          views: post.impressions_count || 0,
          shares: post.reposts_count || 0,
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          engagement_rate: Math.round(engagementRate * 100) / 100,
          total_engagements: totalEngagements
        };

        // Step 5: Determine if post is trending based on thresholds
        const isTrending = velocity > 5 || // More than 5 engagements per hour
                          totalEngagements > 50 || // More than 50 total engagements
                          (engagementRate > 10 && post.impressions_count > 100); // High engagement rate with decent reach

        if (isTrending && (post.ai_suggested_categories?.length > 0)) {
          console.log(`🔥 Post ${post.id} is trending! Velocity: ${velocity}, Total: ${totalEngagements}`);

          // Check if alert already exists
          const existingAlerts = await base44.asServiceRole.entities.TrendingContentAlert.filter({
            post_id: post.id
          });

          if (existingAlerts.length === 0) {
            // Create new trending content alert
            const alertData = {
              post_id: post.id,
              post_snapshot: {
                content_preview: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
                media_url: post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null
              },
              creator_email: post.created_by,
              suggested_category_ids: post.ai_suggested_categories,
              performance_metrics: performanceMetrics,
              status: 'new'
            };

            await base44.asServiceRole.entities.TrendingContentAlert.create(alertData);
            alertsCreated++;
            
            console.log(`🚨 Created trending alert for post ${post.id} by ${post.created_by}`);
          } else {
            // Update existing alert with latest metrics
            await base44.asServiceRole.entities.TrendingContentAlert.update(existingAlerts[0].id, {
              performance_metrics: performanceMetrics,
              suggested_category_ids: post.ai_suggested_categories
            });
            
            console.log(`📈 Updated trending alert for post ${post.id}`);
          }
        }

      } catch (postError) {
        console.error(`❌ Error processing post ${post.id}:`, postError);
        continue;
      }
    }

    const response = {
      success: true,
      message: `AI trending analysis complete`,
      stats: {
        posts_analyzed: postsAnalyzed,
        alerts_created: alertsCreated,
        active_categories: categoryNames.length
      },
      timestamp: new Date().toISOString()
    };

    console.log('🎉 AI trending analysis complete:', response);
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Error in monitorTrendingPosts:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to monitor trending posts',
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});