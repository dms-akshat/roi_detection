import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const supabase = createClient()

    const { data, error } = await supabase
      .from("processed_images")
      .select("processed_url, original_name")
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 })
    }

    // Fetch the image from the URL
    const response = await fetch(data.processed_url)

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 })
    }

    const imageBuffer = await response.arrayBuffer()

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Content-Disposition": `attachment; filename="roi_${data.original_name}"`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Error downloading image:", error)
    return NextResponse.json({ error: "Failed to download image" }, { status: 500 })
  }
}

