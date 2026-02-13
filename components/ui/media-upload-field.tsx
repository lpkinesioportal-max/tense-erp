"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link as LinkIcon, Upload, Video, Loader2, Trash2, FileText, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { cn } from "@/lib/utils"

interface MediaUploadFieldProps {
    value?: string
    onChange: (url: string) => void
    placeholder?: string
    type?: 'video' | 'pdf' | 'both'
}

export function MediaUploadField({ value = "", onChange, placeholder = "Pegá el link...", type = 'both' }: MediaUploadFieldProps) {
    const [mode, setMode] = useState<'url' | 'upload'>('url')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState('')
    const fileInputRef = useRef<HTMLInputElement>(null)

    const acceptedTypes = type === 'video' ? 'video/*' : type === 'pdf' ? 'application/pdf' : 'video/*,application/pdf'

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const isVideo = file.type.startsWith('video/')
        const isPdf = file.type === 'application/pdf'

        if (type === 'video' && !isVideo) {
            alert('Por favor seleccioná un archivo de video.')
            return
        }
        if (type === 'pdf' && !isPdf) {
            alert('Por favor seleccioná un archivo PDF.')
            return
        }
        if (type === 'both' && !isVideo && !isPdf) {
            alert('Por favor seleccioná un video o un PDF.')
            return
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            alert('El archivo es demasiado grande. El máximo es 50MB.')
            return
        }

        setUploading(true)
        setUploadProgress('Subiendo archivo...')
        try {
            const ext = file.name.split('.').pop()
            const fileName = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

            const { data, error } = await supabase.storage
                .from('clinical-media')
                .upload(fileName, file, { cacheControl: '3600', upsert: false })

            if (error) throw error

            const { data: urlData } = supabase.storage.from('clinical-media').getPublicUrl(data.path)
            onChange(urlData.publicUrl)
            setUploadProgress('¡Archivo subido!')
            setTimeout(() => setUploadProgress(''), 2000)
        } catch (err: any) {
            console.error('Upload error:', err)
            setUploadProgress('Error al subir')
            setTimeout(() => setUploadProgress(''), 3000)
        } finally {
            setUploading(false)
        }
    }

    // Helper for YouTube
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
        const match = url.match(regExp)
        return (match && match[2].length === 11) ? match[2] : null
    }

    const ytId = value ? getYoutubeId(value) : null
    const isPdfUrl = value?.toLowerCase().endsWith('.pdf') || value?.includes('.pdf?')

    return (
        <div className="space-y-2">
            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                <button type="button" onClick={() => setMode('url')}
                    className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                        mode === 'url' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700")}>
                    <LinkIcon className="h-3 w-3" /> Link
                </button>
                <button type="button" onClick={() => setMode('upload')}
                    className={cn("flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                        mode === 'upload' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700")}>
                    <Upload className="h-3 w-3" /> Subir
                </button>
            </div>

            {mode === 'url' && (
                <Input
                    type="text"
                    value={value || ""}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="h-9 text-sm"
                />
            )}

            {mode === 'upload' && (
                <div className="space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={acceptedTypes}
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
                            type === 'pdf' ? <FileText className="h-5 w-5 text-slate-400" /> :
                                <Video className="h-5 w-5 text-slate-400" />
                        )}
                        <span className="text-xs font-medium text-slate-500">
                            {uploading ? uploadProgress : "Tocá para elegir archivo"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                            {type === 'pdf' ? 'PDF' : type === 'video' ? 'Video' : 'Video o PDF'} • Máx 50MB
                        </span>
                    </button>
                </div>
            )}

            {value && !uploading && (
                <div className={cn("relative mt-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group",
                    isPdfUrl ? "p-3" : "aspect-video flex items-center justify-center"
                )}>
                    {isPdfUrl ? (
                        <div className="flex items-center gap-3 w-full">
                            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-700 truncate">Documento PDF</p>
                                <a href={value} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                                    Ver documento <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            </div>
                        </div>
                    ) : ytId ? (
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
                        title="Eliminar archivo"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    )
}
