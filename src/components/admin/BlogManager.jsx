
import React, { useState, useEffect, useMemo } from 'react';
import { BlogArticle } from '@/entities/BlogArticle';
import { User } from '@/entities/User';
import { UploadFile } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Loader2,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
  FileUp,
  FileText } from
'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Quill's CSS

const generateSlug = (title) => {
  if (!title) return '';
  return title.
  toLowerCase().
  trim().
  replace(/[^\w\s-]/g, '') // remove non-word chars
  .replace(/[\s_-]+/g, '-') // collapse whitespace and replace with -
  .replace(/^-+|-+$/g, ''); // remove leading/trailing dashes
};

export default function BlogManager() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const [contentType, setContentType] = useState('article');
  const [pdfUrl, setPdfUrl] = useState('');

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);

  const fileInputRef = React.useRef(null);
  const pdfInputRef = React.useRef(null);
  const mediaInputRef = React.useRef(null);

  const quillModules = useMemo(() => ({
    toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
    ['link', 'image', 'video'],
    ['clean']]

  }), []);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [user, fetchedArticles] = await Promise.all([
      User.me(),
      BlogArticle.list('-created_date', 100)]
      );
      setCurrentUser(user);
      setArticles(fetchedArticles);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingArticle(null);
    setTitle('');
    setSlug('');
    setContentType('article');
    setContent('');
    setPdfUrl('');
    setExcerpt('');
    setFeaturedImageUrl('');
    setMediaFiles([]);
    setTags([]);
    setCurrentTag('');
    setIsPublished(false);
  };

  const handleEditClick = (article) => {
    setEditingArticle(article);
    setTitle(article.title);
    setSlug(article.slug);
    setContentType(article.content_type || 'article');
    setContent(article.content || '');
    setPdfUrl(article.pdf_url || '');
    setExcerpt(article.excerpt || '');
    setFeaturedImageUrl(article.featured_image_url || '');
    setTags(article.tags || []);
    setIsPublished(article.is_published);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (articleId) => {
    if (window.confirm('Are you sure you want to delete this article? This cannot be undone.')) {
      try {
        await BlogArticle.delete(articleId);
        setArticles(articles.filter((a) => a.id !== articleId));
        if (editingArticle && editingArticle.id === articleId) {
          resetForm();
        }
      } catch (error) {
        console.error("Failed to delete article:", error);
        alert('Error deleting article. See console for details.');
      }
    }
  };

  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    if (!editingArticle) {// Only auto-generate slug for new articles
      setSlug(generateSlug(newTitle));
    }
  };

  const addTag = () => {
    const trimmedTag = currentTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFeaturedImageUrl(file_url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert('Image upload failed. See console for details.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingPdf(true);
    try {
      const { file_url } = await UploadFile({ file });
      setPdfUrl(file_url);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      alert('PDF upload failed. See console for details.');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Generic media uploader can be added here if needed

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !slug) {
      alert('Title and Slug are required.');
      return;
    }
    if (contentType === 'article' && !content) {
      alert('Content is required for an article.');
      return;
    }
    if (contentType === 'pdf' && !pdfUrl) {
      alert('A PDF file is required for a PDF-type post.');
      return;
    }
    setIsSubmitting(true);

    const articleData = {
      title,
      slug,
      content_type: contentType,
      content: contentType === 'article' ? content : 'This is a PDF document. Please download to view.',
      pdf_url: contentType === 'pdf' ? pdfUrl : '',
      excerpt,
      featured_image_url: featuredImageUrl,
      tags,
      is_published: isPublished,
      publish_date: isPublished ? new Date().toISOString() : null,
      author_email: currentUser.email,
      author_name: currentUser.full_name
    };

    try {
      if (editingArticle) {
        await BlogArticle.update(editingArticle.id, articleData);
      } else {
        await BlogArticle.create(articleData);
      }
      resetForm();
      await loadInitialData(); // Reload all articles to show the new/updated one
    } catch (error) {
      console.error("Failed to save article:", error);
      alert('Error saving article. See console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <Card className="dark-card border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">
            {editingArticle ? 'Edit Entry' : 'Create New Entry'}
          </CardTitle>
          {editingArticle &&
          <Button variant="outline" size="sm" onClick={resetForm} className="absolute top-4 right-4">
              <Plus className="w-4 h-4 mr-2" /> New Entry
            </Button>
          }
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
             <Tabs value={contentType} onValueChange={setContentType} className="w-full">
              <TabsList className="bg-slate-950 text-muted-foreground p-1 h-10 items-center justify-center rounded-md grid w-full grid-cols-2">
                <TabsTrigger value="article">Write Article</TabsTrigger>
                <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
              </TabsList>
              <div className="pt-6">
                <Input placeholder="Entry Title" value={title} onChange={(e) => handleTitleChange(e.target.value)} required className="bg-black/20 text-white text-lg" />
                <Input placeholder="URL Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required className="bg-black/20 text-white mt-4" />

                <TabsContent value="article" className="space-y-6 mt-4">
                    <div className="bg-slate-900">
                      <Label className="text-gray-400 mb-2 block">Content</Label>
                      <div className="bg-black/20 rounded-lg overflow-hidden">
                        <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} className="text-white" />
                      </div>
                    </div>
                </TabsContent>

                <TabsContent value="pdf" className="space-y-6 mt-4">
                   <div className="bg-slate-900">
                      <Label className="text-gray-400 mb-2 block">PDF Document</Label>
                      <input type="file" ref={pdfInputRef} onChange={handlePdfUpload} className="hidden" accept="application/pdf" />
                      <div className="flex items-center gap-4">
                        {pdfUrl &&
                      <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-400 hover:text-purple-300">
                                <FileText className="w-5 h-5" />
                                <span>View Uploaded PDF</span>
                            </a>
                      }
                        <Button type="button" variant="outline" onClick={() => pdfInputRef.current.click()} disabled={isUploadingPdf}>
                            {isUploadingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileUp className="w-4 h-4 mr-2" />}
                            {pdfUrl ? 'Change PDF' : 'Upload PDF'}
                        </Button>
                        {pdfUrl && <Button type="button" variant="destructive" size="sm" onClick={() => setPdfUrl('')}><X className="w-4 h-4" /></Button>}
                      </div>
                   </div>
                </TabsContent>
              </div>
            </Tabs>
            
            <Textarea placeholder="Short Excerpt / Description (for preview cards)" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="bg-black/20 text-white" />
            
            <div className="space-y-2">
              <Label className="text-gray-400">Featured Image (Optional)</Label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-black/20 rounded-lg flex items-center justify-center">
                  {isUploadingImage ? <Loader2 className="w-6 h-6 animate-spin" /> : featuredImageUrl ? <img src={featuredImageUrl} alt="preview" className="w-full h-full object-cover rounded-lg" /> : <ImageIcon className="w-8 h-8 text-gray-500" />}
                </div>
                <Input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current.click()}>
                  <Upload className="w-4 h-4 mr-2" /> {featuredImageUrl ? 'Change Image' : 'Upload Image'}
                </Button>
                {featuredImageUrl && <Button type="button" variant="destructive" size="sm" onClick={() => setFeaturedImageUrl('')}><X className="w-4 h-4" /></Button>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-gray-400">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => <Badge key={tag} variant="secondary">{tag}<Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => removeTag(tag)}><X className="w-3 h-3" /></Button></Badge>)}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add a tag..." value={currentTag} onChange={(e) => setCurrentTag(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} className="bg-black/20 text-white" />
                <Button type="button" variant="outline" onClick={addTag}>Add Tag</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <Switch id="is-published" checked={isPublished} onCheckedChange={setIsPublished} />
                <Label htmlFor="is-published" className="text-white font-medium">Publish Entry</Label>
              </div>
              <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-purple-600 to-pink-500">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingArticle ? 'Save Changes' : 'Create Entry'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Existing Articles List */}
      <Card className="dark-card">
        <CardHeader>
          <CardTitle className="text-white">Existing Articles</CardTitle>
          <CardDescription>Manage previously created articles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {articles.map((article) =>
            <div key={article.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                <div>
                  <p className="font-semibold text-white">{article.title}</p>
                  <p className="text-sm text-gray-400">By {article.author_name} • {new Date(article.created_date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  {article.is_published ?
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30"><Eye className="w-3 h-3 mr-1" />Published</Badge> :
                <Badge variant="outline"><EyeOff className="w-3 h-3 mr-1" />Draft</Badge>
                }
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(article)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(article.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>);

}