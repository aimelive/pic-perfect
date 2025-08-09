"use client";

import { useState, useRef, useTransition } from "react";
import { toast } from "@/hooks/use-toast";
import { generateTagsAction } from "@/app/actions";
import { firestore, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Image as ImageIcon,
  X,
  LoaderCircle,
  Globe,
  Laptop,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export function ImageUploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState<string>("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isUploading, startTransition] = useTransition();
  const [tab, setTab] = useState<string>("local");
  const [urlInput, setUrlInput] = useState<string>("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setError("File is too large. Maximum size is 2MB.");
        setFile(null);
        setPreview(null);
        setNameInput("");
        setNameError(null);
        return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(selectedFile.type)) {
        setError("Invalid file type. Please select a JPG or PNG image.");
        setFile(null);
        setPreview(null);
        return;
      }
      setError(null);
      setFile(selectedFile);
      // Set default editable name (basename without extension)
      const originalName = selectedFile.name;
      const lastDot = originalName.lastIndexOf(".");
      const baseName =
        lastDot > 0 ? originalName.slice(0, lastDot) : originalName;
      setNameInput(baseName);
      setNameError(baseName.trim() ? null : "Image name is required.");
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleFormSubmit = async () => {
    if (tab === "local" && (!file || !preview)) return;
    if (tab === "url" && !preview) return;

    startTransition(async () => {
      // Validate name first
      const proposedName = (nameInput || "").trim();
      if (!proposedName) {
        setNameError("Image name is required.");
        toast({
          variant: "destructive",
          title: "Invalid name",
          description: "Please enter a name for the image.",
        });
        return;
      }

      // 1) Generate tags on the server
      const tagResult = await generateTagsAction({ dataUri: preview! });
      if (!tagResult.success) {
        toast({
          variant: "destructive",
          title: "Tagging Failed",
          description: tagResult.error,
        });
        return;
      }

      try {
        // 2) Upload to Firebase Storage (client)
        const mime = (preview?.split(";")[0].split(":")[1] || "").toLowerCase();
        const fileExtension =
          tab === "local"
            ? file!.name.split(".").pop()
            : mime.includes("png")
            ? "png"
            : "jpg";
        const uniqueId = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        const fileName = `${uniqueId}.${fileExtension}`;
        const path = `images/${fileName}`;
        const ref = storageRef(storage, path);
        if (tab === "local") {
          await uploadBytes(ref, file!);
        } else {
          const res = await fetch(preview!);
          const blob = await res.blob();
          await uploadBytes(ref, blob);
        }

        // 3) Get download URL
        const url = await getDownloadURL(ref);

        // 4) Save Firestore document
        // Construct final display name, keeping original extension
        const safeBaseName =
          proposedName ||
          (tab === "local"
            ? file!.name.split(".").slice(0, -1).join(".")
            : "image") ||
          "image";
        const finalName = `${safeBaseName}.${fileExtension}`;
        await addDoc(collection(firestore, "images"), {
          name: finalName,
          url,
          storagePath: path,
          tags: tagResult.tags ?? [],
          createdAt: serverTimestamp(),
        });

        toast({
          title: "Success!",
          description: "Your image has been uploaded and tagged.",
        });
        resetState();
      } catch (err) {
        console.error(err);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: "Image upload failed. Please try again.",
        });
      }
    });
  };

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setNameInput("");
    setNameError(null);
    setUrlInput("");
    setUrlError(null);
    setTab("local");
    setOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        setOpen(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => {
          if (isUploading) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Upload New Image</DialogTitle>
          <DialogDescription>
            Select an image to upload. AI will automatically generate tags for
            it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="local">
                <Laptop className="mr-2 h-4 w-4" />
                From computer
              </TabsTrigger>
              <TabsTrigger value="url">
                <Globe className="mr-2 h-4 w-4" />
                From web address
              </TabsTrigger>
            </TabsList>

            <TabsContent value="local">
              <Input
                id="picture"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                className="hidden"
                disabled={isUploading}
              />
              {preview && tab === "local" ? (
                <div className="relative w-full h-64 group">
                  <img
                    src={preview}
                    alt="Image preview"
                    className="w-full h-full object-contain rounded-md border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Label
                  htmlFor="picture"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG or JPG (max 2MB)
                    </p>
                  </div>
                </Label>
              )}

              {file && (
                <div className="space-y-2">
                  <Label htmlFor="image-name">Image name</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="image-name"
                      value={nameInput}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(
                          /[\\/:*?"<>|]/g,
                          ""
                        );
                        setNameInput(cleaned);
                        setNameError(
                          cleaned.trim() ? null : "Image name is required."
                        );
                      }}
                      placeholder="Enter image name"
                      disabled={isUploading}
                      maxLength={100}
                      aria-invalid={!!nameError}
                      aria-describedby="image-name-error"
                    />
                    <span className="text-sm text-muted-foreground">
                      .{file.name.split(".").pop()}
                    </span>
                  </div>
                  {nameError && (
                    <p
                      id="image-name-error"
                      className="text-sm text-destructive"
                    >
                      {nameError}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="url">
              <div className="space-y-2">
                <Label htmlFor="image-url">Image web address (URL)</Label>
                <Input
                  id="image-url"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    if (!urlInput.trim()) {
                      setUrlError("Please enter a URL.");
                      return;
                    }
                    setUrlError(null);
                    startTransition(async () => {
                      try {
                        const { fetchImageFromUrlAction } = await import(
                          "@/app/actions"
                        );
                        const result = await fetchImageFromUrlAction({
                          url: urlInput.trim(),
                        });
                        if (!result.success) {
                          setPreview(null);
                          toast({
                            variant: "destructive",
                            title: "Invalid URL",
                            description: result.error,
                          });
                          return;
                        }
                        setPreview(result.dataUri);
                        const lastDot = result.fileName.lastIndexOf(".");
                        const baseName =
                          lastDot > 0
                            ? result.fileName.slice(0, lastDot)
                            : result.fileName;
                        setNameInput(baseName);
                        setNameError(
                          baseName.trim() ? null : "Image name is required."
                        );
                      } catch (e) {
                        console.error(e);
                        toast({
                          variant: "destructive",
                          title: "Load failed",
                          description: "Unable to load image from URL.",
                        });
                      }
                    });
                  }}
                  disabled={isUploading}
                >
                  Load image
                </Button>
                {urlError && (
                  <p className="text-sm text-destructive">{urlError}</p>
                )}
              </div>

              {preview && tab === "url" && (
                <div className="relative w-full h-64 group">
                  <img
                    src={preview}
                    alt="Image preview"
                    className="w-full h-full object-contain rounded-md border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden"
                    onClick={() => {
                      setPreview(null);
                      setUrlInput("");
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {preview && (
                <div className="space-y-2">
                  <Label htmlFor="image-name-url">Image name</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="image-name-url"
                      value={nameInput}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(
                          /[\\/:*?"<>|]/g,
                          ""
                        );
                        setNameInput(cleaned);
                        setNameError(
                          cleaned.trim() ? null : "Image name is required."
                        );
                      }}
                      placeholder="Enter image name"
                      disabled={isUploading}
                      maxLength={100}
                      aria-invalid={!!nameError}
                      aria-describedby="image-name-url-error"
                    />
                    <span className="text-sm text-muted-foreground">
                      .jpg/.png
                    </span>
                  </div>
                  {nameError && (
                    <p
                      id="image-name-url-error"
                      className="text-sm text-destructive"
                    >
                      {nameError}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {isUploading && (
            <div className="flex items-center gap-2 text-sm">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span>Uploading and analyzing image... Please wait.</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetState} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleFormSubmit}
            disabled={
              (tab === "local" && (!file || !!error)) ||
              (tab === "url" && !preview) ||
              !!nameError ||
              !nameInput.trim() ||
              isUploading
            }
          >
            {isUploading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload & Tag"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
