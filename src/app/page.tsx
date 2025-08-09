"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { Image as ImageType } from "@/lib/types";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ImageGallery } from "@/components/image-gallery";
import { Skeleton } from "@/components/ui/skeleton";

function useImages() {
  const [images, setImages] = useState<ImageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(firestore, "images"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const imagesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ImageType[];
        setImages(imagesData);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(
          "Failed to load images. Please check your connection or Firebase setup."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { images, loading, error };
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { images, loading, error } = useImages();

  const filteredImages = useMemo(() => {
    if (!searchQuery) {
      return images;
    }
    return images.filter(
      (image) =>
        image.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (image.tags &&
          image.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          ))
    );
  }, [images, searchQuery]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search images by name or tag..."
              className="pl-10 w-full h-12 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[250px] w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive text-lg">{error}</p>
          </div>
        ) : (
          <ImageGallery images={filteredImages} />
        )}
      </main>
    </div>
  );
}
