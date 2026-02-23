import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, Edit, Trash2, ExternalLink, Save, X, Film, MessageSquare, Image as ImageIcon, Upload } from "lucide-react";

export default function StampedContentGallery({ user, userColorScheme }) {
  const [stampedContent, setStampedContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [publishingItem, setPublishingItem] = useState(null);

  useEffect(() => {
    loadStampedContent();
  }, [user]);

  const loadStampedContent = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const stamped = await base44.entities.Post.filter({
        created_by: user.email,
        blockchain_tx_id: { $ne: null }
      }, '-created_date');
      setStampedContent(stamped);
    } catch (error) {
      console.error("Error loading stamped content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditTitle(item.author_full_name || "");
    setEditDescription(item.content || "");
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      await base44.entities.Post.update(editingItem.id, {
        author_full_name: editTitle,
        content: editDescription
      });

      setStampedContent((prev) =>
      prev.map((item) =>
      item.id === editingItem.id ?
      { ...item, author_full_name: editTitle, content: editDescription } :
      item
      )
      );

      setEditingItem(null);
      setEditTitle("");
      setEditDescription("");
    } catch (error) {
      console.error("Error updating content:", error);
      alert("Failed to update content. Please try again.");
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await base44.entities.Post.delete(itemId);
      setStampedContent((prev) => prev.filter((item) => item.id !== itemId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting content:", error);
      alert("Failed to delete content. Please try again.");
    }
  };

  const handlePublishToCreatorHub = async (item) => {
    setPublishingItem(item.id);
    try {
      await base44.entities.Post.update(item.id, {
        is_creator_hub_published: true,
        category: item.media_urls?.[0]?.match(/\.(mp4|webm|mov)$/i) ? "entertainment" : "general"
      });
      
      setStampedContent(prev => 
        prev.map(content => 
          content.id === item.id 
            ? { ...content, is_creator_hub_published: true }
            : content
        )
      );
      
      alert("Content published to Creator Hub successfully!");
    } catch (error) {
      console.error("Error publishing content:", error);
      alert("Failed to publish content. Please try again.");
    } finally {
      setPublishingItem(null);
    }
  };

  const getContentTypeIcon = (item) => {
    if (item.media_urls && item.media_urls.length > 0) {
      const mediaUrl = item.media_urls[0];
      if (mediaUrl.match(/\.(mp4|webm|mov)$/i)) {
        return <Film className="w-4 h-4 text-blue-400" />;
      } else if (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      }
    }
    return <MessageSquare className="w-4 h-4 text-yellow-400" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-6 h-6" style={{ color: userColorScheme.primary }} />
            Stamped Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </CardContent>
      </Card>);

  }

  return (
    <>
      <Card className="bg-gradient-to-br from-white/5 to-white/10 border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-6 h-6" style={{ color: userColorScheme.primary }} />
            Stamped Content ({stampedContent.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stampedContent.length === 0 ?
          <div className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <p className="text-white/60 text-lg mb-2">No stamped content yet</p>
              <p className="text-white/40 text-sm">
                Start protecting your creative work with blockchain timestamps
              </p>
            </div> :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {stampedContent.map((item) =>
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-black/40 rounded-lg border border-white/10 overflow-hidden group hover:border-purple-500/50 transition-all">
                    
                    {/* Media Preview */}
                    {item.media_urls && item.media_urls.length > 0 &&
                <div className="aspect-video bg-black/60 relative overflow-hidden">
                        {item.media_urls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) ?
                  <img
                    src={item.media_urls[0]}
                    alt={item.author_full_name}
                    className="w-full h-full object-cover" /> :

                  item.media_urls[0].match(/\.(mp4|webm|mov)$/i) ?
                  <video
                    src={item.media_urls[0]}
                    className="w-full h-full object-cover"
                    muted /> :


                  <div className="w-full h-full flex items-center justify-center">
                            <Shield className="w-12 h-12 text-white/30" />
                          </div>
                  }
                        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                          {getContentTypeIcon(item)}
                          <Shield className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                }

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-semibold truncate flex-1">
                          {item.author_full_name || "Untitled"}
                        </h3>
                        {(!item.media_urls || item.media_urls.length === 0) &&
                    <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                            {getContentTypeIcon(item)}
                            <Shield className="w-4 h-4 text-green-400" />
                          </div>
                    }
                      </div>
                      <p className="text-white/60 text-sm mb-3 line-clamp-2">
                        {item.content || "No description"}
                      </p>

                      <div className="text-xs text-white/40 mb-3">
                        <p>Stamped: {new Date(item.created_date).toLocaleDateString()}</p>
                        {item.blockchain_tx_id &&
                    <a
                      href={`https://explorer.solana.com/tx/${item.blockchain_tx_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 mt-1">
                            View on Blockchain
                            <ExternalLink className="w-3 h-3" />
                          </a>
                    }
                      </div>

                      <div className="space-y-2">
                        {item.media_urls && item.media_urls.length > 0 && !item.is_creator_hub_published && (
                          <Button
                            size="sm"
                            onClick={() => handlePublishToCreatorHub(item)}
                            disabled={publishingItem === item.id}
                            className="w-full"
                            style={{ background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})` }}>
                            <Upload className="w-3 h-3 mr-2" />
                            {publishingItem === item.id ? "Publishing..." : "Publish to Creator Hub"}
                          </Button>
                        )}
                        {item.is_creator_hub_published && (
                          <div className="text-xs text-green-400 flex items-center justify-center gap-1 py-2">
                            <Shield className="w-3 h-3" />
                            Published to Creator Hub
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(item)}
                            className="flex-1 border-white/20 text-black hover:bg-white/10">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirm(item)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
              )}
              </AnimatePresence>
            </div>
          }
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="bg-black/95 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" style={{ color: userColorScheme.primary }} />
              Edit Content Details
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Update the title and description of your stamped content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-white text-sm mb-2 block">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Content title"
                className="bg-white border-white/20 !text-black placeholder:text-gray-400"
                style={{ color: 'black' }} />

            </div>

            <div>
              <label className="text-white text-sm mb-2 block">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Content description"
                className="bg-white border-white/20 !text-black placeholder:text-gray-400 h-32"
                style={{ color: 'black' }} />

            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)} className="bg-background text-slate-950 px-4 py-2 text-sm font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border shadow-sm hover:text-accent-foreground h-9 border-white/20 hover:bg-white/10">

                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                style={{ background: `linear-gradient(135deg, ${userColorScheme.primary}, ${userColorScheme.secondary})` }}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-black/95 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="w-5 h-5" />
              Delete Stamped Content
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Are you sure you want to delete this content? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {deleteConfirm?.media_urls && deleteConfirm.media_urls.length > 0 &&
            <div className="aspect-video bg-black/60 rounded-lg overflow-hidden mb-4">
                {deleteConfirm.media_urls[0].match(/\.(jpg|jpeg|png|gif|webp)$/i) ?
              <img
                src={deleteConfirm.media_urls[0]}
                alt={deleteConfirm.author_full_name}
                className="w-full h-full object-cover" /> :


              <video
                src={deleteConfirm.media_urls[0]}
                className="w-full h-full object-cover"
                muted />

              }
              </div>
            }

            <p className="text-white font-semibold mb-1">
              {deleteConfirm?.author_full_name || "Untitled"}
            </p>
            <p className="text-white/60 text-sm mb-4">
              {deleteConfirm?.content || "No description"}
            </p>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                className="border-white/20 text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="bg-red-500 hover:bg-red-600 text-white">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Permanently
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>);

}