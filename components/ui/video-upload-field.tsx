"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link as LinkIcon, X, Video, Play } from "lucide-react"

interface VideoUploadFieldProps {
    value?: string
    onChange: (url: string) => void
    placeholder?: string
}

export function VideoUploadField({ value = "", onChange, placeholder = "Pegá el link del video (YouTube o archivo directo)..." }: VideoUploadFieldProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        setPreviewUrl(value || null)
    }, [value])

    const handleClear = () => {
        onChange("")
        setPreviewUrl(null)
    }

    // Detect YouTube ID
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    const ytId = previewUrl ? getYoutubeId(previewUrl) : null

    return (
        <div className="space-y-2">
            <div className="relative">
                <div className="absolute left-2.5 top-2.5 text-slate-400">
                    <LinkIcon className="h-4 w-4" />
                </div>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="pl-9 pr-8"
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {previewUrl && (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                    {ytId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        />
                    ) : (
                        isValidVideoUrl(previewUrl) ? (
                            <video src={previewUrl} controls className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Video className="h-8 w-8 opacity-50" />
                                <span className="text-xs">Vista previa no disponible para este enlace</span>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    )
}

function isValidVideoUrl(url: string) {
    // Basic check for common video extensions if it's a direct file
    return url.match(/\.(mp4|webm|ogg|mov)$/i) || url.startsWith('blob:')
}
