"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Newspaper, Edit, Trash2, Calendar, Pin, ImageIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { CommunityPost } from "@/lib/types"

const categoryColors: Record<string, string> = {
  tips: "bg-blue-100 text-blue-800",
  recetas: "bg-green-100 text-green-800",
  anuncios: "bg-amber-100 text-amber-800",
  eventos: "bg-purple-100 text-purple-800",
  motivacion: "bg-pink-100 text-pink-800",
  general: "bg-gray-100 text-gray-800",
}

const categoryLabels: Record<string, string> = {
  tips: "Tips",
  recetas: "Recetas",
  anuncios: "Anuncios",
  eventos: "Eventos",
  motivacion: "Motivación",
  general: "General",
}

export default function NoticiasPage() {
  const { user, hasPermission } = useAuth()
  const { communityPosts, addCommunityPost, updateCommunityPost, deleteCommunityPost } = useData()

  const [showDialog, setShowDialog] = useState(false)
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general" as CommunityPost["category"],
    imageUrl: "",
    isPinned: false,
  })

  const canEdit = hasPermission(["super_admin", "admin"])

  const filteredPosts = (communityPosts || [])
    .filter((post) => selectedCategory === "all" || post.category === selectedCategory)
    .sort((a, b) => {
      // Pinned posts first
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      // Then by date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const openNewDialog = () => {
    setEditingPost(null)
    setFormData({
      title: "",
      content: "",
      category: "general",
      imageUrl: "",
      isPinned: false,
    })
    setShowDialog(true)
  }

  const openEditDialog = (post: CommunityPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      content: post.content,
      category: post.category,
      imageUrl: post.imageUrl || "",
      isPinned: post.isPinned || false,
    })
    setShowDialog(true)
  }

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) return

    if (editingPost) {
      updateCommunityPost(editingPost.id, {
        ...formData,
        imageUrl: formData.imageUrl || undefined,
      })
    } else {
      addCommunityPost({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        imageUrl: formData.imageUrl || undefined,
        isPinned: formData.isPinned,
        authorId: user?.id || "",
        authorName: user?.name || "Admin",
      })
    }

    setShowDialog(false)
  }

  const handleDelete = (postId: string) => {
    if (confirm("¿Estás seguro de eliminar esta noticia?")) {
      deleteCommunityPost(postId)
    }
  }

  const togglePin = (post: CommunityPost) => {
    updateCommunityPost(post.id, { isPinned: !post.isPinned })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Noticias y Novedades</h1>
            <p className="text-muted-foreground">Mantente informado sobre las últimas novedades de TENSE</p>
          </div>
          {canEdit && (
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Noticia
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            Todas
          </Button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Newspaper className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">No hay noticias</h2>
              <p className="text-muted-foreground">
                {canEdit
                  ? "Creá la primera noticia para compartir con el equipo"
                  : "Pronto habrá novedades para compartir"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Card key={post.id} className={post.isPinned ? "border-amber-300 bg-amber-50/50" : ""}>
                {post.imageUrl && (
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={post.imageUrl || "/placeholder.svg"}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                    {post.isPinned && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-amber-500">
                          <Pin className="h-3 w-3 mr-1" />
                          Fijado
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        {!post.imageUrl && post.isPinned && <Pin className="h-4 w-4 text-amber-500" />}
                        <Badge className={categoryColors[post.category]}>{categoryLabels[post.category]}</Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight">{post.title}</CardTitle>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePin(post)}>
                          <Pin className={`h-4 w-4 ${post.isPinned ? "text-amber-500 fill-amber-500" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(post)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{post.content}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {post.authorName
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{post.authorName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(post.createdAt), "d MMM yyyy", { locale: es })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog for Create/Edit */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPost ? "Editar Noticia" : "Nueva Noticia"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título de la noticia"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v as CommunityPost["category"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contenido</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Escribe el contenido de la noticia..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>URL de imagen (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                  <Button variant="outline" size="icon">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isPinned" className="cursor-pointer">
                  Fijar noticia (aparecerá primero)
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={!formData.title.trim() || !formData.content.trim()}>
                {editingPost ? "Guardar Cambios" : "Publicar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
