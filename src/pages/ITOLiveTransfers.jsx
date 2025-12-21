import React, { useState, useEffect } from 'react';
import { ITOTransfer } from '@/entities/ITOTransfer';
import { User } from '@/entities/User';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus } from 'lucide-react';
import TransferFeed from '../components/ito/TransferFeed';
import AddTransferModal from '../components/ito/AddTransferModal';

export default function ITOLiveTransfersPage() {
  const [user, setUser] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser?.role === 'admin') {
        const allTransfers = await ITOTransfer.list('-created_date', 50);
        setTransfers(allTransfers);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferAdded = () => {
    setShowAddModal(false);
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>);

  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="dark-card p-8 text-center max-w-md">
          <div className="text-red-400 mb-4">
            <ArrowLeft className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You need admin privileges to access this page.</p>
        </Card>
      </div>);

  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("AdminHub")}>
          <Button
            variant="outline" className="bg-amber-600 text-white mb-6 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-10 border-orange-500/30 hover:bg-orange-500/10">


            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Hub
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400 mb-2">
              ITO Live Transfers
            </h1>
            <p className="text-gray-400">
              Add and manage crypto and bank transfers from the ITO wallet
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">

            <Plus className="w-4 h-4 mr-2" />
            Add Transfer
          </Button>
        </div>

        {/* Transfer Feed */}
        <TransferFeed transfers={transfers} />

        {/* Add Transfer Modal */}
        {showAddModal &&
        <AddTransferModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleTransferAdded} />

        }
      </div>
    </div>);

}