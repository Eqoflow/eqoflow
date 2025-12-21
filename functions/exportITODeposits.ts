import { createClientFromRequest } from 'npm:@base44/sdk@0.7.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        // Fetch all ITO transactions
        const transactions = await base44.asServiceRole.entities.ITOTransaction.list('-created_date');
        
        if (transactions.length === 0) {
            return Response.json({ error: 'No transactions found to export' }, { status: 404 });
        }

        // Create CSV headers
        const headers = [
            'Transaction Hash',
            'From Address', 
            'Amount USDC',
            'Token Price',
            'Tokens Allocated',
            'Phase Name',
            'Status',
            'Claimed',
            'Created Date'
        ];

        // Create CSV rows
        const rows = transactions.map(tx => [
            tx.transaction_hash || '',
            tx.from_address || '',
            tx.amount_usdc || 0,
            tx.token_price_at_deposit || 0,
            tx.tokens_allocated || 0,
            tx.phase_name || '',
            tx.status || '',
            tx.claimed ? 'Yes' : 'No',
            new Date(tx.created_date).toISOString().split('T')[0] // Date only
        ]);

        // Generate CSV content
        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        // Return CSV file
        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="ito-deposits-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error) {
        console.error('Error exporting ITO deposits:', error);
        return Response.json({ 
            error: error.message || 'Failed to export deposits' 
        }, { status: 500 });
    }
});