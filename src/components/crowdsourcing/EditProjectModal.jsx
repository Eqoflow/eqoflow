import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Trash2, CheckCircle2, Circle, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EditProjectModal({ project, onSave, onClose }) {
  const [milestones, setMilestones] = useState(project.milestones || []);
  const [updates, setUpdates] = useState(project.updates || []);
  const [newMilestone, setNewMilestone] = useState({ title: '', description: '', funding_required: 0 });
  const [newUpdate, setNewUpdate] = useState({ title: '', content: '' });
  const [isSaving, setIsSaving] = useState(false);

  const addMilestone = () => {
    if (newMilestone.title && newMilestone.funding_required > 0) {
      setMilestones([...milestones, { ...newMilestone, completed: false }]);
      setNewMilestone({ title: '', description: '', funding_required: 0 });
    }
  };

  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const toggleMilestoneCompletion = (index) => {
    const updatedMilestones = milestones.map((milestone, i) => 
      i === index ? { ...milestone, completed: !milestone.completed } : milestone
    );
    setMilestones(updatedMilestones);
  };

  const addUpdate = () => {
    if (newUpdate.title && newUpdate.content) {
      const update = {
        ...newUpdate,
        posted_at: new Date().toISOString()
      };
      setUpdates([update, ...updates]); // Add new updates to the beginning
      setNewUpdate({ title: '', content: '' });
    }
  };

  const removeUpdate = (index) => {
    setUpdates(updates.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        milestones: milestones,
        updates: updates
      });
    } catch (error) {
      console.error("Error saving project updates:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="dark-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Edit Project: {project.title}</CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="milestones" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 dark-card p-1.5 rounded-2xl">
                  <TabsTrigger value="milestones" className="rounded-xl text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                    Milestones ({milestones.length})
                  </TabsTrigger>
                  <TabsTrigger value="updates" className="rounded-xl text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-500">
                    Updates ({updates.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="milestones" className="space-y-6">
                  {/* Add New Milestone */}
                  <Card className="dark-card">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Add New Milestone</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Milestone title"
                          value={newMilestone.title}
                          onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                          className="bg-black/20 border-purple-500/20 text-white"
                        />
                        <Input
                          type="number"
                          placeholder="Funding required"
                          value={newMilestone.funding_required}
                          onChange={(e) => setNewMilestone({ ...newMilestone, funding_required: parseFloat(e.target.value) })}
                          className="bg-black/20 border-purple-500/20 text-white"
                        />
                        <Button onClick={addMilestone} variant="outline" className="border-purple-500/30">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Milestone
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Milestone description"
                        value={newMilestone.description}
                        onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                        className="bg-black/20 border-purple-500/20 text-white"
                      />
                    </CardContent>
                  </Card>

                  {/* Existing Milestones */}
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold">Current Milestones</h3>
                    {milestones.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No milestones added yet</p>
                    ) : (
                      milestones.map((milestone, index) => (
                        <Card key={index} className="dark-card">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <button
                                onClick={() => toggleMilestoneCompletion(index)}
                                className="mt-1 hover:opacity-70 transition-opacity"
                              >
                                {milestone.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                              <div className="flex-1">
                                <h4 className="text-white font-medium">{milestone.title}</h4>
                                <p className="text-gray-400 text-sm mt-1">{milestone.description}</p>
                              </div>
                              <div className="text-purple-400 font-medium">
                                £{milestone.funding_required.toLocaleString()}
                              </div>
                              <Button
                                onClick={() => removeMilestone(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="updates" className="space-y-6">
                  {/* Add New Update */}
                  <Card className="dark-card">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Post New Update</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        placeholder="Update title"
                        value={newUpdate.title}
                        onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                        className="bg-black/20 border-purple-500/20 text-white"
                      />
                      <Textarea
                        placeholder="Share an update with your backers..."
                        value={newUpdate.content}
                        onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                        className="bg-black/20 border-purple-500/20 text-white min-h-[120px]"
                      />
                      <Button onClick={addUpdate} className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Post Update
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Existing Updates */}
                  <div className="space-y-4">
                    <h3 className="text-white font-semibold">Project Updates</h3>
                    {updates.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">No updates posted yet</p>
                    ) : (
                      updates.map((update, index) => (
                        <Card key={index} className="dark-card">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-white font-medium">{update.title}</h4>
                                  <span className="text-sm text-gray-400">
                                    {new Date(update.posted_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed">{update.content}</p>
                              </div>
                              <Button
                                onClick={() => removeUpdate(index)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-6 border-t border-purple-500/20 mt-6">
                <Button variant="outline" onClick={onClose} className="border-gray-600">
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}