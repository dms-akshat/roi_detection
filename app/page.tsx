import type { Metadata } from "next"
import ImageUploader from "@/components/image-uploader"
import { ProcessedImages } from "@/components/processed-images"

export const metadata: Metadata = {
  title: "Image ROI Cropping Tool",
  description: "Upload images to detect and crop regions of interest",
}

export default function HomePage() {
  return (
    <div className="container mx-auto py-10 space-y-10">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Image ROI Cropping Tool</h1>
        <p className="text-muted-foreground mt-2">Upload images to automatically detect and crop regions of interest</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Upload Images</h2>
          <ImageUploader />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Processed Images</h2>
          <ProcessedImages />
        </div>
      </div>
    </div>
  )
}

