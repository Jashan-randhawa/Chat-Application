import axios from "axios";
import { server } from "@/config/constants";
import { getToken, clearAll } from "@/lib/token";

const api = axios.create({
  baseURL: `${server}/api/v1`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Attach Bearer token to every request if available
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear stored auth and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute =
        error.config?.url?.includes("/user/login") ||
        error.config?.url?.includes("/user/new") ||
        error.config?.url?.includes("/admin/verify");
      if (!isAuthRoute) {
        clearAll();
        // Only redirect if not already on login
        if (!window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/admin")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──
export const loginUser = (data: { username: string; password: string }) =>
  api.post("/user/login", data);

export const registerUser = (formData: FormData) =>
  api.post("/user/new", formData, { headers: { "Content-Type": "multipart/form-data" } });

export const getMyProfile = () => api.get("/user/me");

export const logoutUser = () => api.get("/user/logout");

// ── Users ──
export const searchUsers = (name: string) => api.get(`/user/search?name=${name}`);

export const sendFriendRequest = (userId: string) =>
  api.put("/user/sendrequest", { userId });

export const acceptFriendRequest = (requestId: string, accept: boolean) =>
  api.put("/user/acceptrequest", { requestId, accept });

export const getNotifications = () => api.get("/user/notifications");

export const getMyFriends = (chatId?: string) =>
  api.get(`/user/friends${chatId ? `?chatId=${chatId}` : ""}`);

// ── Chats ──
export const getMyChats = () => api.get("/chat/my");

export const getMyGroups = () => api.get("/chat/my/groups");

export const newGroupChat = (name: string, members: string[]) =>
  api.post("/chat/new", { name, members });

export const getChatDetails = (chatId: string, populate = false) =>
  api.get(`/chat/${chatId}${populate ? "?populate=true" : ""}`);

export const renameGroup = (chatId: string, name: string) =>
  api.put(`/chat/${chatId}`, { name });

export const addMembers = (chatId: string, members: string[]) =>
  api.put("/chat/addmembers", { chatId, members });

export const removeMember = (chatId: string, userId: string) =>
  api.put("/chat/removemember", { chatId, userId });

export const deleteChat = (chatId: string) => api.delete(`/chat/${chatId}`);

export const leaveGroup = (chatId: string) => api.delete(`/chat/leave/${chatId}`);

export const getMessages = (chatId: string, page = 1) =>
  api.get(`/chat/message/${chatId}?page=${page}`);

export const sendAttachments = (formData: FormData) =>
  api.post("/chat/message", formData, { headers: { "Content-Type": "multipart/form-data" } });

// ── Admin ──
export const adminLogin = (secretKey: string) =>
  api.post("/admin/verify", { secretKey });

export const getAdmin = () => api.get("/admin/");

export const adminLogout = () => api.get("/admin/logout");

export const adminGetUsers = () => api.get("/admin/users");

export const adminGetChats = () => api.get("/admin/chats");

export const adminGetMessages = () => api.get("/admin/messages");

export const adminGetStats = () => api.get("/admin/stats");

// ── Status ──
export const getFriendsStatuses = () => api.get("/status");

export const addTextStatus = (content: string, background: string) =>
  api.post("/status", { type: "text", content, background });

export const addImageStatus = (formData: FormData) =>
  api.post("/status", formData, { headers: { "Content-Type": "multipart/form-data" } });

export const markStatusViewed = (statusId: string, slideId: string) =>
  api.put(`/status/${statusId}/view/${slideId}`);

export const deleteStatusSlide = (statusId: string, slideId: string) =>
  api.delete(`/status/${statusId}/slide/${slideId}`);

export default api;
