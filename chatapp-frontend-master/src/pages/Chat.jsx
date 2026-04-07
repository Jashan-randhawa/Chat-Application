import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { IconButton, Skeleton, Stack, Box, Typography } from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Videocam as VideocamIcon,
  CallEnd as CallEndIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { InputBox } from "../components/styles/StyledComponents";
import FileMenu from "../components/dialogs/FileMenu";
import MessageComponent from "../components/shared/MessageComponent";
import { getSocket } from "../socket";
import {
  ALERT, CHAT_JOINED, CHAT_LEAVED, MESSAGE_DELIVERED, MESSAGE_READ, NEW_MESSAGE, START_TYPING, STOP_TYPING,
  CALL_OFFER, CALL_ANSWER, ICE_CANDIDATE, CALL_ENDED,
} from "../constants/events";
import { useChatDetailsQuery, useGetMessagesQuery, useMarkMessageReadMutation, useSendAttachmentsMutation } from "../redux/api/api";
import { useErrors, useSocketEvents } from "../hooks/hook";
import { useInfiniteScrollTop } from "6pp";
import { useDispatch } from "react-redux";
import { setIsFileMenu } from "../redux/reducers/misc";
import { removeNewMessagesAlert } from "../redux/reducers/chat";
import { TypingLoader } from "../components/layout/Loaders";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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
  const [markMessageRead] = useMarkMessageReadMutation();
  const [sendAttachments] = useSendAttachmentsMutation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const peerConnectionRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callPeerId, setCallPeerId] = useState(null);

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
  const receiver = members?.find(
    (member) => member?._id?.toString() !== user?._id?.toString()
  );
  const chatName = isGroupChat
    ? chatDetails?.data?.chat?.name
    : receiver?.name || chatDetails?.data?.chat?.name;

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

  const stopAudioStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
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
        return toast.error("Voice recording is not supported on this browser.");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];
      audioStreamRef.current = stream;
      mediaRecorderRef.current = mediaRecorder;
      setRecordingSeconds(0);
      setIsRecording(true);

      recordingIntervalRef.current = setInterval(
        () => setRecordingSeconds((prev) => prev + 1),
        1000
      );

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          if (audioBlob.size > 0) await uploadVoiceNote(audioBlob);
        } catch (error) {
          toast.error("Failed to process voice note.");
        } finally {
          audioChunksRef.current = [];
          stopAudioStream();
          stopRecordingTimer();
          setIsRecording(false);
          setRecordingSeconds(0);
        }
      };

      mediaRecorder.start();
    } catch (error) {
      stopAudioStream();
      stopRecordingTimer();
      setIsRecording(false);
      setRecordingSeconds(0);
      toast.error("Microphone permission denied.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const ensureLocalStream = async () => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localStreamRef.current = stream;

    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    return stream;
  };

  const createPeerConnection = (targetUserId) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerConnectionRef.current = peer;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate || !targetUserId) return;
      socket.emit(ICE_CANDIDATE, {
        chatId,
        toUserId: targetUserId,
        candidate: event.candidate,
      });
    };

    return peer;
  };

  const closeCall = (notify = true) => {
    if (notify && isCallActive && callPeerId)
      socket.emit(CALL_ENDED, { chatId, toUserId: callPeerId });

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    setIsCallActive(false);
    setIncomingCall(null);
  };

  const startVideoCall = async () => {
    try {
      const targetUser = members?.find(
        (member) => member?._id?.toString() !== user?._id?.toString()
      );
      if (!targetUser?._id) return toast.error("No receiver found for this call.");

      await ensureLocalStream();
      const peer = createPeerConnection(targetUser._id);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      socket.emit(CALL_OFFER, {
        chatId,
        offer,
      });
      setIsCallActive(true);
    } catch (error) {
      toast.error("Unable to start video call.");
      closeCall(false);
    }
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    try {
      await ensureLocalStream();
      const peer = createPeerConnection(incomingCall.from._id);
      await peer.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit(CALL_ANSWER, {
        chatId,
        toUserId: incomingCall.from._id,
        answer,
      });

      setIncomingCall(null);
      setIsCallActive(true);
    } catch (error) {
      toast.error("Unable to accept call.");
      closeCall(false);
    }
  };

  const addUniqueUsers = (existingUsers = [], usersToAdd = []) => {
    const uniqueIds = new Set(existingUsers.map((id) => id?.toString()));
    usersToAdd.forEach((id) => uniqueIds.add(id?.toString()));
    return Array.from(uniqueIds);
  };

  const updateMessageReceiptInState = (messageId, updater) => {
    if (!messageId) return;
    setMessages((prev) =>
      prev.map((messageItem) =>
        messageItem._id?.toString() === messageId.toString()
          ? updater(messageItem)
          : messageItem
      )
    );
    setOldMessages((prev) =>
      prev.map((messageItem) =>
        messageItem._id?.toString() === messageId.toString()
          ? updater(messageItem)
          : messageItem
      )
    );
  };

  useEffect(() => {
    socket.emit(CHAT_JOINED, { userId: user._id, members });
    dispatch(removeNewMessagesAlert(chatId));
    return () => {
      setMessages([]);
      setMessage("");
      setOldMessages([]);
      setPage(1);
      socket.emit(CHAT_LEAVED, { userId: user._id, members });
    };
  }, [chatId]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatDetails.isError) return navigate("/");
  }, [chatDetails.isError]);

  const newMessagesListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    setMessages((prev) => [...prev, data.message]);

    if (data.message?.sender?._id !== user?._id && data.message?._id) {
      markMessageRead(data.message._id);
    }
  }, [chatId, markMessageRead, user?._id]);

  const messageDeliveredListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    updateMessageReceiptInState(data.messageId, (messageItem) => ({
      ...messageItem,
      deliveredTo: addUniqueUsers(messageItem.deliveredTo, data.deliveredTo || []),
    }));
  }, [chatId]);

  const messageReadListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    updateMessageReceiptInState(data.messageId, (messageItem) => ({
      ...messageItem,
      deliveredTo: addUniqueUsers(messageItem.deliveredTo, [data.userId]),
      readBy: addUniqueUsers(messageItem.readBy, [data.userId]),
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
    setMessages((prev) => [...prev, {
      content: data.message,
      sender: { _id: "admin", name: "Admin" },
      chat: chatId,
      createdAt: new Date().toISOString(),
    }]);
  }, [chatId]);

  const callOfferListener = useCallback((data) => {
    if (data.chatId !== chatId || data.from?._id === user?._id) return;
    setIncomingCall({ offer: data.offer, from: data.from });
    toast.success(`${data.from?.name || "Someone"} is calling...`);
  }, [chatId, user?._id]);

  const callAnswerListener = useCallback(async (data) => {
    if (data.chatId !== chatId || !peerConnectionRef.current) return;
    await peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
    setIsCallActive(true);
  }, [chatId]);

  const callIceCandidateListener = useCallback(async (data) => {
    if (data.chatId !== chatId || !peerConnectionRef.current) return;
    try {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
    } catch (error) {
      console.error("ICE candidate error:", error);
    }
  }, [chatId]);

  const callEndedListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    closeCall(false);
    toast("Call ended");
  }, [chatId]);

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

  useEffect(() => {
    const unreadIncoming = allMessages.filter(
      (msg) =>
        msg?._id &&
        msg?.sender?._id !== user?._id &&
        !msg?.readBy?.some((reader) => reader?.toString() === user?._id?.toString())
    );

    unreadIncoming.forEach((msg) => {
      const id = msg._id.toString();
      if (readReceiptQueueRef.current.has(id)) return;
      readReceiptQueueRef.current.add(id);
      markMessageRead(id).finally(() => {
        readReceiptQueueRef.current.delete(id);
      });
    });
  }, [allMessages, markMessageRead, user?._id]);

  useEffect(
    () => () => {
      stopRecordingTimer();
      stopAudioStream();
      closeCall(false);
    },
    []
  );

  // Empty state (no chat selected — desktop only, mobile never shows this)
  if (!chatId) {
    return (
      <Box sx={{
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        bgcolor: "#f0f2f5", gap: 2,
      }}>
        <Box sx={{
          width: 180, height: 180, borderRadius: "50%",
          bgcolor: "#e9edef", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Box sx={{ fontSize: 72 }}>💬</Box>
        </Box>
        <Typography sx={{
          color: "#54656f", fontSize: "1.15rem", fontWeight: 300,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
          WhatsApp Web
        </Typography>
        <Typography sx={{
          color: "#8696a0", fontSize: "0.82rem", textAlign: "center", maxWidth: 340,
          fontFamily: "'Segoe UI', system-ui, sans-serif", lineHeight: 1.6,
        }}>
          Send and receive messages without keeping your phone online.
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#8696a0", fontSize: "0.75rem" }}>
          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#00a884" }} />
          End-to-end encrypted
        </Box>
      </Box>
    );
  }

  // Loading skeleton
  if (chatDetails.isLoading) {
    return (
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "#efeae2", height: "100%" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
            <Skeleton variant="rounded" width={`${Math.random() * 200 + 80}px`} height={44}
              sx={{ borderRadius: "12px", bgcolor: i % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(217,253,211,0.8)" }}
            />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Fragment>
      {/* Chat header */}
      <Box sx={{
        px: isMobile ? 1 : 2,
        py: 1,
        bgcolor: "#008069",
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexShrink: 0,
        minHeight: "3.5rem",
      }}>
        {/* Back button — mobile only */}
        {isMobile && (
          <IconButton
            onClick={onBack || (() => navigate("/"))}
            size="small"
            sx={{ color: "white", mr: 0.5, flexShrink: 0 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        {/* Name only (1:1 chat header simplified) */}
        <Box flex={1} minWidth={0} display="flex" alignItems="center">
          <Typography sx={{
            fontWeight: 600, fontSize: "0.9375rem",
            color: "white", lineHeight: 1.2,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {chatName || "Chat"}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={startVideoCall}
          sx={{ color: "white", flexShrink: 0 }}
        >
          <VideocamIcon />
        </IconButton>
      </Box>

      {/* Messages area */}
      <Stack
        ref={containerRef}
        padding={"0.75rem 5%"}
        spacing={"0.25rem"}
        sx={{
          flex: 1,
          overflowX: "hidden",
          overflowY: "auto",
          background: "#efeae2",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cfc4b0' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          display: "flex",
          flexDirection: "column",
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 3 },
          // Fix for mobile keyboard pushing content
          WebkitOverflowScrolling: "touch",
        }}
      >
        {allMessages.map((i) => (
          <MessageComponent key={i._id} message={i} user={user} />
        ))}
        {userTyping && <TypingLoader />}
        <div ref={bottomRef} />
      </Stack>

      {/* Input bar */}
      <Box
        component="form"
        onSubmit={submitHandler}
        sx={{
          bgcolor: "#f0f2f5",
          px: 1, py: 0.75,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flexShrink: 0,
          // Handles iOS safe area (notch)
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Text input container */}
        <Box sx={{
          display: "flex",
          bgcolor: "#ffffff",
          borderRadius: "24px",
          flex: 1,
          alignItems: "center",
          px: 1,
          minHeight: "2.75rem",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        }}>
          <IconButton size="small" sx={{ color: "#54656f", flexShrink: 0 }}>
            <EmojiIcon sx={{ fontSize: 22 }} />
          </IconButton>
          <IconButton onClick={handleFileOpen} size="small"
            sx={{ color: "#54656f", flexShrink: 0 }}>
            <AttachFileIcon sx={{ fontSize: 20, transform: "rotate(45deg)" }} />
          </IconButton>
          <InputBox
            placeholder="Type a message"
            value={message}
            onChange={messageOnChange}
            style={{
              flex: 1,
              border: "none", outline: "none",
              background: "transparent",
              padding: "0.5rem 0.25rem",
              fontSize: "0.9375rem",
              color: "#111b21",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              minWidth: 0,
            }}
          />
        </Box>

        {/* Send / Mic */}
        <Box
          component={message.trim() || isRecording ? "button" : "div"}
          onClick={
            message.trim()
              ? submitHandler
              : isRecording
                ? stopVoiceRecording
                : startVoiceRecording
          }
          sx={{
            width: 44, height: 44,
            borderRadius: "50%",
            bgcolor: isRecording ? "#f15c6d" : "#00a884",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            border: "none",
            flexShrink: 0,
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
              : <MicIcon sx={{ fontSize: 20, color: "white" }} />
          }
        </Box>
        {isRecording && (
          <Typography sx={{ fontSize: "0.75rem", color: "#f15c6d", minWidth: "3rem" }}>
            {`0:${String(recordingSeconds).padStart(2, "0")}`}
          </Typography>
        )}
      </Box>

      <FileMenu anchorE1={fileMenuAnchor} chatId={chatId} />

      {(incomingCall || isCallActive) && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.85)",
            zIndex: 1400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            p: 2,
          }}
        >
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: "100%", maxWidth: 560, borderRadius: 12, background: "#101010" }}
          />
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: 180, borderRadius: 12, background: "#101010" }}
          />

          {incomingCall && !isCallActive && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Typography sx={{ color: "#fff" }}>
                {incomingCall.from?.name || "User"} is calling...
              </Typography>
              <IconButton onClick={acceptIncomingCall} sx={{ color: "#1ed760" }}>
                <VideocamIcon />
              </IconButton>
            </Box>
          )}

          <IconButton onClick={() => closeCall(true)} sx={{ color: "#ff4f5e" }}>
            <CallEndIcon />
          </IconButton>
        </Box>
      )}
    </Fragment>
  );
};

export default AppLayout()(Chat);
