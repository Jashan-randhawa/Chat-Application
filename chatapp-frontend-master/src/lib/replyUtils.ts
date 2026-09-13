import type { Message } from "@/store/appStore";
import { fileFormat } from "./features";

export interface ParsedReply {
  id: string;
  sender: string;
  text: string;
  type?: "text" | "image" | "video" | "audio" | "file";
  thumbnailUrl?: string;
}

/**
 * Creates an informative snippet for a message (text, photo, voice note, etc.)
 */
export function getMessageSnippet(message: Message): { text: string; type: "text" | "image" | "video" | "audio" | "file"; thumbnailUrl?: string } {
  if (message.attachments && message.attachments.length > 0) {
    const first = message.attachments[0].url;
    const type = fileFormat(first);
    const fname = first.split("/").pop()?.split("?")[0] || "";

    if (type === "image") {
      return {
        text: message.content ? `📷 ${message.content}` : "📷 Photo",
        type: "image",
        thumbnailUrl: first,
      };
    }
    if (type === "video") {
      return { text: "🎥 Video", type: "video" };
    }
    if (type === "audio") {
      const isVoice = fname.includes("voice") || fname.endsWith(".webm") || fname.endsWith(".ogg");
      return { text: isVoice ? "🎤 Voice message" : "🎵 Audio", type: "audio" };
    }
    return { text: `📄 ${fname || "Document"}`, type: "file" };
  }

  return {
    text: message.content || "Message",
    type: "text",
  };
}

/**
 * Encodes a reply header into the outgoing message string
 */
export function encodeReplyMessage(replyTo: Message, actualText: string): string {
  const snippet = getMessageSnippet(replyTo);
  const metadata = {
    id: replyTo._id,
    sender: replyTo.sender?.name || "User",
    text: snippet.text.slice(0, 100),
    type: snippet.type,
    thumbnailUrl: snippet.thumbnailUrl,
  };

  return `⟦REPLY:${JSON.stringify(metadata)}⟧${actualText}`;
}

/**
 * Parses reply metadata from raw message content
 */
export function parseReplyMessage(rawContent: string): {
  replyTo: ParsedReply | null;
  cleanContent: string;
} {
  if (!rawContent) return { replyTo: null, cleanContent: "" };

  // 1. Check for standard ⟦REPLY:{...}⟧ tag
  const tagMatch = rawContent.match(/^⟦REPLY:(.*?)⟧(.*)$/s);
  if (tagMatch) {
    try {
      const parsed = JSON.parse(tagMatch[1]) as ParsedReply;
      return {
        replyTo: parsed,
        cleanContent: tagMatch[2].trim(),
      };
    } catch {
      // ignore parse error, continue
    }
  }

  // 2. Check for legacy [Replying to Name: "quote"]\nMessage
  const legacyMatch = rawContent.match(/^\[Replying to (.*?): "(.*?)"\]\n?(.*)$/s);
  if (legacyMatch) {
    return {
      replyTo: {
        id: "",
        sender: legacyMatch[1].trim(),
        text: legacyMatch[2].trim(),
        type: "text",
      },
      cleanContent: legacyMatch[3].trim(),
    };
  }

  return {
    replyTo: null,
    cleanContent: rawContent,
  };
}

/**
 * Smoothly scrolls to a quoted message and flashes a WhatsApp-style highlight
 */
export function scrollToQuotedMessage(messageId: string) {
  if (!messageId) return;
  const element = document.getElementById(`msg-${messageId}`);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("highlight-pulse");
    setTimeout(() => {
      element.classList.remove("highlight-pulse");
    }, 1500);
  }
}
