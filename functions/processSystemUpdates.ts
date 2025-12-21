import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

const QFLOW_TOKEN_PRICE_USD = 0.05;
const TOTAL_TOKEN_SUPPLY = 1000000000; // 1 billion tokens

/**
 * Checks active proposals and updates their status to 'passed' or 'failed'
 * based on voting results after the voting period ends.
 * Also handles project approval proposals by activating the associated projects.
 */
async function processProposalStatuses() {
    const activeProposals = await base44.entities.GovernanceProposal.filter({ status: 'active' });
    const now = new Date();
    let updatedCount = 0;

    for (const proposal of activeProposals) {
        if (now > new Date(proposal.voting_end)) {
            const totalVotesCast = (proposal.votes_for || 0) + (proposal.votes_against || 0) + (proposal.votes_abstain || 0);
            const votesForAndAgainst = (proposal.votes_for || 0) + (proposal.votes_against || 0);
            
            const quorumReached = (totalVotesCast / TOTAL_TOKEN_SUPPLY) >= (proposal.minimum_quorum || 0.1);
            const passThresholdMet = votesForAndAgainst > 0 ? ((proposal.votes_for || 0) / votesForAndAgainst) >= (proposal.passing_threshold || 0.5) : false;

            const newStatus = (quorumReached && passThresholdMet) ? 'passed' : 'failed';
            
            // Handle project approval proposals specifically
            if (proposal.proposal_type === 'project_approval' && proposal.project_approval_details) {
                const projectId = proposal.project_approval_details.project_id;
                
                if (newStatus === 'passed' && projectId) {
                    try {
                        // Activate the associated crowdsourcing project
                        await base44.entities.CrowdProject.update(projectId, { 
                            status: 'active',
                            approval_proposal_id: proposal.id
                        });
                        console.log(`Project ${projectId} activated after proposal ${proposal.id} passed.`);
                    } catch (error) {
                        console.error(`Error activating project ${projectId} after proposal approval:`, error);
                    }
                } else if (newStatus === 'failed' && projectId) {
                    try {
                        // Reject the associated crowdsourcing project
                        await base44.entities.CrowdProject.update(projectId, { 
                            status: 'rejected',
                            approval_proposal_id: proposal.id
                        });
                        console.log(`Project ${projectId} rejected after proposal ${proposal.id} failed.`);
                    } catch (error) {
                        console.error(`Error rejecting project ${projectId} after proposal failure:`, error);
                    }
                }
            }
            
            await base44.entities.GovernanceProposal.update(proposal.id, { status: newStatus });
            updatedCount++;
            console.log(`Proposal ${proposal.id} status updated to ${newStatus}.`);
        }
    }
    return updatedCount;
}

/**
 * Processes bonds for completed proposals. Returns bonds for passed/cancelled
 * proposals and forfeits bonds to the treasury for failed/vetoed ones.
 */
async function processProposalBonds() {
    const unprocessedProposals = await base44.entities.GovernanceProposal.filter({
        status: { $in: ['passed', 'failed', 'cancelled', 'vetoed'] },
        bond_processed: false
    });

    let processedCount = 0;

    for (const proposal of unprocessedProposals) {
        if (!proposal.bond_amount || proposal.bond_amount <= 0) {
            await base44.entities.GovernanceProposal.update(proposal.id, { bond_processed: true });
            continue;
        }

        const [creator] = await base44.entities.User.filter({ email: proposal.created_by });

        if (!creator) {
            console.error(`Creator ${proposal.created_by} not found for proposal ${proposal.id}, cannot process bond.`);
            await base44.entities.GovernanceProposal.update(proposal.id, { bond_processed: true });
            continue;
        }

        const newTokensOnHold = Math.max(0, (creator.tokens_on_hold || 0) - proposal.bond_amount);
        let userUpdatePayload = { tokens_on_hold: newTokensOnHold };

        if (proposal.status === 'passed' || proposal.status === 'cancelled') {
            const newBalance = (creator.token_balance || 0) + proposal.bond_amount;
            userUpdatePayload.token_balance = newBalance;
            console.log(`Returning ${proposal.bond_amount} bond for proposal ${proposal.id} to ${creator.email}.`);
        } else if (proposal.status === 'failed' || proposal.status === 'vetoed') {
            console.log(`Forfeiting ${proposal.bond_amount} bond for proposal ${proposal.id} from ${creator.email}.`);
            await base44.entities.DAOTreasury.create({
                transaction_type: 'deposit',
                source: `Forfeited Bond - Proposal ${proposal.id}`,
                amount_qflow: proposal.bond_amount,
                value_usd: proposal.bond_amount * QFLOW_TOKEN_PRICE_USD,
                notes: `Forfeited bond from failed proposal: "${proposal.title.substring(0, 50)}..." (Created by: ${creator.email})`
            });
        }
        
        await base44.entities.User.update(creator.id, userUpdatePayload);
        await base44.entities.GovernanceProposal.update(proposal.id, { bond_processed: true });
        processedCount++;
    }
    return processedCount;
}

/**
 * Checks active crowdsourcing projects and updates their status to 'funded' or 'failed'
 * after their deadline has passed.
 */
async function processCrowdsourcingProjects() {
    const activeProjects = await base44.entities.CrowdProject.filter({ status: 'active' });
    const now = new Date();
    let updatedCount = 0;

    for (const project of activeProjects) {
        if (now > new Date(project.deadline)) {
            const newStatus = (project.current_funding >= project.funding_goal) ? 'funded' : 'failed';
            
            await base44.entities.CrowdProject.update(project.id, { status: newStatus });
            updatedCount++;
            
            console.log(`Project ${project.id} "${project.title}" status updated to ${newStatus}. 
                        Goal: ${project.funding_goal} ${project.funding_currency}, 
                        Raised: ${project.current_funding} ${project.funding_currency}`);
        }
    }
    return updatedCount;
}

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            base44.auth.setToken(token);
        }

        console.log('Starting system updates...');
        
        // Process all automated updates
        const proposalStatusUpdates = await processProposalStatuses();
        const bondProcessedCount = await processProposalBonds();
        const projectStatusUpdates = await processCrowdsourcingProjects();

        const results = {
            success: true,
            timestamp: new Date().toISOString(),
            updates: {
                proposal_statuses_updated: proposalStatusUpdates,
                bonds_processed: bondProcessedCount,
                project_statuses_updated: projectStatusUpdates
            },
            message: `System updates completed successfully. ${proposalStatusUpdates} proposals updated, ${bondProcessedCount} bonds processed, ${projectStatusUpdates} projects updated.`
        };

        console.log('System updates completed:', results);

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('System update error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});