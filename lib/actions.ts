"use server"

import { put, del } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { processImageWithROI } from "@/lib/image-processor"
import JSZip from "jszip"
import { revalidatePath } from "next/cache"

export async function processImages(formData: FormData) {
  try {
    const supabase = createClient()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return { success: false, error: "No files provided" }
    }

    const processedImages = []

    for (const file of files) {
      // 1. Upload original image to Vercel Blob
      const originalBlob = await put(`originals/${Date.now()}-${file.name}`, file, {
        access: "public",
        addRandomSuffix: true,
      })

      // 2. Process the image to detect and crop ROI (placeholder for Python script)
      const processedImageBuffer = await processImageWithROI(file)

      // 3. Upload processed image to Vercel Blob
      const processedBlob = await put(`processed/${Date.now()}-${file.name}`, processedImageBuffer, {
        access: "public",
        addRandomSuffix: true,
      })

      // 4. Store metadata in Supabase
      const { data, error } = await supabase
        .from("processed_images")
        .insert({
          original_name: file.name,
          original_url: originalBlob.url,
          processed_url: processedBlob.url,
          original_blob_path: originalBlob.pathname,
          processed_blob_path: processedBlob.pathname,
        })
        .select()
        .single()

      if (error) throw error

      processedImages.push(data)
    }

    // Revalidate the path to refresh the data
    revalidatePath("/")

    return { success: true, data: processedImages }
  } catch (error) {
    console.error("Error processing images:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process images",
    }
  }
}

export async function getProcessedImages() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("processed_images")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data.map((item) => ({
        id: item.id,
        originalName: item.original_name,
        originalUrl: item.original_url,
        processedUrl: item.processed_url,
        createdAt: item.created_at,
      })),
    }
  } catch (error) {
    console.error("Error getting processed images:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get processed images",
    }
  }
}

export async function downloadImage(imageId: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("processed_images")
      .select("processed_url, original_name")
      .eq("id", imageId)
      .single()

    if (error) throw error

    // This function is called from client-side, so we return the URL
    // The actual download will happen in the browser
    return {
      success: true,
      url: data.processed_url,
      filename: `roi_${data.original_name}`,
    }
  } catch (error) {
    console.error("Error downloading image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to download image",
    }
  }
}

export async function downloadAllImages() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("processed_images").select("processed_url, original_name")

    if (error) throw error

    if (!data || data.length === 0) {
      return { success: false, error: "No images to download" }
    }

    // Create a zip file with all processed images
    const zip = new JSZip()

    for (const image of data) {
      const response = await fetch(image.processed_url)
      const blob = await response.blob()
      zip.file(`roi_${image.original_name}`, blob)
    }

    const zipBlob = await zip.generateAsync({ type: "blob" })
    const zipUrl = URL.createObjectURL(zipBlob)

    return {
      success: true,
      url: zipUrl,
      filename: `roi_images_${new Date().toISOString().split("T")[0]}.zip`,
    }
  } catch (error) {
    console.error("Error downloading all images:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to download images",
    }
  }
}

export async function deleteImage(imageId: string) {
  try {
    const supabase = createClient()

    // First get the image data
    const { data: imageData, error: fetchError } = await supabase
      .from("processed_images")
      .select("original_blob_path, processed_blob_path")
      .eq("id", imageId)
      .single()

    if (fetchError) throw fetchError

    // Delete the blobs from Vercel Blob
    if (imageData.original_blob_path) {
      await del(imageData.original_blob_path)
    }

    if (imageData.processed_blob_path) {
      await del(imageData.processed_blob_path)
    }

    // Delete the record from Supabase
    const { error: deleteError } = await supabase.from("processed_images").delete().eq("id", imageId)

    if (deleteError) throw deleteError

    // Revalidate the path to refresh the data
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting image:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete image",
    }
  }
}

export async function deleteAllImages() {
  try {
    const supabase = createClient()

    // Get all image data
    const { data: imagesData, error: fetchError } = await supabase
      .from("processed_images")
      .select("id, original_blob_path, processed_blob_path")

    if (fetchError) throw fetchError

    // Delete all blobs from Vercel Blob
    for (const image of imagesData) {
      if (image.original_blob_path) {
        await del(image.original_blob_path).catch((err) => console.error("Error deleting original blob:", err))
      }

      if (image.processed_blob_path) {
        await del(image.processed_blob_path).catch((err) => console.error("Error deleting processed blob:", err))
      }
    }

    // Delete all records from Supabase
    const { error: deleteError } = await supabase
      .from("processed_images")
      .delete()
      .in(
        "id",
        imagesData.map((img) => img.id),
      )

    if (deleteError) throw deleteError

    // Revalidate the path to refresh the data
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Error deleting all images:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete all images",
    }
  }
}

