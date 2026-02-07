"use client"

import { useState, useMemo } from "react"
import { useData } from "@/lib/data-context"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
    MessageCircle,
    Search,
    CheckCheck,
    Clock,
    ShieldCheck,
    MoreVertical,
    ChevronLeft,
    Filter,
    Phone,
    Video
} from "lucide-react"
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"

export function ChatAnalysis() {
    const { conversations, chatMessages, clients, professionals } = useData()
    const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const processedConversations = useMemo(() => {
        return (conversations || []).map(conv => {
            const client = (clients || []).find(c => c.id === conv.clientId)
            const prof = (professionals || []).find(p => p.id === conv.professionalId)
            const messages = (chatMessages || []).filter(m => m.conversationId === conv.id)

            return {
                ...conv,
                clientName: client?.name || "Desconocido",
                clientImage: client?.profileImage,
                professionalName: prof?.name || "Profesional",
                messages,
                messageCount: messages.length
            }
        }).filter(c =>
            c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.professionalName.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
    }, [conversations, chatMessages, clients, professionals, searchQuery])

    const selectedConv = processedConversations.find(c => c.id === selectedConversation)

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] min-h-[600px] border border-slate-200 rounded-lg overflow-hidden bg-[#f0f2f5] shadow-sm animate-in fade-in duration-500">
            {/* WHATSAPP LAYOUT DUAL PANEL */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT SIDEBAR: CHAT LIST */}
                <aside className={`flex flex-col shrink-0 border-r border-slate-200 bg-white ${selectedConversation ? 'hidden md:flex md:w-[350px] lg:w-[400px]' : 'flex w-full md:w-[350px] lg:w-[400px]'}`}>
                    {/* SIDEBAR HEADER */}
                    <div className="h-[60px] bg-[#f0f2f5] px-4 flex items-center justify-between shrink-0">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-slate-300 text-slate-600">
                                <ShieldCheck className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="text-slate-500 rounded-full h-10 w-10"><Filter className="h-5 w-5" /></Button>
                            <Button variant="ghost" size="icon" className="text-slate-500 rounded-full h-10 w-10"><MoreVertical className="h-5 w-5" /></Button>
                        </div>
                    </div>

                    {/* SEARCH */}
                    <div className="px-3 py-2 shrink-0">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar o empezar un nuevo chat"
                                className="h-9 pl-12 bg-[#f0f2f5] border-none rounded-lg text-sm focus-visible:ring-0 placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    {/* CHATS LIST */}
                    <ScrollArea className="flex-1">
                        <div className="flex flex-col">
                            {processedConversations.map(conv => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv.id)}
                                    className={`w-full text-left px-3 py-3 flex items-center gap-3 transition-colors ${selectedConversation === conv.id
                                        ? 'bg-[#f0f2f5]'
                                        : 'hover:bg-[#f5f6f6] bg-white'
                                        }`}
                                >
                                    <Avatar className="h-12 w-12 shrink-0">
                                        <AvatarImage src={conv.clientImage} />
                                        <AvatarFallback className="bg-slate-200 text-slate-500 text-lg">
                                            {conv.clientName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0 border-b border-slate-100 pb-3 mt-1 pr-1">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <p className="text-[17px] font-normal text-slate-800 truncate">
                                                {conv.clientName}
                                            </p>
                                            <span className={`text-xs ${conv.unreadCount > 0 ? 'text-emerald-500 font-medium' : 'text-slate-400'}`}>
                                                {conv.lastMessageAt ? (isToday(new Date(conv.lastMessageAt)) ? format(new Date(conv.lastMessageAt), "HH:mm") : format(new Date(conv.lastMessageAt), "dd/MM/yy")) : ""}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                                <p className="text-[14px] text-slate-500 truncate leading-tight">
                                                    <span className="font-medium text-slate-400 mr-1">{conv.professionalName}:</span>
                                                    {conv.lastMessage}
                                                </p>
                                            </div>
                                            {conv.unreadCount > 0 && (
                                                <div className="h-5 min-w-5 px-1 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] text-white font-bold">{conv.unreadCount}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </aside>

                {/* MAIN CHAT WINDOW: WHATSAPP WEB STYLE */}
                <main className={`flex-1 flex flex-col min-w-0 bg-[#efe7de] relative ${!selectedConversation ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                    {/* DOODLE OVERLAY PATTERN (MOCK) */}
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://wallpaperaccess.com/full/1288076.png')] bg-repeat" />

                    {selectedConv ? (
                        <>
                            {/* CHAT HEADER */}
                            <div className="h-[60px] px-4 bg-[#f0f2f5] flex items-center justify-between shrink-0 z-10 border-b border-white/20">
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="md:hidden h-8 w-8 text-slate-500"
                                        onClick={() => setSelectedConversation(null)}
                                    >
                                        <ChevronLeft className="h-6 w-6" />
                                    </Button>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedConv.clientImage} />
                                        <AvatarFallback className="bg-slate-300 text-slate-500">
                                            {selectedConv.clientName.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <h3 className="text-[16px] font-medium text-slate-900 truncate">{selectedConv.clientName}</h3>
                                        <p className="text-[12px] text-slate-500 truncate leading-none">Prof: {selectedConv.professionalName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="text-slate-500 h-10 w-10 rounded-full"><Search className="h-5 w-5" /></Button>
                                    <Button variant="ghost" size="icon" className="text-slate-500 h-10 w-10 rounded-full"><MoreVertical className="h-5 w-5" /></Button>
                                </div>
                            </div>

                            {/* CHAT MESSAGES */}
                            <ScrollArea className="flex-1 p-4 md:p-8 lg:px-20 z-10 messages-scroll-area">
                                <div className="space-y-2">
                                    {/* DAY SEPARATOR */}
                                    <div className="flex justify-center mb-6">
                                        <span className="px-3 py-1.5 bg-[#d9f1f1] text-[#54656f] text-[12.5px] font-medium rounded-lg uppercase tracking-wide shadow-sm">
                                            Modo Auditoría de Clínica
                                        </span>
                                    </div>

                                    {selectedConv.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((msg, i) => (
                                        <div key={msg.id} className={`flex w-full mb-1 ${msg.senderRole === 'client' ? 'justify-start' : 'justify-end'}`}>
                                            <div className={`relative px-2.5 py-1.5 min-w-[80px] max-w-[85%] sm:max-w-[70%] lg:max-w-[65%] shadow-sm text-[14.2px] ${msg.senderRole === 'client'
                                                ? 'bg-white rounded-lg rounded-tl-none'
                                                : 'bg-[#dcf8c6] rounded-lg rounded-tr-none'
                                                }`}>
                                                {/* MESSAGE TAIL (MOCK) */}
                                                <div className={`absolute top-0 w-2 h-3 ${msg.senderRole === 'client' ? '-left-2 bg-white [clip-path:polygon(100%_0,0_0,100%_100%)]' : '-right-2 bg-[#dcf8c6] [clip-path:polygon(0_0,100%_0,0_100%)]'}`} />

                                                <div className="flex flex-col gap-0.5">
                                                    <p className="text-slate-800 leading-tight pb-2 pr-6">{msg.content}</p>

                                                    <div className="flex items-center justify-end gap-1 absolute bottom-1 right-1.5">
                                                        <span className="text-[11px] text-slate-400 font-normal">
                                                            {format(new Date(msg.createdAt), "HH:mm")}
                                                        </span>
                                                        {msg.senderRole !== 'client' && (
                                                            <CheckCheck className="h-4 w-4 text-sky-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {/* BOTTOM INFO BANNER (INSTEAD OF INPUT) */}
                            <div className="h-[62px] bg-[#f0f2f5] px-4 flex items-center shrink-0 z-10 border-t border-slate-200">
                                <div className="w-full flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-100">
                                    <Clock className="h-5 w-5 text-slate-400" />
                                    <p className="text-sm text-slate-500 italic flex-1">
                                        Auditoría en tiempo real. No puedes enviar mensajes desde esta vista.
                                    </p>
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* EMPTY STATE (WHATSAPP WEB INITIAL) */
                        <div className="flex flex-col items-center justify-center p-12 text-center max-w-lg z-10">
                            <div className="relative mb-8">
                                <div className="h-32 w-32 rounded-full bg-slate-100 flex items-center justify-center">
                                    <MessageCircle className="h-16 w-16 text-slate-200" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-light text-slate-600 mb-4 tracking-tight">WhatsApp Audit for Tense</h2>
                            <p className="text-slate-500 text-sm leading-relaxed font-normal">
                                Supervisa las interacciones entre especialistas y pacientes.
                                La transparencia en la comunicación garantiza la calidad del tratamiento.
                            </p>
                            <div className="mt-12 pt-12 border-t border-slate-300/30 w-full">
                                <p className="text-xs text-slate-400 flex items-center justify-center gap-2 font-medium">
                                    <Clock className="h-3 w-3" /> Cifrado de extremo a extremo para la auditoría
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* CUSTOM STYLES FOR THE TAILS AND BACKGROUND */}
            <style jsx>{`
                .messages-scroll-area :global([data-radix-scroll-area-viewport]) {
                    display: flex !important;
                    flex-direction: column !important;
                }
            `}</style>
        </div>
    )
}
