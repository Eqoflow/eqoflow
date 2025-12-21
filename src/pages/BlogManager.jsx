import React from 'react';
import BlogManager from '../components/admin/BlogManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function BlogManagerPage() {
  return (
    <div className="p-4 md:p-6 bg-slate-950 text-white min-h-screen">
      {/* Back Button */}
      <Link to={createPageUrl("AdminHub")}>
        <Button
          variant="outline"
          className="border-purple-500/30 text-white hover:bg-purple-500/10 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Hub
        </Button>
      </Link>

      <Card className="dark-card">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Blog & Updates Manager
          </CardTitle>
          <CardDescription className="text-gray-400">
            Create, edit, and manage all articles for the public "EqoFlow Updates" page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlogManager />
        </CardContent>
      </Card>
    </div>
  );
}