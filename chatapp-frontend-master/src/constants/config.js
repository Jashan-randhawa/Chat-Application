const defaultServer = "http://localhost:3000";

const configuredServer = (import.meta.env.VITE_SERVER || defaultServer).trim();

export const server = configuredServer.replace(/\/+$/, "");
