
import React, { useState, useEffect } from 'react';
import { PlatformExpense } from '@/entities/PlatformExpense';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Plus, Trash2, Briefcase } from 'lucide-react';
import { format } from 'date-fns';

export default function PlatformOpsManager() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    expense_type: 'infrastructure',
    description: '',
    amount_usd: '',
    vendor: '',
    transaction_date: new Date().toISOString().split('T')[0],
    related_invoice_url: '',
    transaction_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      if (currentUser?.role === 'admin') {
        const allExpenses = await PlatformExpense.list('-transaction_date', 100);
        setExpenses(allExpenses);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount_usd || !formData.vendor || !formData.transaction_date) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await PlatformExpense.create({
        ...formData,
        amount_usd: parseFloat(formData.amount_usd),
        transaction_date: new Date(formData.transaction_date).toISOString()
      });

      // Reset form
      setFormData({
        expense_type: 'infrastructure',
        description: '',
        amount_usd: '',
        vendor: '',
        transaction_date: new Date().toISOString().split('T')[0],
        related_invoice_url: '',
        transaction_id: ''
      });
      
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Failed to create expense. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense? This will remove it from the DAO transparency page.')) {
      return;
    }

    try {
      await PlatformExpense.delete(expenseId);
      loadData();
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const getExpenseTypeColor = (type) => {
    const styles = {
      infrastructure: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      marketing: "bg-pink-500/20 text-pink-300 border-pink-500/30",
      salaries: "bg-green-500/20 text-green-300 border-green-500/30",
      development: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      legal: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      operations: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      other: "bg-gray-500/20 text-gray-300 border-gray-500/30"
    };
    return styles[type] || styles.other;
  };

  const totalSpending = expenses.reduce((sum, exp) => sum + (exp.amount_usd || 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link to={createPageUrl("AdminHub")}>
          <Button
            variant="outline"
            className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Hub
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
              Platform Operations Spending
            </h1>
            <p className="text-gray-400">
              Manage platform expenses displayed on the DAO Transparency page
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Add Expense'}
          </Button>
        </div>

        {/* Total Spending Card */}
        <Card className="dark-card mb-6 border-green-500/30">
          <CardContent className="p-6 text-center">
            <div className="text-sm text-gray-400 mb-2">Total Operational Spending</div>
            <div className="text-4xl font-bold text-green-400">
              ${totalSpending.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 mt-2">Visible on DAO Treasury Page</div>
          </CardContent>
        </Card>

        {/* Add Expense Form */}
        {showForm && (
          <Card className="dark-card mb-6">
            <CardHeader>
              <CardTitle className="text-white">Add New Expense</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense_type" className="text-white">Expense Type *</Label>
                    <Select
                      value={formData.expense_type}
                      onValueChange={(value) => setFormData({ ...formData, expense_type: value })}
                    >
                      <SelectTrigger className="bg-slate-950 text-white border-purple-500/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-purple-500/20">
                        <SelectItem value="infrastructure" className="text-white hover:bg-slate-800 cursor-pointer">Infrastructure</SelectItem>
                        <SelectItem value="marketing" className="text-white hover:bg-slate-800 cursor-pointer">Marketing</SelectItem>
                        <SelectItem value="salaries" className="text-white hover:bg-slate-800 cursor-pointer">Salaries</SelectItem>
                        <SelectItem value="development" className="text-white hover:bg-slate-800 cursor-pointer">Development</SelectItem>
                        <SelectItem value="legal" className="text-white hover:bg-slate-800 cursor-pointer">Legal</SelectItem>
                        <SelectItem value="operations" className="text-white hover:bg-slate-800 cursor-pointer">Operations</SelectItem>
                        <SelectItem value="other" className="text-white hover:bg-slate-800 cursor-pointer">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount_usd" className="text-white">Amount (USD) *</Label>
                    <Input
                      id="amount_usd"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1250.75"
                      value={formData.amount_usd}
                      onChange={(e) => setFormData({ ...formData, amount_usd: e.target.value })}
                      className="bg-slate-950 text-white border-purple-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description *</Label>
                  <Input
                    id="description"
                    placeholder="e.g., AWS Server Hosting & Database - April 2024"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-950 text-white border-purple-500/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor" className="text-white">Vendor *</Label>
                    <Input
                      id="vendor"
                      placeholder="e.g., Amazon Web Services"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      className="bg-slate-950 text-white border-purple-500/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction_date" className="text-white">Transaction Date *</Label>
                    <Input
                      id="transaction_date"
                      type="date"
                      value={formData.transaction_date}
                      onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                      className="bg-slate-950 text-white border-purple-500/20"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="related_invoice_url" className="text-white">Invoice URL (Optional)</Label>
                    <Input
                      id="related_invoice_url"
                      type="url"
                      placeholder="https://..."
                      value={formData.related_invoice_url}
                      onChange={(e) => setFormData({ ...formData, related_invoice_url: e.target.value })}
                      className="bg-slate-950 text-white border-purple-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction_id" className="text-white">Transaction ID (Optional)</Label>
                    <Input
                      id="transaction_id"
                      placeholder="e.g., TX123456"
                      value={formData.transaction_id}
                      onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                      className="bg-slate-950 text-white border-purple-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Expense'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Expenses List */}
        <Card className="dark-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              All Platform Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">No Expenses Yet</h3>
                <p className="text-gray-400">Click "Add Expense" to create your first entry.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="p-4 bg-slate-800/50 rounded-lg border border-purple-500/10 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getExpenseTypeColor(expense.expense_type)}>
                            {expense.expense_type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(expense.transaction_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <h4 className="font-medium text-white mb-1">{expense.description}</h4>
                        <p className="text-sm text-gray-400">Vendor: {expense.vendor}</p>
                        {expense.transaction_id && (
                          <p className="text-xs text-gray-500 mt-1">TX ID: {expense.transaction_id}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xl font-bold text-red-400">
                            -${expense.amount_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
