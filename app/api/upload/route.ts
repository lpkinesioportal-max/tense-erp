import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-ms-wmv"]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido: ${file.type}. Solo se permiten videos (mp4, webm, mov, avi, wmv)` },
        { status: 400 },
      )
    }

    // 100MB limit
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo es demasiado grande. Máximo 100MB" }, { status: 400 })
    }

    const blob = await put(file.name, file, {
      access: "public",
      multipart: true, // Enable multipart for large files
      addRandomSuffix: true, // Add random suffix to avoid filename conflicts
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al subir el archivo" },
      { status: 500 },
    )
  }
}
