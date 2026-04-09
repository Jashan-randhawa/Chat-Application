const TOKEN_KEY = "chatapp-token";
const USER_KEY = "chatapp-user";

export const saveToken = (token: string) => {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { }
};

export const getToken = (): string | null => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

export const clearToken = () => {
  try { localStorage.removeItem(TOKEN_KEY); } catch { }
};

export const saveUser = (user: object) => {
  try { localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { }
};

export const getStoredUser = () => {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};

export const clearUser = () => {
  try { localStorage.removeItem(USER_KEY); } catch { }
};

export const clearAll = () => {
  clearToken();
  clearUser();
};
