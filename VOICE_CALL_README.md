# Voice Call Feature — Implementation Guide

## ✅ Status: Fully Implemented

Your Chat Application already has a **complete WebRTC-based voice call system** between two people. No additional code is needed. Below is a full breakdown of what's implemented and how to run it.

---

## 🏗️ Architecture Overview

```
Caller                        Server (Socket.IO)            Receiver
  |                                  |                           |
  |-- CALL_OFFER (SDP offer) ------> |                           |
  |                                  |-- CALL_OFFER -----------> |
  |                                  |                           |
  |                                  | <-- CALL_ANSWER ----------|
  | <-- CALL_ANSWER (SDP answer) ----|                           |
  |                                  |                           |
  |-- ICE_CANDIDATE ---------------> |                           |
  |                                  |-- ICE_CANDIDATE --------> |
  |                                  | <-- ICE_CANDIDATE --------|
  | <-- ICE_CANDIDATE ---------------|                           |
  |                                  |                           |
  |========== Direct P2P Audio Stream (WebRTC) ==============|
  |                                  |                           |
  |-- CALL_ENDED ------------------> |                           |
  |                                  |-- CALL_ENDED -----------> |
```

---

## 📁 Key Files

### Backend (`chatapp-server-master/`)
| File | Role |
|------|------|
| `app.js` | WebRTC signaling via Socket.IO (`CALL_OFFER`, `CALL_ANSWER`, `ICE_CANDIDATE`, `CALL_ENDED`) |
| `constants/events.js` | All socket event constants including call events |

### Frontend (`chatapp-frontend-master/`)
| File | Role |
|------|------|
| `src/pages/Chat.jsx` | Full voice call logic: `startVoiceCall`, `acceptIncomingCall`, `closeCall`, `toggleMute`, `VoiceCallOverlay` UI |
| `src/constants/events.js` | Call event constants |

---

## 🎛️ Features

- **1-on-1 only** — voice calls disabled for group chats
- **Incoming call screen** — Accept / Decline buttons
- **Outgoing call screen** — "Calling…" state while waiting
- **Active call screen** — live timer, Mute/Unmute, End call
- **Mute toggle** — silences local microphone track
- **Auto-end on disconnect** — peer connection failure triggers `closeCall`
- **Busy handling** — if recipient is already in a call, the offer is auto-declined
- **STUN servers** — Google STUN servers configured for NAT traversal

---

## 🚀 Running the App

### 1. Backend
```bash
cd chatapp-server-master
npm install
# Create .env with:
#   MONGO_URI=<your-mongodb-uri>
#   PORT=3000
#   NODE_ENV=DEVELOPMENT
#   JWT_SECRET=<secret>
#   ADMIN_SECRET_KEY=<admin-secret>
#   CLOUDINARY_CLOUD_NAME=<name>
#   CLOUDINARY_API_KEY=<key>
#   CLOUDINARY_API_SECRET=<secret>
npm start
```

### 2. Frontend
```bash
cd chatapp-frontend-master
npm install
# .env already has: VITE_SERVER=http://localhost:3000
npm run dev
```

---

## ⚠️ Production Notes

### TURN Server (Required for production)
Google STUN works for users on the same network or simple NATs. For production across different networks, add a **TURN server** in `Chat.jsx`:

```js
const ICE_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:your-turn-server.com:3478",
      username: "your-username",
      credential: "your-password",
    },
  ],
};
```

Free TURN server options: **Metered.ca**, **Twilio Network Traversal Service**, or self-host with **coturn**.

### HTTPS Required
Browser `getUserMedia` (microphone access) only works on **HTTPS** or `localhost`. Deploy your frontend with SSL.

---

## 🔄 Socket Events Reference

| Event | Direction | Payload |
|-------|-----------|---------|
| `CALL_OFFER` | Caller → Server → Receiver | `{ chatId, offer, toUserId }` |
| `CALL_ANSWER` | Receiver → Server → Caller | `{ chatId, answer, toUserId }` |
| `ICE_CANDIDATE` | Both → Server → Peer | `{ chatId, candidate, toUserId }` |
| `CALL_ENDED` | Either → Server → Peer | `{ chatId, toUserId }` |
