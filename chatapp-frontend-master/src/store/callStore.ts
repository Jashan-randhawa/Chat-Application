import { create } from "zustand";

interface Call {
  from: { _id: string; name: string };
  chatId: string;
}

interface CallStore {
  incomingCall: Call | null;
  isCallActive: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  setIncomingCall: (call: Call | null) => void;
  setCallActive: (active: boolean) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  endCall: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  incomingCall: null,
  isCallActive: false,
  localStream: null,
  remoteStream: null,
  setIncomingCall: (call) => set({ incomingCall: call }),
  setCallActive: (active) => set({ isCallActive: active }),
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  endCall: () =>
    set({
      incomingCall: null,
      isCallActive: false,
      localStream: null,
      remoteStream: null,
    }),
}));
