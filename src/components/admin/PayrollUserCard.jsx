
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    ChevronDown,
    ChevronUp,
    Copy,
    CheckCircle,
    Wallet,
    Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function PayrollUserCard({ creatorData, onMarkAsPaid }) {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState('');

    const { user, totalRevenue, totalPlatformFees, totalPayoutDue, transactions } = creatorData;
    
    const handleCopy = (textToCopy, field) => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(field);
        setTimeout(() => setCopied(''), 2000);
    };
    
    return (
        <Card className="dark-card border-purple-500/20">
            <CardHeader 
                className="flex flex-row items-center justify-between cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <img src={user.avatar_url || 'https://via.placeholder.com/40'} alt={user.full_name} className="w-12 h-12 rounded-full" />
                    <div>
                        <CardTitle className="text-white text-lg">{user.full_name}</CardTitle>
                        <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-green-400">Payout Due</p>
                    <p className="text-2xl font-bold text-white">
                        £{totalPayoutDue.toFixed(2)}
                    </p>
                </div>
                <Button variant="ghost" size="icon">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>
            </CardHeader>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <CardContent className="pt-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-black/20 rounded-lg">
                                    <p className="text-sm text-gray-400">Total Revenue</p>
                                    <p className="text-xl font-bold text-white">£{totalRevenue.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-black/20 rounded-lg">
                                    <p className="text-sm text-gray-400">Platform Fees</p>
                                    <p className="text-xl font-bold text-white">£{totalPlatformFees.toFixed(2)}</p>
                                </div>
                                <div className="p-4 bg-green-900/30 rounded-lg border border-green-500/30">
                                    <p className="text-sm text-green-400">Total Payout Due</p>
                                    <p className="text-xl font-bold text-white">£{totalPayoutDue.toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-md font-semibold text-white">Payout Details</h4>
                                
                                {user.solana_wallet_address && (
                                    <div className="p-3 bg-black/20 rounded-lg flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-purple-400"/>
                                            <span className="text-sm text-gray-300 truncate font-mono">
                                                {user.solana_wallet_address}
                                            </span>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => handleCopy(user.solana_wallet_address, 'solana')}>
                                            {copied === 'solana' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                )}

                                {user.bank_payout_details && (
                                     <div className="p-3 bg-black/20 rounded-lg space-y-2">
                                        <div className="flex items-center gap-2 text-white font-semibold">
                                            <Banknote className="w-4 h-4 text-green-400" />
                                            Bank Details
                                        </div>
                                        <p className="text-sm text-gray-300"><strong>Holder:</strong> {user.bank_payout_details.account_holder_name}</p>
                                        <p className="text-sm text-gray-300"><strong>Bank:</strong> {user.bank_payout_details.bank_name}</p>
                                        {user.bank_payout_details.account_number && <p className="text-sm text-gray-300"><strong>Acc No:</strong> {user.bank_payout_details.account_number}</p>}
                                        {user.bank_payout_details.sort_code && <p className="text-sm text-gray-300"><strong>Sort Code:</strong> {user.bank_payout_details.sort_code}</p>}
                                        {user.bank_payout_details.iban && <p className="text-sm text-gray-300"><strong>IBAN:</strong> {user.bank_payout_details.iban}</p>}
                                        {user.bank_payout_details.bic_swift && <p className="text-sm text-gray-300"><strong>BIC/SWIFT:</strong> {user.bank_payout_details.bic_swift}</p>}
                                     </div>
                                )}

                                <div className="flex flex-col md:flex-row gap-4">
                                    {user.square_connect_link && (
                                        <div className="flex-1 p-3 bg-black/20 rounded-lg flex items-center justify-between">
                                            <span className="text-sm text-gray-300 truncate">
                                                Square: {user.square_connect_link}
                                            </span>
                                            <Button size="sm" variant="ghost" onClick={() => handleCopy(user.square_connect_link, 'square')}>
                                                {copied === 'square' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    )}
                                     {user.stripe_payment_link && (
                                        <div className="flex-1 p-3 bg-black/20 rounded-lg flex items-center justify-between">
                                            <span className="text-sm text-gray-300 truncate">
                                                Stripe: {user.stripe_payment_link}
                                            </span>
                                            <Button size="sm" variant="ghost" onClick={() => handleCopy(user.stripe_payment_link, 'stripe')}>
                                                {copied === 'stripe' ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                 {!user.square_connect_link && !user.stripe_payment_link && !user.solana_wallet_address && !user.bank_payout_details && (
                                    <p className="text-sm text-yellow-400">No payout links provided by user.</p>
                                 )}
                            </div>

                            <div>
                                <h4 className="text-md font-semibold text-white mb-2">Transaction History</h4>
                                <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Item</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Buyer</TableHead>
                                            <TableHead>Total</TableHead>
                                            <TableHead>Payout</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map(tx => (
                                            <TableRow key={tx.id}>
                                                <TableCell>{format(new Date(tx.created_date), 'dd MMM yyyy')}</TableCell>
                                                <TableCell className="font-medium">{tx.item_title}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">{tx.item_type.replace('_', ' ')}</Badge>
                                                </TableCell>
                                                <TableCell>{tx.buyer_email}</TableCell>
                                                <TableCell>£{tx.amount_total.toFixed(2)}</TableCell>
                                                <TableCell className="text-green-400">£{tx.amount_seller_payout.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        tx.payout_status === 'paid' ? 'bg-green-600/20 text-green-400' :
                                                        tx.payout_status === 'due' ? 'bg-yellow-600/20 text-yellow-400' :
                                                        'bg-gray-600/20 text-gray-400'
                                                    }>
                                                        {tx.payout_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {tx.payout_status === 'due' ? (
                                                        <Button size="sm" onClick={() => onMarkAsPaid(tx.id)}>Mark as Paid</Button>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">Paid</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            </div>
                        </CardContent>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
