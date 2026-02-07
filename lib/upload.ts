// Client-side upload utility that uses FormData to upload to our API
export async function upload(
  filename: string,
  file: File,
  options: { access: string; handleUploadUrl: string },
): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append("file", file, filename)

  const response = await fetch(options.handleUploadUrl, {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    let errorMessage = "Error al subir el archivo"
    try {
      const json = JSON.parse(text)
      errorMessage = json.error || errorMessage
    } catch {
      errorMessage = text || errorMessage
    }
    throw new Error(errorMessage)
  }

  const data = await response.json()
  return { url: data.url }
}
