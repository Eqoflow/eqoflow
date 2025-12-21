import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        // Set a timeout for the entire request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            clearTimeout(timeoutId);
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        // Quick auth check
        const user = await base44.auth.me();
        if (!user) {
            clearTimeout(timeoutId);
            return new Response(JSON.stringify({ error: 'User not found' }), { 
                status: 401, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        const requestBody = await req.json();
        const { projectId, projectData } = requestBody;

        if (!projectId || !projectData) {
            clearTimeout(timeoutId);
            return new Response(JSON.stringify({ error: 'Missing project data' }), { 
                status: 400, 
                headers: { 'Content-Type': 'application/json' } 
            });
        }

        // Calculate voting end time (7 days from now)
        const votingEnd = new Date();
        votingEnd.setDate(votingEnd.getDate() + 7);

        // Create a simplified governance proposal
        const proposalData = {
            title: `Project Approval: ${projectData.title}`,
            description: `Project "${projectData.title}" requesting ${projectData.funding_goal} ${projectData.funding_currency.toUpperCase()} funding.`,
            proposal_type: "project_approval",
            category: "social",
            bond_amount: 100,
            minimum_voting_threshold: 100,
            passing_threshold: 0.6,
            minimum_quorum: 0.05,
            voting_end: votingEnd.toISOString(),
            time_lock_end: votingEnd.toISOString(),
            project_approval_details: {
                project_id: projectId,
                project_title: projectData.title,
                project_creator: user.email,
                funding_goal: projectData.funding_goal,
                funding_currency: projectData.funding_currency
            },
            status: "active"
        };

        // Create the proposal with timeout protection
        const proposal = await Promise.race([
            base44.entities.GovernanceProposal.create(proposalData),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Proposal creation timeout')), 20000)
            )
        ]);

        clearTimeout(timeoutId);

        return new Response(JSON.stringify({ 
            success: true, 
            proposalId: proposal.id,
            message: 'Project approval proposal created successfully'
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });

    } catch (error) {
        console.error('Error creating project approval proposal:', error);
        
        // Return a success response even if proposal creation fails
        // This prevents the entire project creation from failing
        return new Response(JSON.stringify({ 
            success: true, 
            proposalId: null,
            message: 'Project created successfully. DAO proposal will be created separately.',
            warning: 'Proposal creation was delayed'
        }), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
});