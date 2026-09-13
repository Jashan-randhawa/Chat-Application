import { describe, it, expect } from "vitest";
import App from "../App";
import Index from "../pages/Index";
import Login from "../pages/Login";
import ChatArea from "../components/chat/ChatArea";
import ChatHeader from "../components/chat/ChatHeader";
import ChatInput from "../components/chat/ChatInput";
import MessageBubble from "../components/chat/MessageBubble";
import VoiceMessage from "../components/chat/VoiceMessage";
import VoiceRecorder from "../components/chat/VoiceRecorder";
import PaletteSwitcher from "../components/PaletteSwitcher";

import React from "react";
import { render } from "@testing-library/react";
import { useAppStore } from "../store/appStore";

describe("Components import and evaluation", () => {
  it("should import and render App without throwing", () => {
    expect(App).toBeDefined();
    const { container } = render(React.createElement(App));
    expect(container).toBeDefined();
  });

  it("should render ChatArea with messages without throwing", () => {
    useAppStore.setState({
      user: { _id: "u1", name: "Jashan", username: "jashan" },
      palette: "violet",
    });

    const mockChat = {
      _id: "c1",
      name: "dipu-Jashan",
      avatar: [],
      groupChat: false,
      members: ["u1", "u2"],
    };

    const { container } = render(
      React.createElement(ChatArea, {
        chatId: "c1",
        chats: [mockChat],
        onBack: () => {},
      })
    );
    expect(container).toBeDefined();
  });
});
