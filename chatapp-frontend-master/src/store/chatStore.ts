import { create } from "zustand";
import type { Chat, Message, NewMessageAlert } from "../types";

interface ChatStore {
  chats: Chat[];
  selectedChatId: string | null;
  messages: Record<string, Message[]>;
  newMessagesAlert: NewMessageAlert[];
  onlineUsers: Set<string>;
  typingUsers: Set<string>;
  notificationCount: number;
  setChats: (chats: Chat[]) => void;
  selectChat: (chatId: string | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (messageId: string) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  prependMessages: (chatId: string, messages: Message[]) => void;
  addNewMessageAlert: (chatId: string) => void;
  removeNewMessageAlert: (chatId: string) => void;
  resetNotificationCount: () => void;
  setOnlineUsers: (userIds: string[]) => void;
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  chats: [],
  selectedChatId: null,
  messages: {},
  newMessagesAlert: [],
  onlineUsers: new Set(),
  typingUsers: new Set(),
  notificationCount: 0,
  setChats: (chats) => set({ chats }),
  selectChat: (chatId) => set({ selectedChatId: chatId }),
  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),
  updateMessage: (messageId, updates) =>
    set((state) => {
      const nextMessages = { ...state.messages };
      for (const chatId of Object.keys(nextMessages)) {
        const index = nextMessages[chatId].findIndex((message) => message._id === messageId);
        if (index !== -1) {
          nextMessages[chatId][index] = {
            ...nextMessages[chatId][index],
            ...updates,
          };
          break;
        }
      }
      return { messages: nextMessages };
    }),
  deleteMessage: (messageId) =>
    set((state) => {
      const nextMessages = { ...state.messages };
      for (const chatId of Object.keys(nextMessages)) {
        nextMessages[chatId] = nextMessages[chatId].filter((message) => message._id !== messageId);
      }
      return { messages: nextMessages };
    }),
  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages,
      },
    })),
  prependMessages: (chatId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...messages, ...(state.messages[chatId] || [])],
      },
    })),
  addNewMessageAlert: (chatId) =>
    set((state) => {
      const existing = state.newMessagesAlert.find((alert) => alert.chatId === chatId);
      if (existing) {
        return {
          newMessagesAlert: state.newMessagesAlert.map((alert) =>
            alert.chatId === chatId ? { ...alert, count: alert.count + 1 } : alert
          ),
        };
      }
      return {
        newMessagesAlert: [...state.newMessagesAlert, { chatId, count: 1 }],
      };
    }),
  removeNewMessageAlert: (chatId) =>
    set((state) => ({
      newMessagesAlert: state.newMessagesAlert.filter((alert) => alert.chatId !== chatId),
    })),
  resetNotificationCount: () => set({ notificationCount: 0 }),
  setOnlineUsers: (userIds) => set({ onlineUsers: new Set(userIds) }),
  addTypingUser: (userId) =>
    set((state) => ({
      typingUsers: new Set([...state.typingUsers, userId]),
    })),
  removeTypingUser: (userId) =>
    set((state) => {
      const nextTypingUsers = new Set(state.typingUsers);
      nextTypingUsers.delete(userId);
      return { typingUsers: nextTypingUsers };
    }),
}));
