"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Download, Loader2, Trash2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { getProcessedImages, downloadImage, downloadAllImages, deleteImage, deleteAllImages } from "@/lib/actions"

type ProcessedImage = {
  id: string
  originalName: string
  originalUrl: string
  processedUrl: string
  createdAt: string
}

export function ProcessedImages() {
  const [images, setImages] = useState<ProcessedImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadImages = async () => {
    setIsLoading(true)
    try {
      const result = await getProcessedImages()
      if (result.success) {
        setImages(result.data)
      } else {
        toast({
          title: "Failed to load images",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading images:", error)
      toast({
        title: "Failed to load images",
        description: "Could not retrieve processed images",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [])

  const handleDownloadImage = async (image: ProcessedImage) => {
    setIsDownloading(true)
    try {
      const result = await downloadImage(image.id)

      if (result.success) {
        // Create a temporary anchor element to trigger the download
        const a = document.createElement("a")
        a.href = result.url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        toast({
          title: "Download successful",
          description: `Downloaded ${image.originalName}`,
        })
      } else {
        throw new Error(result.error || "Failed to download image")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "Could not download the image",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadAll = async () => {
    if (images.length === 0) return

    setIsDownloading(true)
    try {
      const result = await downloadAllImages()

      if (result.success) {
        // Create a temporary anchor element to trigger the download
        const a = document.createElement("a")
        a.href = result.url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // Clean up the object URL
        setTimeout(() => {
          URL.revokeObjectURL(result.url)
        }, 100)

        toast({
          title: "Download successful",
          description: "Downloaded all processed images as a ZIP file",
        })
      } else {
        throw new Error(result.error || "Failed to download images")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: "Could not download the images",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDeleteImage = async () => {
    if (!selectedImageId) return

    setIsDeleting(true)
    try {
      const result = await deleteImage(selectedImageId)

      if (result.success) {
        setImages((prev) => prev.filter((img) => img.id !== selectedImageId))

        toast({
          title: "Delete successful",
          description: "Image deleted successfully",
        })
      } else {
        throw new Error(result.error || "Failed to delete image")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete failed",
        description: "Could not delete the image",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setSelectedImageId(null)
    }
  }

  const handleDeleteAll = async () => {
    if (images.length === 0) return

    setIsDeleting(true)
    try {
      const result = await deleteAllImages()

      if (result.success) {
        setImages([])

        toast({
          title: "Delete successful",
          description: "All images deleted successfully",
        })
      } else {
        throw new Error(result.error || "Failed to delete images")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        title: "Delete failed",
        description: "Could not delete the images",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeleteAllDialogOpen(false)
    }
  }

  const openDeleteDialog = (imageId: string) => {
    setSelectedImageId(imageId)
    setDeleteDialogOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading processed images...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <p className="text-muted-foreground">No processed images yet</p>
            <p className="text-sm text-muted-foreground mt-1">Upload images to see the results here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            {images.length} processed image{images.length !== 1 ? "s" : ""}
          </p>
          <Button variant="ghost" size="icon" onClick={loadImages} disabled={isLoading} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDeleteAllDialogOpen(true)}
            disabled={isDeleting || images.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All
          </Button>
          <Button size="sm" onClick={handleDownloadAll} disabled={isDownloading || images.length === 0}>
            {isDownloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {images.map((image) => (
          <Card key={image.id} className="overflow-hidden">
            <Tabs defaultValue="processed">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <p className="font-medium truncate" title={image.originalName}>
                    {image.originalName}
                  </p>
                  <TabsList>
                    <TabsTrigger value="original">Original</TabsTrigger>
                    <TabsTrigger value="processed">Processed</TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="original" className="m-0">
                <div className="relative aspect-video">
                  <Image
                    src={image.originalUrl || "/placeholder.svg?height=400&width=600"}
                    alt={`Original ${image.originalName}`}
                    fill
                    className="object-contain"
                  />
                </div>
              </TabsContent>

              <TabsContent value="processed" className="m-0">
                <div className="relative aspect-video">
                  <Image
                    src={image.processedUrl || "/placeholder.svg?height=400&width=600"}
                    alt={`Processed ${image.originalName}`}
                    fill
                    className="object-contain"
                  />
                </div>
              </TabsContent>

              <div className="p-4 border-t flex justify-between items-center">
                <Button variant="outline" size="sm" onClick={() => openDeleteDialog(image.id)} disabled={isDeleting}>
                  {isDeleting && selectedImageId === image.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
                <Button size="sm" onClick={() => handleDownloadImage(image)} disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download
                </Button>
              </div>
            </Tabs>
          </Card>
        ))}
      </div>

      {/* Delete Image Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the image and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteImage}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Images Confirmation Dialog */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all images?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete all images and remove them from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete All"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

