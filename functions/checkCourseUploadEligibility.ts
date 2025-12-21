import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
    const lastResetMonth = user.last_course_upload_reset?.slice(0, 7);

    // Reset counter if it's a new month
    let coursesUploadedThisMonth = user.courses_uploaded_this_month || 0;
    if (lastResetMonth !== currentMonth) {
      coursesUploadedThisMonth = 0;
      
      // Update user with reset counter
      await base44.asServiceRole.entities.User.update(user.id, {
        courses_uploaded_this_month: 0,
        last_course_upload_reset: now.toISOString()
      });
    }

    // Get plan limits
    const plan = user.course_upload_plan || 'free';
    const limits = {
      free: { monthly: 1, label: 'Free' },
      tutor: { monthly: 5, label: 'Tutor' },
      master: { monthly: Infinity, label: 'Master' }
    };

    const userLimit = limits[plan];
    const canUpload = coursesUploadedThisMonth < userLimit.monthly;
    const remaining = userLimit.monthly === Infinity 
      ? 'Unlimited' 
      : userLimit.monthly - coursesUploadedThisMonth;

    return Response.json({
      canUpload,
      currentPlan: plan,
      planLabel: userLimit.label,
      coursesUploadedThisMonth,
      monthlyLimit: userLimit.monthly,
      remaining,
      needsUpgrade: !canUpload
    });

  } catch (error) {
    console.error('Error checking course upload eligibility:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});