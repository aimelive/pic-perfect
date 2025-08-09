"use client";

import { useState, useTransition } from "react";
import NextImage from "next/image";
import { toast } from "@/hooks/use-toast";
import { firestore, storage } from "@/lib/firebase";
import { ref as storageRef, deleteObject } from "firebase/storage";
import { doc, deleteDoc } from "firebase/firestore";
import type { Image as ImageType } from "@/lib/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, LoaderCircle } from "lucide-react";

interface ImageCardProps {
  image: ImageType;
}

export function ImageCard({ image }: ImageCardProps) {
  const [isDeleting, startTransition] = useTransition();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(image.url);
      toast({ title: "Copied", description: "Image URL copied to clipboard." });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Unable to copy the image URL. Please try again.",
      });
    }
  };

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        // Delete Storage object
        const ref = storageRef(storage, image.storagePath);
        await deleteObject(ref);

        // Delete Firestore doc
        const imageDoc = doc(firestore, "images", image.id);
        await deleteDoc(imageDoc);

        toast({
          title: "Success",
          description: "Image deleted successfully.",
        });
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete image. Please try again.",
        });
      }
    });
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col group">
      <CardContent className="p-0 flex-grow">
        <div
          className="aspect-w-1 aspect-h-1 w-full overflow-hidden cursor-pointer"
          onClick={handleCopyLink}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCopyLink();
            }
          }}
          role="button"
          tabIndex={0}
          title="Click to copy image URL"
        >
          <NextImage
            src={image.url}
            alt={image.name}
            width={400}
            height={400}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="photo gallery"
          />
        </div>
        <div className="p-4">
          <p
            className="text-sm font-medium truncate text-foreground"
            title={image.name}
          >
            {image.name}
          </p>
          {image.tags && image.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {image.tags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-2 justify-end bg-muted/30">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                image
                <span className="font-bold"> {image.name}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    Deleting
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
