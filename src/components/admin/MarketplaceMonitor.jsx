
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QuantumFlowLoader from '../layout/QuantumFlowLoader';
import WorkroomChatViewer from './WorkroomChatViewer';
import { Search, Eye, MessageSquare, DollarSign, AlertTriangle, Shield, Clock, X, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
// Ensure this path is correct based on your project structure

export default function MarketplaceMonitor() {
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // New state variables for disputes and unified filtering/modal management
  const [disputes, setDisputes] = useState([]);
  const [filteredDisputes, setFilteredDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedTransactionForChatModal, setSelectedTransactionForChatModal] = useState(null);
  const [showChatViewerModal, setShowChatViewerModal] = useState(false);

  // Unified search and filter state for the active tab
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // This will adapt its options based on activeTab
  const [activeTab, setActiveTab] = useState('conversations'); // Default tab

  // Effect to load all data initially
  useEffect(() => {
    loadData();
  }, []);

  // Effect to re-apply filters when search term, filter status, active tab, or underlying data changes
  useEffect(() => {
    // Reset search and filter when tab changes to avoid carrying over irrelevant filters
    if (activeTab === 'conversations') {
      applyConversationFilters();
    } else if (activeTab === 'transactions') {
      applyTransactionFilters();
    } else if (activeTab === 'disputes') {
      applyDisputeFilters();
    }
  }, [searchTerm, filterStatus, activeTab, conversations, transactions, disputes]);

  // Combined data loading function
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Use regular entity calls - admins have access via RLS
      const [allMessagesRaw, txsRaw, disputeDataRaw] = await Promise.all([
        base44.entities.SkillsMarketplaceMessage.list('-created_date', 1000),
        base44.entities.MarketplaceTransaction.filter({ item_type: 'skill' }, '-created_date', 200),
        base44.entities.SkillDispute.filter({}, '-created_date')
      ]);

      setTransactions(txsRaw);
      setDisputes(disputeDataRaw);

      // Process conversations using fetched messages and transactions
      const conversationsMap = new Map();
      for (const msg of allMessagesRaw) {
        if (!conversationsMap.has(msg.conversation_id)) {
          conversationsMap.set(msg.conversation_id, {
            id: msg.conversation_id,
            participants: [msg.sender_email, msg.recipient_email],
            participantNames: {
              [msg.sender_email]: msg.sender_name,
              [msg.recipient_email]: msg.recipient_name
            },
            participantAvatars: {
              [msg.sender_email]: msg.sender_avatar,
              [msg.recipient_email]: msg.recipient_avatar
            },
            skillId: msg.skill_id,
            skillTitle: msg.skill_title,
            lastMessage: msg.message_content,
            lastMessageTime: msg.created_date,
            messageCount: 0,
            hasTransaction: false,
            transactionId: null,
            transactionStatus: null,
            transactionAmount: null
          });
        }
        const conv = conversationsMap.get(msg.conversation_id);
        conv.messageCount++;
        if (new Date(msg.created_date) > new Date(conv.lastMessageTime)) {
          conv.lastMessage = msg.message_content;
          conv.lastMessageTime = msg.created_date;
        }
        conv.participantNames[msg.sender_email] = msg.sender_name;
        conv.participantNames[msg.recipient_email] = msg.recipient_name;
        conv.participantAvatars[msg.sender_email] = msg.sender_avatar;
        conv.participantAvatars[msg.recipient_email] = msg.recipient_avatar;
      }

      // Link transactions to conversations
      for (const tx of txsRaw) {
        for (const conv of conversationsMap.values()) {
          const isParticipantMatch = conv.participants.includes(tx.buyer_email) && conv.participants.includes(tx.seller_email);
          if (isParticipantMatch && conv.skillId === tx.item_id) { // More precise match with skill ID
            conv.hasTransaction = true;
            conv.transactionId = tx.id;
            conv.transactionStatus = tx.status;
            conv.transactionAmount = tx.amount_total;
            break;
          }
        }
      }

      const conversationsList = Array.from(conversationsMap.values()).sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
      setConversations(conversationsList);

    } catch (error) {
      console.error("Error loading marketplace data:", error);
      alert('Failed to load marketplace data. Please make sure you are logged in as an admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyConversationFilters = () => {
    let results = conversations;

    if (filterStatus === 'with_transaction') {
      results = results.filter((c) => c.hasTransaction);
    } else if (filterStatus === 'no_transaction') {
      results = results.filter((c) => !c.hasTransaction);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      results = results.filter((c) =>
        c.participants.some((email) => email.toLowerCase().includes(lowercasedTerm)) ||
        Object.values(c.participantNames).some((name) => name?.toLowerCase().includes(lowercasedTerm)) ||
        c.skillTitle?.toLowerCase().includes(lowercasedTerm) ||
        c.id.toLowerCase().includes(lowercasedTerm)
      );
    }
    setFilteredConversations(results);
  };

  const applyTransactionFilters = () => {
    let results = transactions;

    if (filterStatus !== 'all') {
      results = results.filter((tx) => tx.status === filterStatus);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      results = results.filter((tx) =>
        tx.buyer_email.toLowerCase().includes(lowercasedTerm) ||
        tx.seller_email.toLowerCase().includes(lowercasedTerm) ||
        tx.item_title?.toLowerCase().includes(lowercasedTerm) ||
        tx.id.toLowerCase().includes(lowercasedTerm)
      );
    }
    setFilteredTransactions(results);
  };

  const applyDisputeFilters = () => {
    let results = disputes;

    if (filterStatus !== 'all') {
      results = results.filter((dispute) => dispute.status === filterStatus);
    }

    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      results = results.filter((dispute) =>
        dispute.skill_title?.toLowerCase().includes(lowercasedTerm) ||
        dispute.complainant_email?.toLowerCase().includes(lowercasedTerm) ||
        dispute.respondent_email?.toLowerCase().includes(lowercasedTerm) ||
        dispute.id.toLowerCase().includes(lowercasedTerm) ||
        dispute.transaction_id?.toLowerCase().includes(lowercasedTerm)
      );
    }
    setFilteredDisputes(results);
  };

  const handleResolveDispute = async (disputeId, resolution, refundAmount = 0) => {
    if (!confirm(`Are you sure you want to resolve this dispute as: ${resolution.replace(/_/g, ' ').toUpperCase()}?`)) return;

    try {
      const disputeToResolve = disputes.find((d) => d.id === disputeId);
      if (!disputeToResolve) {
        alert('Dispute not found.');
        return;
      }
      const transactionToUpdate = transactions.find((t) => t.id === disputeToResolve.transaction_id);
      if (!transactionToUpdate) {
        alert('Associated transaction not found.');
        return;
      }

      const updateDisputePayload = {
        status: resolution,
        resolved_by: (await base44.auth.me()).email, // Assuming user is logged in
        resolved_at: new Date().toISOString()
      };

      let finalRefundAmount = refundAmount;

      if (resolution === 'resolved_refund_buyer') {
        finalRefundAmount = transactionToUpdate.amount_total; // Full refund amount
        updateDisputePayload.refund_amount = finalRefundAmount;
      } else if (resolution === 'resolved_partial_refund') {
        updateDisputePayload.refund_amount = finalRefundAmount;
      }

      await base44.entities.SkillDispute.update(disputeId, updateDisputePayload);

      let newTxStatus = transactionToUpdate.status;
      let newTxNotes = transactionToUpdate.notes || '';

      if (resolution === 'resolved_refund_buyer' || resolution === 'resolved_partial_refund') {
        newTxStatus = 'refunded';
        newTxNotes += `\n\n[${new Date().toISOString()}] Dispute resolved: Refunded buyer (amount: $${finalRefundAmount.toFixed(2)})`;
      } else if (resolution === 'resolved_pay_seller') {
        newTxStatus = 'completed';
        newTxNotes += `\n\n[${new Date().toISOString()}] Dispute resolved: Transaction completed, seller paid.`;
      } else if (resolution === 'closed_no_action') {
        newTxNotes += `\n\n[${new Date().toISOString()}] Dispute closed with no action.`;
      }

      await base44.entities.MarketplaceTransaction.update(transactionToUpdate.id, {
        status: newTxStatus,
        notes: newTxNotes
      });

      alert('✅ Dispute resolved successfully!');
      setShowDisputeModal(false);
      setSelectedDispute(null);
      await loadData(); // Reload all data to reflect changes
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert(`Failed to resolve dispute: ${error.message || error}`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      held_in_escrow: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      release_to_seller: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      completed: "bg-green-500/20 text-green-400 border-green-500/30",
      disputed: "bg-red-500/20 text-red-400 border-red-500/30",
      refunded: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      cancelled: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      // Dispute specific statuses
      open: "bg-red-500/20 text-red-400 border-red-500/30",
      under_review: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      resolved_refund_buyer: "bg-green-500/20 text-green-400 border-green-500/30",
      resolved_pay_seller: "bg-green-500/20 text-green-400 border-green-500/30",
      resolved_partial_refund: "bg-green-500/20 text-green-400 border-green-500/30",
      closed_no_action: "bg-gray-500/20 text-gray-400 border-gray-500/30"
    };
    return colors[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
  };

  const openDisputesCount = disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length;


  if (isLoading) {
    return <QuantumFlowLoader message="Loading Marketplace Data..." />;
  }

  return (
    <div className="bg-black space-y-6 p-6 min-h-screen">
      <Card className="dark-card bg-slate-950/80">
        <CardHeader>
          <CardTitle className="text-white">Skills Marketplace Monitor</CardTitle>
          <p className="text-gray-400">Oversee all conversations, transactions, and disputes in the Skills Marketplace.</p>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="dark-card bg-slate-950/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Transactions</p>
              <p className="text-2xl font-bold text-white">{transactions.length}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </CardContent>
        </Card>

        <Card className="dark-card bg-slate-950/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">In Escrow</p>
              <p className="text-2xl font-bold text-white">
                {transactions.filter((t) => t.status === 'held_in_escrow').length}
              </p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </CardContent>
        </Card>

        <Card className="dark-card bg-slate-950/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Pending Payout</p>
              <p className="text-2xl font-bold text-white">
                {transactions.filter((t) => t.status === 'release_to_seller' || t.status === 'completed' && !t.payout_processed).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </CardContent>
        </Card>

        <Card className="dark-card bg-slate-950/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Open Disputes</p>
              <p className="text-2xl font-bold text-white">{openDisputesCount}</p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${openDisputesCount > 0 ? 'text-red-400' : 'text-gray-600'}`} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="conversations" value={activeTab} onValueChange={(value) => {
        setActiveTab(value);
        setSearchTerm(''); // Clear search when switching tabs
        setFilterStatus('all'); // Reset filter when switching tabs
      }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 dark-card bg-slate-950/80">
          <TabsTrigger value="conversations">
            <MessageSquare className="w-4 h-4 mr-2" />
            Conversations ({conversations.length})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <DollarSign className="w-4 h-4 mr-2" />
            Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="disputes" className="relative">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Disputes ({disputes.length})
            {openDisputesCount > 0 &&
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white z-10">
                {openDisputesCount}
              </span>
            }
          </TabsTrigger>
        </TabsList>

        {/* CONVERSATIONS TAB */}
        <TabsContent value="conversations" className="space-y-6">
          <Card className="dark-card bg-slate-950/80">
            <CardContent className="bg-slate-950 pt-6 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by user, skill, or conversation ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border-gray-700 pl-10 text-white" />

                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[220px] bg-slate-900 border-gray-700 text-white">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    <SelectItem value="all" className="hover:bg-gray-800">All Conversations</SelectItem>
                    <SelectItem value="with_transaction" className="hover:bg-gray-800">With Transaction</SelectItem>
                    <SelectItem value="no_transaction" className="hover:bg-gray-800">No Transaction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="bg-slate-950 grid lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card className="dark-card bg-slate-950/80 h-[70vh] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Conversations ({filteredConversations.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto pr-2 space-y-2">
                  {filteredConversations.map((conv) =>
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-3 rounded-lg cursor-pointer border transition-all ${
                        selectedConversation?.id === conv.id ?
                          'bg-purple-500/10 border-purple-500' :
                          'bg-slate-900 border-gray-700 hover:border-purple-600'}`
                      }>

                      <div className="flex items-start gap-3">
                        <div className="flex -space-x-2">
                          {conv.participants.slice(0, 2).map((email) =>
                            <div key={email} className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center border-2 border-gray-800">
                              {conv.participantAvatars[email] ?
                                <img
                                  src={conv.participantAvatars[email]}
                                  alt={conv.participantNames[email]}
                                  className="w-full h-full rounded-full object-cover" /> :


                                <span className="text-white text-xs">
                                  {conv.participantNames[email]?.[0]?.toUpperCase() || '?'}
                                </span>
                              }
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-white text-sm truncate">
                              {conv.participants.map((email) => conv.participantNames[email] || email).join(' & ')}
                            </p>
                            {conv.hasTransaction &&
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs ml-2">
                                Transaction
                              </Badge>
                            }
                          </div>

                          {conv.skillTitle &&
                            <p className="text-xs text-purple-400 truncate mb-1">
                              Re: {conv.skillTitle}
                            </p>
                          }

                          <p className="text-xs text-gray-400 truncate">
                            {conv.lastMessage}
                          </p>

                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">
                              {conv.messageCount} message{conv.messageCount !== 1 ? 's' : ''}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(conv.lastMessageTime), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {filteredConversations.length === 0 &&
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No conversations found</p>
                    </div>
                  }
                </CardContent>
              </Card>
            </div>

            {/* Conversation Details */}
            <div className="lg:col-span-2">
              {selectedConversation ?
                <div className="space-y-6">
                  <Card className="dark-card bg-slate-950/80">
                    <CardHeader>
                      <CardTitle className="text-white">Conversation Details</CardTitle>
                      <p className="text-xs text-gray-500">ID: {selectedConversation.id}</p>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Participants</span>
                        <span className="text-white">
                          {selectedConversation.participants.map((email) => selectedConversation.participantNames[email] || email).join(' & ')}
                        </span>
                      </div>

                      {selectedConversation.skillTitle &&
                        <div className="flex justify-between">
                          <span className="text-gray-400">Skill</span>
                          <span className="text-white">{selectedConversation.skillTitle}</span>
                        </div>
                      }

                      <div className="flex justify-between">
                        <span className="text-gray-400">Messages</span>
                        <span className="text-white">{selectedConversation.messageCount}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Activity</span>
                        <span className="text-white">{format(new Date(selectedConversation.lastMessageTime), 'PPpp')}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Has Transaction</span>
                        <Badge className={selectedConversation.hasTransaction ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                          {selectedConversation.hasTransaction ? 'Yes' : 'No'}
                        </Badge>
                      </div>

                      {selectedConversation.hasTransaction &&
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Transaction Status</span>
                            <Badge className={`${getStatusColor(selectedConversation.transactionStatus)} capitalize`}>
                              {selectedConversation.transactionStatus?.replace(/_/g, ' ')}
                            </Badge>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">Transaction Amount</span>
                            <span className="text-white font-bold">${selectedConversation.transactionAmount?.toFixed(2)}</span>
                          </div>
                        </>
                      }
                    </CardContent>
                  </Card>

                  <Card className="dark-card bg-slate-950/80">
                    <CardHeader>
                      <CardTitle className="text-white">Chat History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <WorkroomChatViewer
                        conversationId={selectedConversation.id}
                        isMarketplaceMonitor={true} />

                    </CardContent>
                  </Card>
                </div> :

                <Card className="dark-card bg-slate-950/80 h-[70vh] flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Eye className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white">Select a Conversation</h3>
                    <p>Choose a conversation from the list to view details and chat history.</p>
                  </div>
                </Card>
              }
            </div>
          </div>
        </TabsContent>

        {/* TRANSACTIONS TAB */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="dark-card bg-slate-950/80">
            <CardContent className="bg-slate-950 pt-6 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by buyer, seller, skill, or transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border-gray-700 pl-10 text-white" />

                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[220px] bg-slate-900 border-gray-700 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    <SelectItem value="all" className="hover:bg-gray-800">All Statuses</SelectItem>
                    <SelectItem value="pending_payment" className="hover:bg-gray-800">Pending Payment</SelectItem>
                    <SelectItem value="held_in_escrow" className="hover:bg-gray-800">Held in Escrow</SelectItem>
                    <SelectItem value="release_to_seller" className="hover:bg-gray-800">Release to Seller</SelectItem>
                    <SelectItem value="completed" className="hover:bg-gray-800">Completed</SelectItem>
                    <SelectItem value="disputed" className="hover:bg-gray-800">Disputed</SelectItem>
                    <SelectItem value="refunded" className="hover:bg-gray-800">Refunded</SelectItem>
                    <SelectItem value="cancelled" className="hover:bg-gray-800">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="bg-slate-950 grid lg:grid-cols-3 gap-6">
            {/* Transactions List */}
            <div className="lg:col-span-1">
              <Card className="dark-card bg-slate-950/80 h-[70vh] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Transactions ({filteredTransactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-y-auto pr-2 space-y-2">
                  {filteredTransactions.map((tx) =>
                    <div
                      key={tx.id}
                      onClick={() => setSelectedTransaction(tx)}
                      className={`p-3 rounded-lg cursor-pointer border transition-all ${
                        selectedTransaction?.id === tx.id ?
                          'bg-purple-500/10 border-purple-500' :
                          'bg-slate-900 border-gray-700 hover:border-purple-600'}`
                      }>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-white text-sm truncate">
                            {tx.item_title}
                          </p>
                          <Badge className={`${getStatusColor(tx.status)} text-xs capitalize`}>
                            {tx.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>

                        <div className="text-xs text-gray-400">
                          <p>Buyer: {tx.buyer_email.split('@')[0]}</p>
                          <p>Seller: {tx.seller_email.split('@')[0]}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-green-400">
                            ${tx.amount_total.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(tx.created_date), 'MMM d')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {filteredTransactions.length === 0 &&
                    <div className="text-center py-12 text-gray-500">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No transactions found</p>
                    </div>
                  }
                </CardContent>
              </Card>
            </div>

            {/* Transaction Details */}
            <div className="lg:col-span-2">
              {selectedTransaction ? (
                <div className="space-y-6">
                  <Card className="dark-card bg-slate-950/80">
                    <CardHeader>
                      <CardTitle className="text-white">Transaction Details</CardTitle>
                      <p className="text-xs text-gray-500">ID: {selectedTransaction.id}</p>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Skill</span>
                        <span className="text-white">{selectedTransaction.item_title}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Buyer</span>
                        <span className="text-white">{selectedTransaction.buyer_email}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Seller</span>
                        <span className="text-white">{selectedTransaction.seller_email}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Amount</span>
                        <span className="text-white font-bold">${selectedTransaction.amount_total.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Platform Fee</span>
                        <span className="text-white">${selectedTransaction.amount_platform_fee?.toFixed(2) || '0.00'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Seller Payout</span>
                        <span className="text-white">${selectedTransaction.amount_seller_payout?.toFixed(2) || '0.00'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Status</span>
                        <Badge className={`${getStatusColor(selectedTransaction.status)} capitalize`}>
                          {selectedTransaction.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Currency</span>
                        <span className="text-white uppercase">{selectedTransaction.currency}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment Processor</span>
                        <span className="text-white capitalize">{selectedTransaction.payment_processor}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">Created</span>
                        <span className="text-white">{format(new Date(selectedTransaction.created_date), 'PPpp')}</span>
                      </div>

                      {selectedTransaction.notes &&
                        <div className="flex justify-between">
                          <span className="text-gray-400">Notes</span>
                          <span className="text-white">{selectedTransaction.notes}</span>
                        </div>
                      }
                    </CardContent>
                  </Card>

                  {/* Workroom Chat for Transaction */}
                  <Card className="dark-card bg-slate-950/80">
                    <CardHeader>
                      <CardTitle className="text-white">Workroom Chat</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <WorkroomChatViewer
                        transactionId={selectedTransaction.id}
                        isMarketplaceMonitor={true} // Changed from false to true
                      />
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="dark-card bg-slate-950/80 h-[70vh] flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Eye className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white">Select a Transaction</h3>
                    <p>Choose a transaction from the list to view details and chat history.</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* DISPUTES TAB */}
        <TabsContent value="disputes" className="space-y-6">
          <Card className="dark-card bg-slate-950/80">
            <CardContent className="bg-slate-950 pt-6 p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by skill, complainant, respondent, or dispute ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border-gray-700 pl-10 text-white" />

                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[220px] bg-slate-900 border-gray-700 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700 text-white">
                    <SelectItem value="all" className="hover:bg-gray-800">All Statuses</SelectItem>
                    <SelectItem value="open" className="hover:bg-gray-800">Open</SelectItem>
                    <SelectItem value="under_review" className="hover:bg-gray-800">Under Review</SelectItem>
                    <SelectItem value="resolved_refund_buyer" className="hover:bg-gray-800">Resolved - Refund Buyer</SelectItem>
                    <SelectItem value="resolved_pay_seller" className="hover:bg-gray-800">Resolved - Pay Seller</SelectItem>
                    <SelectItem value="resolved_partial_refund" className="hover:bg-gray-800">Resolved - Partial Refund</SelectItem>
                    <SelectItem value="closed_no_action" className="hover:bg-gray-800">Closed - No Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {filteredDisputes.length === 0 ?
              <Card className="dark-card bg-slate-950/80 p-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400">No disputes found matching your criteria.</p>
              </Card> :

              filteredDisputes.map((dispute) =>
                <Card key={dispute.id} className="dark-card bg-slate-950/80 hover:border-red-500/30 transition-colors">
                  <CardContent className="bg-slate-950 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">{dispute.skill_title}</h3>
                          <Badge className={`${getStatusColor(dispute.status)} capitalize`}>
                            {dispute.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400 mb-3">
                          <div>
                            <p><strong>Complainant ({dispute.complainant_role}):</strong></p>
                            <p className="text-white">{dispute.complainant_email}</p>
                          </div>
                          <div>
                            <p><strong>Respondent:</strong></p>
                            <p className="text-white">{dispute.respondent_email}</p>
                          </div>
                          <div>
                            <p><strong>Reason:</strong></p>
                            <p className="text-white capitalize">{dispute.dispute_reason.replace(/_/g, ' ')}</p>
                          </div>
                          <div>
                            <p><strong>Opened:</strong></p>
                            <p className="text-white">{format(new Date(dispute.created_date), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                        <div className="bg-black/30 p-3 rounded-lg">
                          <p className="text-sm text-gray-300"><strong>Details:</strong> {dispute.dispute_details}</p>
                        </div>
                        {dispute.evidence_urls && dispute.evidence_urls.length > 0 &&
                          <div className="mt-2">
                            <p className="text-sm text-gray-400">Evidence files: {dispute.evidence_urls.length}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {dispute.evidence_urls.map((url, index) =>
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-xs truncate max-w-[150px] block">

                                  File {index + 1}
                                </a>
                              )}
                            </div>
                          </div>
                        }
                      </div>
                    </div>

                    {(dispute.status === 'open' || dispute.status === 'under_review') &&
                      <div className="flex flex-col sm:flex-row gap-2 mt-4 border-t border-gray-700 pt-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setShowDisputeModal(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700">

                          Review & Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const tx = transactions.find((t) => t.id === dispute.transaction_id);
                            if (tx) {
                              setSelectedTransactionForChatModal(tx);
                              setShowChatViewerModal(true);
                            } else {
                              alert("Associated transaction not found for chat history.");
                            }
                          }} className="bg-background text-slate-950 px-3 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-9 border-gray-600 hover:bg-gray-800">


                          View Chat History
                        </Button>
                      </div>
                    }
                  </CardContent>
                </Card>
              )
            }
          </div>
        </TabsContent>
      </Tabs>

      {/* Chat Viewer Modal (for disputes) */}
      {showChatViewerModal && selectedTransactionForChatModal &&
        <Dialog open={showChatViewerModal} onOpenChange={(open) => {
          setShowChatViewerModal(open);
          if (!open) setSelectedTransactionForChatModal(null); // Clear state when closing
        }}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-slate-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Chat History for {selectedTransactionForChatModal.item_title}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
              <WorkroomChatViewer
                transactionId={selectedTransactionForChatModal.id}
                isMarketplaceMonitor={true} />

            </div>
          </DialogContent>
        </Dialog>
      }

      {/* Dispute Resolution Modal */}
      {showDisputeModal && selectedDispute &&
        <Dialog open={showDisputeModal} onOpenChange={(open) => {
          setShowDisputeModal(open);
          if (!open) setSelectedDispute(null); // Clear selected dispute on close
        }}>
          <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-red-500/20">
            <DialogHeader className="flex flex-row items-center justify-between border-b border-red-500/20 pb-4">
              <DialogTitle className="text-white flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Resolve Dispute
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDisputeModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">{selectedDispute.skill_title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-400">Complainant ({selectedDispute.complainant_role}):</p>
                    <p className="text-white font-medium">{selectedDispute.complainant_email}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Respondent:</p>
                    <p className="text-white font-medium">{selectedDispute.respondent_email}</p>
                  </div>
                </div>
                <div className="bg-black/30 p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-400 mb-1">Dispute Reason:</p>
                  <p className="text-white font-medium capitalize mb-3">{selectedDispute.dispute_reason.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-gray-400 mb-1">Details:</p>
                  <p className="text-gray-300">{selectedDispute.dispute_details}</p>
                </div>
                {selectedDispute.evidence_urls && selectedDispute.evidence_urls.length > 0 &&
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Evidence:</p>
                    <div className="space-y-2">
                      {selectedDispute.evidence_urls.map((url, index) =>
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-400 hover:text-blue-300 text-sm">

                          Evidence file {index + 1}
                        </a>
                      )}
                    </div>
                  </div>
                }
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-white font-semibold mb-3">Resolution Options:</h4>
                <div className="space-y-3">
                  <Button
                    onClick={() => handleResolveDispute(selectedDispute.id, 'resolved_refund_buyer')}
                    className="w-full bg-green-600 hover:bg-green-700 justify-start">

                    <CheckCircle className="w-4 h-4 mr-2" />
                    Refund Buyer (Full Amount: ${transactions.find((t) => t.id === selectedDispute.transaction_id)?.amount_total?.toFixed(2) || '0.00'})
                  </Button>
                  <Button
                    onClick={() => handleResolveDispute(selectedDispute.id, 'resolved_pay_seller')}
                    className="w-full bg-blue-600 hover:bg-blue-700 justify-start">

                    <DollarSign className="w-4 h-4 mr-2" />
                    Pay Seller (Complete Transaction)
                  </Button>
                  <Button
                    onClick={() => {
                      const totalAmount = transactions.find((t) => t.id === selectedDispute.transaction_id)?.amount_total;
                      const amountStr = prompt(`Enter partial refund amount (e.g., 50.00). Max: ${totalAmount?.toFixed(2) || 'N/A'}:`);
                      if (amountStr !== null) {
                        const refund = parseFloat(amountStr);
                        if (!isNaN(refund) && refund >= 0 && (totalAmount === undefined || refund <= totalAmount)) {
                          handleResolveDispute(selectedDispute.id, 'resolved_partial_refund', refund);
                        } else {
                          alert('Invalid amount entered. Please enter a positive number not exceeding the total transaction amount.');
                        }
                      }
                    }}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 justify-start">

                    <AlertCircle className="w-4 h-4 mr-2" />
                    Partial Refund (Custom Amount)
                  </Button>
                  <Button
                    onClick={() => handleResolveDispute(selectedDispute.id, 'closed_no_action')}
                    variant="outline" className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 w-full border-gray-600 hover:bg-gray-800 justify-start">


                    <X className="w-4 h-4 mr-2" />
                    Close Dispute (No Action)
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      }
    </div>);

}
