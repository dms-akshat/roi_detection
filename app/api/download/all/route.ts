import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import JSZip from "jszip"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("processed_images").select("processed_url, original_name")

    if (error) {
      return NextResponse.json({ error: "Failed to retrieve images" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "No images to download" }, { status: 404 })
    }

    // Create a zip file with all processed images
    const zip = new JSZip()

    // Download all images in parallel
    const downloadPromises = data.map(async (image) => {
      try {
        const response = await fetch(image.processed_url)

        if (!response.ok) {
          console.error(`Failed to fetch image: ${image.original_name}`)
          return
        }

        const blob = await response.blob()
        zip.file(`roi_${image.original_name}`, blob)
      } catch (err) {
        console.error(`Error processing image ${image.original_name}:`, err)
      }
    })

    await Promise.all(downloadPromises)

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Return the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="roi_images_${new Date().toISOString().split("T")[0]}.zip"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error downloading all images:", error)
    return NextResponse.json({ error: "Failed to download images" }, { status: 500 })
  }
}

