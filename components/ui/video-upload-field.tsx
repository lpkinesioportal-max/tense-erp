"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link as LinkIcon, Upload, Video, Loader2, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { cn } from "@/lib/utils"

interface VideoUploadFieldProps {
    value?: string
    onChange: (url: string) => void
    placeholder?: string
}

export function VideoUploadField({ value = "", onChange, placeholder = "Pegá el link del video..." }: VideoUploadFieldProps) {
    const [mode, setMode] = useState<'url' | 'upload'>('url')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('video/')) {
            alert('Por favor seleccioná un archivo de video (mp4, mov, etc.)')
            return
        }
        if (file.size > 100 * 1024 * 1024) {
            alert('El video es demasiado grande. El máximo es 100MB.')
            return
        }
        setUploading(true)
        setUploadProgress('Subiendo video...')
        try {
            const fileName = `videos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
            const { data, error } = await supabase.storage
                .from('clinical-media')
                .upload(fileName, file, { cacheControl: '3600', upsert: false })
            if (error) throw error
            const { data: urlData } = supabase.storage.from('clinical-media').getPublicUrl(data.path)
            onChange(urlData.publicUrl)
            setUploadProgress('¡Video subido!')
            setTimeout(() => setUploadProgress(''), 2000)
        } catch (err: any) {
            console.error('Upload error:', err)
            setUploadProgress('Error al subir el video')
            setTimeout(() => setUploadProgress(''), 3000)
        } finally {
            setUploading(false)
        }
    }

    // Helper for preview
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    const ytId = value ? getYoutubeId(value) : null

    return (
        <div className="space-y-2">
            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                <button type="button" onClick={() => setMode('url')}
                    className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                        mode === 'url' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700")}>
                    <LinkIcon className="h-3 w-3" /> Link de YouTube
                </button>
                <button type="button" onClick={() => setMode('upload')}
                    className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                        mode === 'upload' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700")}>
                    <Upload className="h-3 w-3" /> Subir Video
                </button>
            </div>

            {mode === 'url' && (
                <Input
                    type="text"
                    value={value || ""}
                    onChange={e => onChange(e.target.value)}
                    onBlur={(e) => {
                        let val = e.target.value.trim();
                        if (val && !val.startsWith('http') && !val.startsWith('//')) {
                            onChange(`https://${val}`);
                        }
                    }}
                    placeholder={placeholder}
                    className="h-9 text-sm"
                />
            )}

            {mode === 'upload' && (
                <div className="space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className={cn("w-full border-2 border-dashed rounded-lg p-3 flex flex-col items-center gap-1.5 transition-all",
                            uploading ? "border-primary/30 bg-primary/5" : "border-slate-200 hover:border-primary/50 hover:bg-primary/5 cursor-pointer")}
                    >
                        {uploading ? (
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        ) : (
                            <Video className="h-5 w-5 text-slate-400" />
                        )}
                        <span className="text-xs font-medium text-slate-500">
                            {uploading ? uploadProgress : "Tocá para elegir un video"}
                        </span>
                        <span className="text-[10px] text-slate-400">MP4, MOV, WebM • Máx 100MB</span>
                    </button>
                </div>
            )}

            {value && !uploading && (
                <div className="relative mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center group">
                    {ytId ? (
                        <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            title="Preview"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        />
                    ) : (
                        <video src={value} controls className="w-full h-full object-contain bg-black" />
                    )}

                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar video"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
