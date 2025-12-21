import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ImageGalleryWidget({ posts }) {
  const [selectedImage, setSelectedImage] = useState(null);

  // Extract all images from posts
  const allImages = posts
    .filter(post => post.media_urls && post.media_urls.length > 0)
    .flatMap(post => 
      post.media_urls
        .filter(url => {
          const ext = url.toLowerCase();
          return ext.includes('.jpg') || ext.includes('.jpeg') || ext.includes('.png') || ext.includes('.gif') || ext.includes('.webp');
        })
        .map(url => ({ url, post }))
    )
    .slice(0, 12);

  return (
    <>
      <Card className="dark-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm font-semibold">IMAGE GALLERY</CardTitle>
        </CardHeader>
        <CardContent>
          {allImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {allImages.map((item, index) => (
                <div 
                  key={index}
                  className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedImage(item)}
                >
                  <img 
                    src={item.url} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-xs">No images yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="dark-card max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-5 h-5 text-white" />
            </Button>
            {selectedImage && (
              <img 
                src={selectedImage.url} 
                alt="" 
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
            {selectedImage?.post && (
              <div className="p-4 border-t border-gray-700">
                <p className="text-white text-sm">{selectedImage.post.content}</p>
                <p className="text-gray-400 text-xs mt-2">
                  by {selectedImage.post.author_full_name}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}