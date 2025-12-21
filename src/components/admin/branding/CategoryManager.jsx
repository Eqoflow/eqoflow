
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

export default function CategoryManager({ categories, onSave, onDelete, onToggleActive }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    if (editingCategory) {
      setFormData({ name: editingCategory.name, description: editingCategory.description });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [editingCategory]);

  const openModal = (category = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = () => {
    onSave(editingCategory, formData);
    closeModal();
  };

  return (
    <>
      <Card className="dark-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white">Branding Categories</CardTitle>
              <CardDescription>Manage the categories used for AI content analysis.</CardDescription>
            </div>
            <Button onClick={() => openModal()} className="bg-purple-600 hover:bg-purple-700">
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-white">Name</TableHead>
                <TableHead className="text-white">Description</TableHead>
                <TableHead className="text-white text-center">Status</TableHead>
                <TableHead className="text-right text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(category => (
                <TableRow key={category.id} className="border-slate-800">
                  <TableCell className="font-medium text-gray-200">{category.name}</TableCell>
                  <TableCell className="text-gray-400">{category.description}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={category.is_active}
                      onCheckedChange={(isActive) => onToggleActive(category, isActive)}
                      className="data-[state=checked]:bg-green-500"
                    />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openModal(category)}>
                      <Edit className="w-4 h-4 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(category)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="dark-card">
          <DialogHeader>
            <DialogTitle className="text-white">{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
            <DialogDescription>Define a category for classifying trending content.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name" className="text-gray-300">Category Name</Label>
              <Input id="cat-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="dark-input" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc" className="text-gray-300">Description</Label>
              <Input id="cat-desc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="dark-input" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">Save Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
