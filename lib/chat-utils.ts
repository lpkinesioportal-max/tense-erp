import type { ChatMessage, ChatConversation } from "./types"

// In-memory storage for chat messages and conversations
export let chatMessages: ChatMessage[] = []
export let myConversations: ChatConversation[] = []

// Initialize from localStorage if available
if (typeof window !== "undefined") {
  const savedMessages = localStorage.getItem("tense_chat_messages")
  const savedConversations = localStorage.getItem("tense_chat_conversations")

  if (savedMessages) {
    chatMessages = JSON.parse(savedMessages)
  }
  if (savedConversations) {
    myConversations = JSON.parse(savedConversations)
  }
}

export function addChatMessage(message: Omit<ChatMessage, "id" | "createdAt">): ChatMessage {
  const newMessage: ChatMessage = {
    ...message,
    id: `msg-${Date.now()}`,
    createdAt: new Date(),
  }

  chatMessages = [...chatMessages, newMessage]

  // Update conversation's last message
  const convIndex = myConversations.findIndex((c) => c.id === message.conversationId)
  if (convIndex !== -1) {
    myConversations[convIndex] = {
      ...myConversations[convIndex],
      lastMessage: message.content,
      lastMessageAt: new Date(),
      unreadCount:
        message.senderRole === "client"
          ? myConversations[convIndex].unreadCount + 1
          : myConversations[convIndex].unreadCount,
    }
  }

  // Save to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("tense_chat_messages", JSON.stringify(chatMessages))
    localStorage.setItem("tense_chat_conversations", JSON.stringify(myConversations))
  }

  return newMessage
}

export function createConversation(clientId: string, professionalId: string): ChatConversation {
  const existing = myConversations.find((c) => c.clientId === clientId && c.professionalId === professionalId)

  if (existing) return existing

  const newConversation: ChatConversation = {
    id: `conv-${Date.now()}`,
    clientId,
    professionalId,
    lastMessage: "",
    lastMessageAt: new Date(),
    unreadCount: 0,
    createdAt: new Date(),
  }

  myConversations = [...myConversations, newConversation]

  if (typeof window !== "undefined") {
    localStorage.setItem("tense_chat_conversations", JSON.stringify(myConversations))
  }

  return newConversation
}

export function markConversationAsRead(conversationId: string): void {
  const convIndex = myConversations.findIndex((c) => c.id === conversationId)
  if (convIndex !== -1) {
    myConversations[convIndex] = {
      ...myConversations[convIndex],
      unreadCount: 0,
    }

    // Mark all messages in conversation as read
    chatMessages = chatMessages.map((msg) => (msg.conversationId === conversationId ? { ...msg, isRead: true } : msg))

    if (typeof window !== "undefined") {
      localStorage.setItem("tense_chat_messages", JSON.stringify(chatMessages))
      localStorage.setItem("tense_chat_conversations", JSON.stringify(myConversations))
    }
  }
}

export function getConversationsForProfessional(professionalId: string): ChatConversation[] {
  return myConversations.filter((c) => c.professionalId === professionalId)
}

export function getConversationsForClient(clientId: string): ChatConversation[] {
  return myConversations.filter((c) => c.clientId === clientId)
}

export function getMessagesForConversation(conversationId: string): ChatMessage[] {
  return chatMessages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}
