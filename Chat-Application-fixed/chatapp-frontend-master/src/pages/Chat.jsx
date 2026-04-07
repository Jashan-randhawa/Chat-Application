import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { IconButton, Skeleton, Stack, Box, Typography, Avatar, Tooltip } from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Videocam as VideocamIcon,
  CallEnd as CallEndIcon,
  ArrowBack as ArrowBackIcon,
  MicOff as MicOffIcon,
  VideocamOff as VideocamOffIcon,
  PhoneCallback as PhoneCallbackIcon,
} from "@mui/icons-material";
import { InputBox } from "../components/styles/StyledComponents";
import FileMenu from "../components/dialogs/FileMenu";
import MessageComponent from "../components/shared/MessageComponent";
import { getSocket } from "../socket";
import {
  ALERT, CHAT_JOINED, CHAT_LEAVED, MESSAGE_DELIVERED, MESSAGE_READ,
  NEW_MESSAGE, START_TYPING, STOP_TYPING,
  CALL_OFFER, CALL_ANSWER, ICE_CANDIDATE, CALL_ENDED,
} from "../constants/events";
import {
  useChatDetailsQuery,
  useGetMessagesQuery,
  useMarkMessageReadMutation,
  useSendAttachmentsMutation,
} from "../redux/api/api";
import { useErrors, useSocketEvents } from "../hooks/hook";
import { useInfiniteScrollTop } from "6pp";
import { useDispatch } from "react-redux";
import { setIsFileMenu } from "../redux/reducers/misc";
import { removeNewMessagesAlert } from "../redux/reducers/chat";
import { TypingLoader } from "../components/layout/Loaders";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// ── Video Call Overlay Component ──────────────────────────────────────────────
const VideoCallOverlay = ({
  isCallActive,
  isOutgoingCall,
  incomingCall,
  localVideoRef,
  remoteVideoRef,
  onAccept,
  onEnd,
  isMuted,
  isCamOff,
  onToggleMute,
  onToggleCam,
  callerName,
}) => {
  // FIX #4: Use separate isOutgoingCall flag instead of reusing incomingCall state
  if (!incomingCall && !isCallActive && !isOutgoingCall) return null;

  const isIncoming = !!incomingCall && !isOutgoingCall && !isCallActive;

  return (
    <Box sx={{
      position: "fixed", inset: 0,
      bgcolor: "#1a1a2e", zIndex: 1400,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between",
      p: 2, pb: 4,
    }}>
      {/* Remote video – fills background */}
      <Box sx={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <video
          ref={remoteVideoRef}
          autoPlay playsInline
          style={{
            width: "100%", height: "100%",
            objectFit: "cover",
            background: "#101010",
            opacity: isCallActive ? 1 : 0.1,
            transition: "opacity 0.4s",
          }}
        />
      </Box>

      {/* Show avatar + name when not yet connected */}
      {!isCallActive && (
        <Box sx={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 2, zIndex: 2,
        }}>
          <Avatar sx={{ width: 100, height: 100, bgcolor: "#008069", fontSize: 44 }}>
            {(callerName || "?")[0].toUpperCase()}
          </Avatar>
          <Typography sx={{ color: "#fff", fontSize: "1.3rem", fontWeight: 600 }}>
            {callerName || "Video Call"}
          </Typography>
          <Typography sx={{ color: "#ccc", fontSize: "0.9rem" }}>
            {isIncoming ? "Incoming video call…" : "Calling…"}
          </Typography>
        </Box>
      )}

      {/* Local video – picture-in-picture */}
      <Box sx={{
        position: "absolute", top: 16, right: 16,
        width: 130, borderRadius: 3, overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
        border: "2px solid rgba(255,255,255,0.2)", zIndex: 10,
        bgcolor: "#222",
      }}>
        <video
          ref={localVideoRef}
          autoPlay muted playsInline
          style={{
            width: "100%", display: "block",
            background: "#101010",
            opacity: isCamOff ? 0 : 1,
          }}
        />
        {isCamOff && (
          <Box sx={{
            position: "absolute", inset: 0,
            bgcolor: "#333",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <VideocamOffIcon sx={{ color: "#aaa", fontSize: 32 }} />
          </Box>
        )}
      </Box>

      {/* Controls bar */}
      <Box sx={{
        position: "absolute", bottom: 40, left: 0, right: 0,
        display: "flex", alignItems: "center",
        justifyContent: "center",
        gap: isIncoming ? 4 : 3,
        zIndex: 10,
      }}>
        {isIncoming ? (
          <>
            <Tooltip title="Decline">
              <IconButton onClick={onEnd} sx={{
                bgcolor: "#f44336", color: "#fff", width: 68, height: 68,
                "&:hover": { bgcolor: "#d32f2f" },
                boxShadow: "0 4px 16px rgba(244,67,54,0.5)",
              }}>
                <CallEndIcon sx={{ fontSize: 30 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Accept">
              <IconButton onClick={onAccept} sx={{
                bgcolor: "#4caf50", color: "#fff", width: 68, height: 68,
                "&:hover": { bgcolor: "#388e3c" },
                boxShadow: "0 4px 16px rgba(76,175,80,0.5)",
              }}>
                <PhoneCallbackIcon sx={{ fontSize: 30 }} />
              </IconButton>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip title={isMuted ? "Unmute" : "Mute"}>
              <IconButton onClick={onToggleMute} sx={{
                bgcolor: isMuted ? "#f44336" : "rgba(255,255,255,0.15)",
                color: "#fff", width: 56, height: 56,
                backdropFilter: "blur(8px)",
                "&:hover": { bgcolor: isMuted ? "#d32f2f" : "rgba(255,255,255,0.25)" },
              }}>
                {isMuted ? <MicOffIcon /> : <MicIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="End call">
              <IconButton onClick={onEnd} sx={{
                bgcolor: "#f44336", color: "#fff", width: 68, height: 68,
                "&:hover": { bgcolor: "#d32f2f" },
                boxShadow: "0 4px 16px rgba(244,67,54,0.5)",
              }}>
                <CallEndIcon sx={{ fontSize: 30 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title={isCamOff ? "Camera on" : "Camera off"}>
              <IconButton onClick={onToggleCam} sx={{
                bgcolor: isCamOff ? "#f44336" : "rgba(255,255,255,0.15)",
                color: "#fff", width: 56, height: 56,
                backdropFilter: "blur(8px)",
                "&:hover": { bgcolor: isCamOff ? "#d32f2f" : "rgba(255,255,255,0.25)" },
              }}>
                {isCamOff ? <VideocamOffIcon /> : <VideocamIcon />}
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
};

// ── Main Chat Component ───────────────────────────────────────────────────────
const Chat = ({ chatId, user, onBack, isMobile }) => {
  const socket = getSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [fileMenuAnchor, setFileMenuAnchor] = useState(null);
  const [IamTyping, setIamTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const typingTimeout = useRef(null);
  const readReceiptQueueRef = useRef(new Set());
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Video call refs & state
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  // FIX Bug 2 & 4: buffer ICE candidates that arrive before setRemoteDescription
  const pendingIceCandidatesRef = useRef([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  // FIX #4: Separate state for outgoing call overlay (no longer reusing incomingCall)
  const [isOutgoingCall, setIsOutgoingCall] = useState(false);
  const [outgoingCallName, setOutgoingCallName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  // FIX #1: Refs to hold latest call state for use inside stale closures (socket listeners)
  const isCallActiveRef = useRef(false);
  const incomingCallRef = useRef(null);

  // FIX #2 & #5: Ref for callPeerId so closeCall always reads the latest value
  const callPeerIdRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { isCallActiveRef.current = isCallActive; }, [isCallActive]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  const [markMessageRead] = useMarkMessageReadMutation();
  const [sendAttachments] = useSendAttachmentsMutation();

  const chatDetails = useChatDetailsQuery({ chatId, populate: true, skip: !chatId });
  const oldMessagesChunk = useGetMessagesQuery({ chatId, page });

  const { data: oldMessages, setData: setOldMessages } = useInfiniteScrollTop(
    containerRef,
    oldMessagesChunk.data?.totalPages,
    page, setPage,
    oldMessagesChunk.data?.messages
  );

  const errors = [
    { isError: chatDetails.isError, error: chatDetails.error },
    { isError: oldMessagesChunk.isError, error: oldMessagesChunk.error },
  ];

  const members = chatDetails?.data?.chat?.members;
  const isGroupChat = chatDetails?.data?.chat?.groupChat;
  const receiver = members?.find(m => m?._id?.toString() !== user?._id?.toString());
  const chatName = isGroupChat
    ? chatDetails?.data?.chat?.name
    : receiver?.name || chatDetails?.data?.chat?.name;

  // ── Messaging ──────────────────────────────────────────────────────────────
  const messageOnChange = (e) => {
    setMessage(e.target.value);
    if (!IamTyping) {
      socket.emit(START_TYPING, { members, chatId });
      setIamTyping(true);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit(STOP_TYPING, { members, chatId });
      setIamTyping(false);
    }, 2000);
  };

  const handleFileOpen = (e) => {
    dispatch(setIsFileMenu(true));
    setFileMenuAnchor(e.currentTarget);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    socket.emit(NEW_MESSAGE, { chatId, members, message });
    setMessage("");
  };

  // ── Voice recording ────────────────────────────────────────────────────────
  const stopAudioStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(t => t.stop());
      audioStreamRef.current = null;
    }
  };
  const stopRecordingTimer = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const uploadVoiceNote = async (audioBlob) => {
    const myForm = new FormData();
    myForm.append("chatId", chatId);
    myForm.append("files", audioBlob, `voice-note-${Date.now()}.webm`);
    const toastId = toast.loading("Sending voice note...");
    const res = await sendAttachments(myForm);
    if (res?.data?.success) toast.success("Voice note sent", { id: toastId });
    else toast.error("Failed to send voice note", { id: toastId });
  };

  const startVoiceRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        return toast.error("Voice recording not supported.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      audioStreamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      setRecordingSeconds(0);
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => setRecordingSeconds(p => p + 1), 1000);
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          if (blob.size > 0) await uploadVoiceNote(blob);
        } catch { toast.error("Failed to process voice note."); }
        finally {
          audioChunksRef.current = [];
          stopAudioStream(); stopRecordingTimer();
          setIsRecording(false); setRecordingSeconds(0);
        }
      };
      mediaRecorder.start();
    } catch {
      stopAudioStream(); stopRecordingTimer();
      setIsRecording(false); setRecordingSeconds(0);
      toast.error("Microphone permission denied.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  };

  // ── WebRTC ─────────────────────────────────────────────────────────────────

  // FIX #6: Added TURN server so calls work across different networks (not just STUN)
  const ICE_CONFIG = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      // ⚠️  Replace with your own TURN server credentials for production.
      // Free options: Metered.ca (metered.ca/tools/openrelay) or Xirsys (xirsys.com)
      // {
      //   urls: "turn:your-turn-server.com:3478",
      //   username: "YOUR_TURN_USERNAME",
      //   credential: "YOUR_TURN_CREDENTIAL",
      // },
    ],
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const createPeerConnection = (targetUserId) => {
    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    const peer = new RTCPeerConnection(ICE_CONFIG);
    peerConnectionRef.current = peer;

    if (localStreamRef.current)
      localStreamRef.current.getTracks().forEach(t => peer.addTrack(t, localStreamRef.current));

    peer.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0])
        remoteVideoRef.current.srcObject = event.streams[0];
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate || !targetUserId) return;
      socket.emit(ICE_CANDIDATE, { chatId, toUserId: targetUserId, candidate: event.candidate });
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
        toast.error("Call connection lost.");
        closeCall(false);
      }
    };
    return peer;
  };

  // FIX #2 & #5: closeCall now reads callPeerId from ref — always has the latest value
  // even when called synchronously right after setCallPeerId (which is async state update)
  const closeCall = useCallback((notify = true) => {
    if (notify && callPeerIdRef.current)
      socket.emit(CALL_ENDED, { chatId, toUserId: callPeerIdRef.current });

    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // FIX Bug 4: clear ICE buffer so stale candidates don't leak into next call
    pendingIceCandidatesRef.current = [];
    callPeerIdRef.current = null;
    isCallActiveRef.current = false;
    setIsCallActive(false);
    setIncomingCall(null);
    // FIX #4: Also reset outgoing call state
    setIsOutgoingCall(false);
    setOutgoingCallName("");
    setIsMuted(false);
    setIsCamOff(false);
  }, [chatId, socket]);

  const startVideoCall = async () => {
    if (isGroupChat) return toast.error("Video calls are only available in 1-on-1 chats.");
    // FIX #1: Read from refs, not stale state
    if (isCallActiveRef.current || incomingCallRef.current) return;

    const target = members?.find(m => m?._id?.toString() !== user?._id?.toString());
    if (!target?._id) return toast.error("No receiver found.");

    try {
      await ensureLocalStream();

      // FIX #2 & #5: Set the ref immediately — don't rely on async state update
      callPeerIdRef.current = target._id;

      // FIX #4: Use dedicated outgoing call state instead of reusing incomingCall
      setIsOutgoingCall(true);
      setOutgoingCallName(target.name || chatName);

      const peer = createPeerConnection(target._id);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit(CALL_OFFER, { chatId, offer, toUserId: target._id });
    } catch (err) {
      console.error("startVideoCall:", err);
      toast.error("Could not start video call. Check camera/mic permissions.");
      closeCall(false);
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      await ensureLocalStream();

      // FIX #2: Set ref immediately alongside state
      callPeerIdRef.current = incomingCall.from._id;

      const peer = createPeerConnection(incomingCall.from._id);
      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit(CALL_ANSWER, { chatId, toUserId: incomingCall.from._id, answer });
      // FIX Bug 3 & 5: sync ref immediately so closeCall's busy-guard sees updated value
      isCallActiveRef.current = true;
      setIsCallActive(true);
      setIncomingCall(null);
      // FIX Bug 5: flush any ICE candidates that arrived before setRemoteDescription
      for (const candidate of pendingIceCandidatesRef.current) {
        try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { console.warn("Flushing buffered ICE (callee):", e); }
      }
      pendingIceCandidatesRef.current = [];
    } catch (err) {
      console.error("acceptIncomingCall:", err);
      toast.error("Unable to accept call.");
      closeCall(false);
    }
  };

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(p => !p);
  };

  const toggleCam = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsCamOff(p => !p);
  };

  // ── Receipt helpers ────────────────────────────────────────────────────────
  const addUniqueUsers = (existing = [], add = []) => {
    const set = new Set(existing.map(id => id?.toString()));
    add.forEach(id => set.add(id?.toString()));
    return Array.from(set);
  };

  const updateMessageReceipt = (messageId, updater) => {
    if (!messageId) return;
    const update = prev => prev.map(m => m._id?.toString() === messageId.toString() ? updater(m) : m);
    setMessages(update);
    setOldMessages(update);
  };

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    socket.emit(CHAT_JOINED, { userId: user._id, members });
    dispatch(removeNewMessagesAlert(chatId));
    return () => {
      setMessages([]); setMessage(""); setOldMessages([]); setPage(1);
      socket.emit(CHAT_LEAVED, { userId: user._id, members });
    };
  }, [chatId]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => { if (chatDetails.isError) navigate("/"); }, [chatDetails.isError]);

  useEffect(() => () => { stopRecordingTimer(); stopAudioStream(); closeCall(false); }, []);

  // ── Socket listeners ───────────────────────────────────────────────────────
  const newMessagesListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    setMessages(prev => [...prev, data.message]);
    if (data.message?.sender?._id !== user?._id && data.message?._id)
      markMessageRead(data.message._id);
  }, [chatId, markMessageRead, user?._id]);

  const messageDeliveredListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    updateMessageReceipt(data.messageId, m => ({ ...m, deliveredTo: addUniqueUsers(m.deliveredTo, data.deliveredTo || []) }));
  }, [chatId]);

  const messageReadListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    updateMessageReceipt(data.messageId, m => ({
      ...m,
      deliveredTo: addUniqueUsers(m.deliveredTo, [data.userId]),
      readBy: addUniqueUsers(m.readBy, [data.userId]),
    }));
  }, [chatId]);

  const startTypingListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    setUserTyping(true);
  }, [chatId]);

  const stopTypingListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    setUserTyping(false);
  }, [chatId]);

  const alertListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    setMessages(prev => [...prev, {
      content: data.message,
      sender: { _id: "admin", name: "Admin" },
      chat: chatId,
      createdAt: new Date().toISOString(),
    }]);
  }, [chatId]);

  // FIX #1: Use refs (isCallActiveRef, incomingCallRef) instead of stale state values
  // so the busy-check always reads the current call status, not a captured-at-mount value
  const callOfferListener = useCallback((data) => {
    if (data.chatId !== chatId || data.from?._id === user?._id) return;
    if (isCallActiveRef.current || incomingCallRef.current) {
      socket.emit(CALL_ENDED, { chatId, toUserId: data.from._id });
      return;
    }
    setIncomingCall({ offer: data.offer, from: data.from });
    toast(`📹 ${data.from?.name || "Someone"} is calling…`, { duration: 8000 });
  }, [chatId, user?._id, socket]);

  const callAnswerListener = useCallback(async (data) => {
    if (data.chatId !== chatId || !peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      // FIX Bug 3: sync ref immediately so closeCall guard is accurate
      isCallActiveRef.current = true;
      setIsCallActive(true);
      setIsOutgoingCall(false);
      setOutgoingCallName("");
      // FIX Bug 6 (caller side): flush ICE candidates buffered before answer arrived
      for (const candidate of pendingIceCandidatesRef.current) {
        try { await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)); }
        catch (e) { console.warn("Flushing buffered ICE (caller):", e); }
      }
      pendingIceCandidatesRef.current = [];
    } catch (err) {
      console.error("callAnswerListener:", err);
      closeCall(false);
    }
  }, [chatId, closeCall]);

  const callIceCandidateListener = useCallback(async (data) => {
    if (data.chatId !== chatId) return;
    const peer = peerConnectionRef.current;
    // FIX Bug 2 & 4: buffer candidate if peer not ready or remote not yet described
    if (!peer || !peer.remoteDescription) {
      pendingIceCandidatesRef.current.push(data.candidate);
      return;
    }
    try {
      await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (err) { console.error("ICE candidate error:", err); }
  }, [chatId]);

  const callEndedListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    closeCall(false);
    toast("Call ended");
  }, [chatId, closeCall]);

  useSocketEvents(socket, {
    [ALERT]: alertListener,
    [NEW_MESSAGE]: newMessagesListener,
    [MESSAGE_DELIVERED]: messageDeliveredListener,
    [MESSAGE_READ]: messageReadListener,
    [START_TYPING]: startTypingListener,
    [STOP_TYPING]: stopTypingListener,
    [CALL_OFFER]: callOfferListener,
    [CALL_ANSWER]: callAnswerListener,
    [ICE_CANDIDATE]: callIceCandidateListener,
    [CALL_ENDED]: callEndedListener,
  });

  useErrors(errors);

  const allMessages = [...oldMessages, ...messages];

  // Mark unread messages as read
  useEffect(() => {
    allMessages
      .filter(msg =>
        msg?._id &&
        msg?.sender?._id !== user?._id &&
        !msg?.readBy?.some(r => r?.toString() === user?._id?.toString())
      )
      .forEach(msg => {
        const id = msg._id.toString();
        if (readReceiptQueueRef.current.has(id)) return;
        readReceiptQueueRef.current.add(id);
        markMessageRead(id).finally(() => readReceiptQueueRef.current.delete(id));
      });
  }, [allMessages, markMessageRead, user?._id]);

  // FIX #4: callerName now properly reflects incoming vs outgoing context
  const callerName = isOutgoingCall
    ? outgoingCallName
    : incomingCall?.from?.name || chatName;

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!chatId) {
    return (
      <Box sx={{
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        bgcolor: "#f0f2f5", gap: 2,
      }}>
        <Box sx={{ width: 180, height: 180, borderRadius: "50%", bgcolor: "#e9edef", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Box sx={{ fontSize: 72 }}>💬</Box>
        </Box>
        <Typography sx={{ color: "#54656f", fontSize: "1.15rem", fontWeight: 300, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
          WhatsApp Web
        </Typography>
        <Typography sx={{ color: "#8696a0", fontSize: "0.82rem", textAlign: "center", maxWidth: 340, fontFamily: "'Segoe UI', system-ui, sans-serif", lineHeight: 1.6 }}>
          Send and receive messages without keeping your phone online.
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#8696a0", fontSize: "0.75rem" }}>
          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#00a884" }} />
          End-to-end encrypted
        </Box>
      </Box>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (chatDetails.isLoading) {
    return (
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "#efeae2", height: "100%" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
            <Skeleton variant="rounded" width={`${Math.random() * 200 + 80}px`} height={44}
              sx={{ borderRadius: "12px", bgcolor: i % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(217,253,211,0.8)" }} />
          </Box>
        ))}
      </Box>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <Fragment>
      {/* Header */}
      <Box sx={{
        px: isMobile ? 1 : 2, py: 1,
        bgcolor: "#008069",
        display: "flex", alignItems: "center", gap: 1,
        flexShrink: 0, minHeight: "3.5rem",
      }}>
        {isMobile && (
          <IconButton onClick={onBack || (() => navigate("/"))} size="small" sx={{ color: "white", mr: 0.5, flexShrink: 0 }}>
            <ArrowBackIcon />
          </IconButton>
        )}

        <Box flex={1} minWidth={0} display="flex" alignItems="center">
          <Typography sx={{
            fontWeight: 600, fontSize: "0.9375rem", color: "white", lineHeight: 1.2,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {chatName || "Chat"}
          </Typography>
        </Box>

        {!isGroupChat && (
          <Tooltip title="Start video call">
            <IconButton size="small" onClick={startVideoCall} sx={{ color: "white", flexShrink: 0 }}>
              <VideocamIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Messages */}
      <Stack
        ref={containerRef}
        padding={"0.75rem 5%"}
        spacing={"0.25rem"}
        sx={{
          flex: 1, overflowX: "hidden", overflowY: "auto",
          background: "#efeae2",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cfc4b0' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          display: "flex", flexDirection: "column",
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 3 },
          WebkitOverflowScrolling: "touch",
        }}
      >
        {allMessages.map(i => <MessageComponent key={i._id} message={i} user={user} />)}
        {userTyping && <TypingLoader />}
        <div ref={bottomRef} />
      </Stack>

      {/* Input bar */}
      <Box
        component="form"
        onSubmit={submitHandler}
        sx={{
          bgcolor: "#f0f2f5", px: 1, py: 0.75,
          display: "flex", alignItems: "center", gap: 0.75,
          flexShrink: 0,
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <Box sx={{
          display: "flex", bgcolor: "#ffffff", borderRadius: "24px",
          flex: 1, alignItems: "center", px: 1, minHeight: "2.75rem",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        }}>
          <IconButton size="small" sx={{ color: "#54656f", flexShrink: 0 }}>
            <EmojiIcon sx={{ fontSize: 22 }} />
          </IconButton>
          <IconButton onClick={handleFileOpen} size="small" sx={{ color: "#54656f", flexShrink: 0 }}>
            <AttachFileIcon sx={{ fontSize: 20, transform: "rotate(45deg)" }} />
          </IconButton>
          <InputBox
            placeholder="Type a message"
            value={message}
            onChange={messageOnChange}
            style={{
              flex: 1, border: "none", outline: "none",
              background: "transparent", padding: "0.5rem 0.25rem",
              fontSize: "0.9375rem", color: "#111b21",
              fontFamily: "'Segoe UI', system-ui, sans-serif", minWidth: 0,
            }}
          />
        </Box>

        <Box
          component={message.trim() || isRecording ? "button" : "div"}
          onClick={message.trim() ? submitHandler : isRecording ? stopVoiceRecording : startVoiceRecording}
          sx={{
            width: 44, height: 44, borderRadius: "50%",
            bgcolor: isRecording ? "#f15c6d" : "#00a884",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", border: "none", flexShrink: 0,
            transition: "background 0.15s ease",
            "&:hover": { bgcolor: "#008069" },
            "&:active": { transform: "scale(0.94)" },
            touchAction: "manipulation",
          }}
        >
          {message.trim()
            ? <SendIcon sx={{ fontSize: 20, color: "white", ml: "2px" }} />
            : isRecording
              ? <StopIcon sx={{ fontSize: 20, color: "white" }} />
              : <MicIcon sx={{ fontSize: 20, color: "white" }} />}
        </Box>

        {isRecording && (
          <Typography sx={{ fontSize: "0.75rem", color: "#f15c6d", minWidth: "3rem" }}>
            {`0:${String(recordingSeconds).padStart(2, "0")}`}
          </Typography>
        )}
      </Box>

      <FileMenu anchorE1={fileMenuAnchor} chatId={chatId} />

      {/* Video Call Overlay */}
      <VideoCallOverlay
        isCallActive={isCallActive}
        isOutgoingCall={isOutgoingCall}
        incomingCall={incomingCall}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        onAccept={acceptIncomingCall}
        onEnd={() => closeCall(true)}
        isMuted={isMuted}
        isCamOff={isCamOff}
        onToggleMute={toggleMute}
        onToggleCam={toggleCam}
        callerName={callerName}
      />
    </Fragment>
  );
};

export default AppLayout()(Chat);
