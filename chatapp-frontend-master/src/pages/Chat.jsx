import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useMicrophonePermission } from "../hooks/useMicrophonePermission";
import MicPermissionDialog from "../components/shared/MicPermissionDialog";
import AppLayout from "../components/layout/AppLayout";
import { IconButton, Skeleton, Stack, Box, Typography, Avatar, Tooltip } from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  CallEnd as CallEndIcon,
  ArrowBack as ArrowBackIcon,
  MicOff as MicOffIcon,
  PhoneCallback as PhoneCallbackIcon,
  Phone as PhoneIcon,
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

// ── Voice Call Overlay Component ──────────────────────────────────────────────
const VoiceCallOverlay = ({
  isCallActive,
  isOutgoingCall,
  incomingCall,
  onAccept,
  onEnd,
  isMuted,
  onToggleMute,
  callerName,
  callDuration,
}) => {
  if (!incomingCall && !isCallActive && !isOutgoingCall) return null;

  const isIncoming = !!incomingCall && !isOutgoingCall && !isCallActive;

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <Box sx={{
      position: "fixed", inset: 0,
      background: "linear-gradient(160deg, #1a3a2e 0%, #0d2318 100%)",
      zIndex: 1400,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "space-between",
      p: { xs: 3, sm: 4 }, pb: { xs: 5, sm: 6 },
    }}>
      {/* Top area – caller info */}
      <Box sx={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 2.5, mt: { xs: 4, sm: 6 },
      }}>
        {/* Animated avatar ring */}
        <Box sx={{ position: "relative" }}>
          {isCallActive && (
            <Box sx={{
              position: "absolute", inset: -10,
              borderRadius: "50%",
              border: "2px solid rgba(0,168,132,0.4)",
              animation: "ripple 1.8s ease-out infinite",
              "@keyframes ripple": {
                "0%": { transform: "scale(1)", opacity: 0.7 },
                "100%": { transform: "scale(1.4)", opacity: 0 },
              },
            }} />
          )}
          <Avatar sx={{
            width: { xs: 88, sm: 110 },
            height: { xs: 88, sm: 110 },
            bgcolor: "#00a884",
            fontSize: { xs: 36, sm: 46 },
            boxShadow: "0 8px 32px rgba(0,168,132,0.4)",
            border: "3px solid rgba(255,255,255,0.15)",
          }}>
            {(callerName || "?")[0].toUpperCase()}
          </Avatar>
        </Box>

        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "#fff", fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 700, letterSpacing: "-0.02em" }}>
            {callerName || "Voice Call"}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", mt: 0.5 }}>
            {isIncoming
              ? "Incoming voice call…"
              : isCallActive
                ? formatDuration(callDuration)
                : "Calling…"}
          </Typography>
        </Box>
      </Box>

      {/* Controls bar */}
      <Box sx={{
        display: "flex", alignItems: "center",
        justifyContent: "center",
        gap: isIncoming ? { xs: 4, sm: 5 } : { xs: 3, sm: 4 },
        maxWidth: 320, width: "100%",
      }}>
        {isIncoming ? (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Tooltip title="Decline">
                <IconButton onClick={onEnd} sx={{
                  bgcolor: "#f44336", color: "#fff",
                  width: { xs: 64, sm: 72 }, height: { xs: 64, sm: 72 },
                  "&:hover": { bgcolor: "#d32f2f" },
                  boxShadow: "0 4px 20px rgba(244,67,54,0.5)",
                }}>
                  <CallEndIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                </IconButton>
              </Tooltip>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>Decline</Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Tooltip title="Accept">
                <IconButton onClick={onAccept} sx={{
                  bgcolor: "#4caf50", color: "#fff",
                  width: { xs: 64, sm: 72 }, height: { xs: 64, sm: 72 },
                  "&:hover": { bgcolor: "#388e3c" },
                  boxShadow: "0 4px 20px rgba(76,175,80,0.5)",
                }}>
                  <PhoneCallbackIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                </IconButton>
              </Tooltip>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>Accept</Typography>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                <IconButton onClick={onToggleMute} sx={{
                  bgcolor: isMuted ? "#f44336" : "rgba(255,255,255,0.12)",
                  color: "#fff", width: { xs: 54, sm: 60 }, height: { xs: 54, sm: 60 },
                  backdropFilter: "blur(8px)",
                  "&:hover": { bgcolor: isMuted ? "#d32f2f" : "rgba(255,255,255,0.22)" },
                }}>
                  {isMuted ? <MicOffIcon sx={{ fontSize: 26 }} /> : <MicIcon sx={{ fontSize: 26 }} />}
                </IconButton>
              </Tooltip>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>
                {isMuted ? "Unmute" : "Mute"}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <Tooltip title="End call">
                <IconButton onClick={onEnd} sx={{
                  bgcolor: "#f44336", color: "#fff",
                  width: { xs: 64, sm: 72 }, height: { xs: 64, sm: 72 },
                  "&:hover": { bgcolor: "#d32f2f" },
                  boxShadow: "0 4px 20px rgba(244,67,54,0.5)",
                }}>
                  <CallEndIcon sx={{ fontSize: { xs: 28, sm: 32 } }} />
                </IconButton>
              </Tooltip>
              <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>End</Typography>
            </Box>
          </>
        )}
      </Box>

      {/* Hidden audio elements */}
      <Box sx={{ display: "none" }} />
    </Box>
  );
};

