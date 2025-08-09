import { Image as ImageIcon } from 'lucide-react';
import { ImageUploadDialog } from './image-upload-dialog';

function Logo() {
  return (
    <div className="flex items-center justify-center size-10 bg-primary rounded-lg text-primary-foreground shadow-md">
      <ImageIcon className="size-6" />
    </div>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="text-2xl font-bold text-foreground">PicPerfect</h1>
        </div>
        <ImageUploadDialog />
      </div>
    </header>
  );
}
