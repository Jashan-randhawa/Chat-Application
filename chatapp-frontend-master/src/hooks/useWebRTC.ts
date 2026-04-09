import { useRef, useCallback } from "react";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC() {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  /** Acquire microphone access and store the stream. Must be called before createPeerConnection. */
  const getLocalStream = useCallback(async (): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    localStreamRef.current = stream;
    return stream;
  }, []);

  /**
   * Create an RTCPeerConnection, attach local tracks, and wire callbacks.
   * Call getLocalStream() before this.
   */
  const createPeerConnection = useCallback(
    (
      onIceCandidate: (candidate: RTCIceCandidate) => void,
      onRemoteStream: (stream: MediaStream) => void
    ): RTCPeerConnection => {
      // Close any existing connection first
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) onIceCandidate(e.candidate);
      };

      pc.ontrack = (e) => {
        if (e.streams[0]) onRemoteStream(e.streams[0]);
      };

      // Add local audio tracks so remote peer hears us
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      return pc;
    },
    []
  );

  /** Caller: create and set local SDP offer. Returns offer to send via socket. */
  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    const pc = pcRef.current;
    if (!pc) return null;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return offer;
  }, []);

  /** Callee: set remote offer, create answer. Returns answer to send via socket. */
  const createAnswer = useCallback(
    async (offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit | null> => {
      const pc = pcRef.current;
      if (!pc) return null;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      return answer;
    },
    []
  );

  /** Caller: apply the callee's answer. */
  const setRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit): Promise<void> => {
    const pc = pcRef.current;
    if (!pc) return;
    if (pc.signalingState === "have-local-offer") {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  /** Both peers: add received ICE candidates. */
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit): Promise<void> => {
    const pc = pcRef.current;
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      // Safe to ignore — can happen if remote description isn't set yet
      console.warn("ICE candidate error (may be harmless):", e);
    }
  }, []);

  /** Toggle microphone mute. Returns true if now muted. */
  const toggleMute = useCallback((): boolean => {
    const stream = localStreamRef.current;
    if (!stream) return false;
    const track = stream.getAudioTracks()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return !track.enabled; // true = muted
  }, []);

  /** Stop all tracks and close the peer connection. */
  const cleanup = useCallback((): void => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  return {
    getLocalStream,
    createPeerConnection,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
    toggleMute,
    cleanup,
  };
}