// ── Metered TURN + STUN servers (hardcoded, no API fetch needed) ─────────────
const FALLBACK_ICE = [
  { urls: "stun:stun.relay.metered.ca:80" },
  { urls: "turn:global.relay.metered.ca:80",              username: "6514f4675187bef05c422c55", credential: "+EcC6UPHTM7ZaSzx" },
  { urls: "turn:global.relay.metered.ca:80?transport=tcp", username: "6514f4675187bef05c422c55", credential: "+EcC6UPHTM7ZaSzx" },
  { urls: "turn:global.relay.metered.ca:443",             username: "6514f4675187bef05c422c55", credential: "+EcC6UPHTM7ZaSzx" },
  { urls: "turns:global.relay.metered.ca:443?transport=tcp", username: "6514f4675187bef05c422c55", credential: "+EcC6UPHTM7ZaSzx" },
];

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

  // Voice call refs & state
  const peerConnectionRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);       // FIX: keep remoteStream alive across ontrack calls
  const iceCandidateQueueRef = useRef([]);    // FIX: queue ICE candidates until remoteDescription is set
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [isOutgoingCall, setIsOutgoingCall] = useState(false);
  const [outgoingCallName, setOutgoingCallName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callDurationRef = useRef(null);

  const isCallActiveRef = useRef(false);
  const incomingCallRef = useRef(null);
  const callPeerIdRef = useRef(null);

  // ── Microphone permission (Android-friendly) ──────────────────────────────
  const { micPermission, requestMic, permError } = useMicrophonePermission();
  const [showMicDialog, setShowMicDialog] = useState(false);
  // Stores which action to run after permission is granted: "call" | "record"
  const pendingMicActionRef = useRef(null);

  useEffect(() => { isCallActiveRef.current = isCallActive; }, [isCallActive]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  // Start/stop call duration timer
  useEffect(() => {
    if (isCallActive) {
      setCallDuration(0);
      callDurationRef.current = setInterval(() => setCallDuration(p => p + 1), 1000);
    } else {
      if (callDurationRef.current) { clearInterval(callDurationRef.current); callDurationRef.current = null; }
      setCallDuration(0);
    }
    return () => { if (callDurationRef.current) clearInterval(callDurationRef.current); };
  }, [isCallActive]);

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

  // ── Voice note recording ───────────────────────────────────────────────────
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
    // On Android, check/request mic permission first
    if (micPermission !== "granted") {
      pendingMicActionRef.current = "record";
      setShowMicDialog(true);
      return;
    }
    await _doStartVoiceRecording();
  };

  const _doStartVoiceRecording = async () => {
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

  // ── WebRTC Voice Call ──────────────────────────────────────────────────────
  const iceServersRef = useRef(FALLBACK_ICE);

  const getIceConfig = () => ({ iceServers: FALLBACK_ICE });

  const ensureLocalAudioStream = async () => {
    // FIX: if tracks are ended (e.g. after a previous recording), clear the stale ref
    if (localStreamRef.current) {
      const tracks = localStreamRef.current.getAudioTracks();
      if (tracks.length === 0 || tracks.every(t => t.readyState === "ended")) {
        localStreamRef.current = null;
      }
    }
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      video: false,
    });
    localStreamRef.current = stream;
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = stream;
    }
    return stream;
  };

  const createPeerConnection = (targetUserId, localStream) => {
    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }

    // FIX 1: reset ICE queue and remote stream ref for a fresh call
    iceCandidateQueueRef.current = [];
    remoteStreamRef.current = new MediaStream();

    const peer = new RTCPeerConnection(getIceConfig());
    peerConnectionRef.current = peer;

    // Add local audio tracks
    const streamToUse = localStream || localStreamRef.current;
    if (streamToUse) {
      streamToUse.getAudioTracks().forEach(track => {
        peer.addTrack(track, streamToUse);
      });
    }

    // FIX 2: use stable remoteStreamRef so tracks accumulate correctly across multiple ontrack events
    peer.ontrack = (event) => {
      const remoteStream = remoteStreamRef.current;
      if (event.streams && event.streams[0]) {
        // Prefer the full stream from the event (standard in Chrome/Firefox)
        event.streams[0].getAudioTracks().forEach(track => {
          if (!remoteStream.getTrackById(track.id)) remoteStream.addTrack(track);
        });
      } else if (event.track) {
        if (!remoteStream.getTrackById(event.track.id)) remoteStream.addTrack(event.track);
      }

      if (remoteAudioRef.current) {
        // FIX 3: only swap srcObject if needed — avoids re-interrupting playback
        if (remoteAudioRef.current.srcObject !== remoteStream) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
        remoteAudioRef.current.play().catch(e =>
          console.warn("remoteAudio play() blocked:", e.name)
        );
      }
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate || !targetUserId) return;
      socket.emit(ICE_CANDIDATE, { chatId, toUserId: targetUserId, candidate: event.candidate });
    };

    peer.onconnectionstatechange = () => {
      console.log("PeerConnection state:", peer.connectionState);
      if (peer.connectionState === "connected") {
        toast.success("Call connected!");
        // FIX 4: re-trigger play after full connection — Android sometimes needs this
        if (remoteAudioRef.current && remoteStreamRef.current) {
          remoteAudioRef.current.play().catch(() => {});
        }
      }
      if (peer.connectionState === "failed" || peer.connectionState === "disconnected") {
        toast.error("Call connection lost.");
        closeCall(false);
      }
    };

    peer.onicegatheringstatechange = () => {
      console.log("ICE gathering state:", peer.iceGatheringState);
    };

    peer.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peer.iceConnectionState);
    };

    return peer;
  };

  const closeCall = useCallback((notify = true) => {
    if (notify && callPeerIdRef.current)
      socket.emit(CALL_ENDED, { chatId, toUserId: callPeerIdRef.current });

    if (peerConnectionRef.current) { peerConnectionRef.current.close(); peerConnectionRef.current = null; }
    if (localStreamRef.current) { localStreamRef.current.getTracks().forEach(t => t.stop()); localStreamRef.current = null; }
    if (localAudioRef.current) localAudioRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    remoteStreamRef.current = null;
    iceCandidateQueueRef.current = [];

    callPeerIdRef.current = null;
    setIsCallActive(false);
    setIncomingCall(null);
    setIsOutgoingCall(false);
    setOutgoingCallName("");
    setIsMuted(false);
  }, [chatId, socket]);

  const startVoiceCall = async () => {
    if (isGroupChat) return toast.error("Voice calls are only available in 1-on-1 chats.");
    if (isCallActiveRef.current || incomingCallRef.current) return;

    // On Android, explicitly ask for microphone before starting WebRTC
    if (micPermission !== "granted") {
      pendingMicActionRef.current = "call";
      setShowMicDialog(true);
      return;
    }
    await _doStartVoiceCall();
  };

  const _doStartVoiceCall = async () => {
    const target = members?.find(m => m?._id?.toString() !== user?._id?.toString());
    if (!target?._id) return toast.error("No receiver found.");

    try {
      const localStream = await ensureLocalAudioStream();

      callPeerIdRef.current = target._id;
      setIsOutgoingCall(true);
      setOutgoingCallName(target.name || chatName);

      const peer = createPeerConnection(target._id, localStream);
      const offer = await peer.createOffer({ offerToReceiveAudio: true });
      await peer.setLocalDescription(offer);

      socket.emit(CALL_OFFER, { chatId, offer, toUserId: target._id });
    } catch (err) {
      console.error("startVoiceCall:", err);
      toast.error("Could not start voice call. Check microphone permissions.");
      closeCall(false);
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      const localStream = await ensureLocalAudioStream();

      callPeerIdRef.current = incomingCall.from._id;

      const peer = createPeerConnection(incomingCall.from._id, localStream);
      await peer.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      // FIX: drain any ICE candidates that arrived before setRemoteDescription
      for (const candidate of iceCandidateQueueRef.current) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
      }
      iceCandidateQueueRef.current = [];

      const answer = await peer.createAnswer({ offerToReceiveAudio: true });
      await peer.setLocalDescription(answer);
      socket.emit(CALL_ANSWER, { chatId, toUserId: incomingCall.from._id, answer });
      setIsCallActive(true);
      setIncomingCall(null);
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

  // Store last received offer so we can auto-accept if user navigated here from global banner
  const pendingOfferRef = useRef(null);

  const callOfferListener = useCallback((data) => {
    if (data.from?._id === user?._id) return;
    // Accept offer for this chat OR store as pending if it arrives before chatId matches
    if (data.chatId !== chatId) {
      pendingOfferRef.current = data;
      return;
    }
    if (isCallActiveRef.current || incomingCallRef.current) {
      socket.emit(CALL_ENDED, { chatId, toUserId: data.from._id });
      return;
    }
    setIncomingCall({ offer: data.offer, from: data.from });
    toast(`📞 ${data.from?.name || "Someone"} is calling…`, { duration: 8000 });
  }, [chatId, user?._id, socket]);

  // When we land on this chat, check if there's a pending offer waiting for us
  useEffect(() => {
    if (!chatId || !pendingOfferRef.current) return;
    const pending = pendingOfferRef.current;
    if (pending.chatId === chatId) {
      pendingOfferRef.current = null;
      if (!isCallActiveRef.current && !incomingCallRef.current) {
        setIncomingCall({ offer: pending.offer, from: pending.from });
        toast(`📞 ${pending.from?.name || "Someone"} is calling…`, { duration: 8000 });
      }
    }
  }, [chatId]);

  const callAnswerListener = useCallback(async (data) => {
    if (data.chatId !== chatId || !peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));

      // FIX: drain queued ICE candidates that arrived before the answer
      for (const candidate of iceCandidateQueueRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.warn);
      }
      iceCandidateQueueRef.current = [];

      setIsCallActive(true);
      setIsOutgoingCall(false);
      setOutgoingCallName("");
    } catch (err) {
      console.error("callAnswerListener:", err);
      closeCall(false);
    }
  }, [chatId, closeCall]);

  const callIceCandidateListener = useCallback(async (data) => {
    if (data.chatId !== chatId) return;
    const peer = peerConnectionRef.current;
    if (!peer) return;
    // FIX: if remoteDescription isn't set yet, queue the candidate
    if (!peer.remoteDescription || !peer.remoteDescription.type) {
      iceCandidateQueueRef.current.push(data.candidate);
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

  // ── Mic dialog handler ─────────────────────────────────────────────────────
  const handleMicDialogAllow = async () => {
    setShowMicDialog(false);
    const stream = await requestMic();
    if (!stream) {
      // requestMic already updated permError — dialog will reopen with denied state if needed
      if (micPermission === "denied") setShowMicDialog(true);
      return;
    }
    // Mic granted — run whichever action was pending
    if (pendingMicActionRef.current === "call") {
      pendingMicActionRef.current = null;
      await _doStartVoiceCall();
    } else if (pendingMicActionRef.current === "record") {
      pendingMicActionRef.current = null;
      // Release the test stream before starting the real recording
      stream.getTracks().forEach(t => t.stop());
      await _doStartVoiceRecording();
    }
  };

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
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{
        px: isMobile ? 1 : 2, py: 1,
        bgcolor: "#008069",
        display: "flex", alignItems: "center", gap: 1,
        flexShrink: 0, minHeight: "3.5rem",
        paddingTop: isMobile ? "max(0.75rem, calc(env(safe-area-inset-top) + 0.25rem))" : undefined,
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

        {/* Voice call button — shown only for 1-on-1 chats */}
        {!isGroupChat && (
          <Tooltip title="Start voice call">
            <IconButton size="small" onClick={startVoiceCall} sx={{ color: "white", flexShrink: 0 }}>
              <PhoneIcon />
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
          minHeight: 0,
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
          position: "sticky",
          bottom: 0,
          zIndex: 10,
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
          paddingLeft: "max(0.25rem, env(safe-area-inset-left))",
          paddingRight: "max(0.25rem, env(safe-area-inset-right))",
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

      </Box>

      <FileMenu anchorE1={fileMenuAnchor} chatId={chatId} />

      {/* Hidden audio elements for WebRTC voice streams */}
      {/* local: muted so you don't hear your own mic */}
      <audio ref={localAudioRef} autoPlay muted playsInline style={{ display: "none" }} />
      {/* remote: NOT muted — this is what you hear from the other person */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: "none" }} />

      {/* Microphone Permission Dialog (Android-friendly) */}
      <MicPermissionDialog
        open={showMicDialog}
        denied={micPermission === "denied"}
        error={permError}
        onAllow={handleMicDialogAllow}
        onDismiss={() => { setShowMicDialog(false); pendingMicActionRef.current = null; }}
      />

      {/* Voice Call Overlay */}
      <VoiceCallOverlay
        isCallActive={isCallActive}
        isOutgoingCall={isOutgoingCall}
        incomingCall={incomingCall}
        onAccept={acceptIncomingCall}
        onEnd={() => closeCall(true)}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        callerName={callerName}
        callDuration={callDuration}
      />
    </Fragment>
  );
};

export default AppLayout()(Chat);
