import type { Image as ImageType } from '@/lib/types';
import { ImageCard } from './image-card';
import { ImageIcon } from 'lucide-react';

interface ImageGalleryProps {
  images: ImageType[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No images found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or upload a new image.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 animate-fade-in">
      {images.map(image => (
        <ImageCard key={image.id} image={image} />
      ))}
    </div>
  );
}
