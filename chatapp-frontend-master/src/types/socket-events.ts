export const SOCKET_EVENTS = {
  NEW_MESSAGE: "message:new",
  MESSAGE_DELIVERED: "message:delivered",
  MESSAGE_READ: "message:read",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",
  USERS_ONLINE: "users:online",
  CALL_OFFER: "call:offer",
  CALL_ANSWER: "call:answer",
  ICE_CANDIDATE: "call:ice-candidate",
  CALL_ENDED: "call:ended",
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
