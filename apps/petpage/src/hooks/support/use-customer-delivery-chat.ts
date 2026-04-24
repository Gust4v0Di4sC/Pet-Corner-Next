"use client";

import { useId, useMemo, useState } from "react";
import {
  queryCustomerDeliveryChat,
  type CustomerDeliveryChatResponse,
} from "@/services/support/customer-delivery-chat.service";

type ChatRole = "user" | "assistant";

export type CustomerDeliveryChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  meta?: Pick<CustomerDeliveryChatResponse, "intent" | "matchedOrder" | "issueTicketId" | "suggestedActions">;
};

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeInitialAssistantMessage(): CustomerDeliveryChatMessage {
  return {
    id: "welcome-delivery-assistant",
    role: "assistant",
    text: "Oi! Posso ajudar com rastreamento, processo de entrega e abertura de problemas.",
  };
}

export function useCustomerDeliveryChat() {
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<CustomerDeliveryChatMessage[]>([
    makeInitialAssistantMessage(),
  ]);

  const reactId = useId();
  const sessionId = useMemo(
    () => `delivery-session-${reactId.replace(/:/g, "")}`,
    [reactId]
  );

  const sendMessage = async (text: string, orderCode?: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isSending) {
      return;
    }

    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: createMessageId(),
        role: "user",
        text: trimmedText,
      },
    ]);
    setIsSending(true);

    try {
      const response = await queryCustomerDeliveryChat({
        message: trimmedText,
        sessionId,
        orderCode,
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: "assistant",
          text: response.answer,
          meta: {
            intent: response.intent,
            matchedOrder: response.matchedOrder,
            issueTicketId: response.issueTicketId,
            suggestedActions: response.suggestedActions,
          },
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Nao foi possivel consultar o assistente de entrega.";

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: "assistant",
          text: message,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const resetConversation = () => {
    setMessages([makeInitialAssistantMessage()]);
  };

  return {
    isSending,
    messages,
    sendMessage,
    resetConversation,
  };
}
