"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Loader2, X, FileImage } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { processImages } from "@/lib/actions"

export default function ImageUploader() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const { toast } = useToast()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles)
  }, [])

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()

      // Handle both single files and folders
      selectedFiles.forEach((file) => {
        formData.append("files", file)
      })

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5 * Math.random()
          return newProgress >= 90 ? 90 : newProgress
        })
      }, 300)

      const result = await processImages(formData)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (result.success) {
        toast({
          title: "Upload successful",
          description: `Processed ${selectedFiles.length} image(s)`,
        })
        setSelectedFiles([])

        // Refresh the page after a short delay to show the new images
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        throw new Error(result.error || "Failed to process images")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const clearFiles = () => {
    setSelectedFiles([])
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    disabled: isUploading,
  })

  return (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20"
          }`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>

            {isUploading ? (
              <div className="flex flex-col items-center space-y-4 w-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Uploading and processing images...</p>
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1 text-right">{Math.round(uploadProgress)}%</p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="font-medium">Drag & drop images here, or click to select</p>
                  <p className="text-sm text-muted-foreground">
                    Upload single images or folders of images (JPG, PNG, GIF, WebP)
                  </p>
                </div>

                <Button size="sm" disabled={isUploading}>
                  Select Files
                </Button>
              </>
            )}
          </div>
        </div>

        {selectedFiles.length > 0 && !isUploading && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
              </p>
              <Button variant="ghost" size="sm" onClick={clearFiles}>
                Clear all
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                >
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <FileImage className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

