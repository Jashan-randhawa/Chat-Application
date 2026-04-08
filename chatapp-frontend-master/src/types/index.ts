export interface User {
  _id: string;
  username: string;
  name: string;
  email: string;
  avatar: {
    public_id: string;
    url: string;
  };
  bio: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  public_id: string;
  url: string;
}

export interface Message {
  _id: string;
  content: string;
  sender: User | string;
  chat: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  deliveredTo: string[];
  readBy: string[];
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
}

export interface Chat {
  _id: string;
  name: string;
  groupChat: boolean;
  creator?: string;
  members: string[] | User[];
  avatar?: string[];
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
}

export interface Request {
  _id: string;
  status: "pending" | "accepted" | "rejected";
  sender: User | string;
  receiver: User | string;
  createdAt: string;
}

export interface NewMessageAlert {
  chatId: string;
  count: number;
}

export namespace SocketPayloads {
  export interface NewMessage {
    chatId: string;
    message: Message;
  }

  export interface TypingStart {
    chatId: string;
  }

  export interface TypingStop {
    chatId: string;
  }

  export interface OnlineUsers {
    userIds: string[];
  }

  export interface MessageDelivered {
    chatId: string;
    messageId: string;
    deliveredTo: string[];
  }

  export interface CallOffer {
    chatId: string;
    offer: RTCSessionDescription;
    from: { _id: string; name: string };
  }

  export interface IceCandidate {
    chatId: string;
    candidate: RTCIceCandidate;
    fromUserId: string;
  }
}
