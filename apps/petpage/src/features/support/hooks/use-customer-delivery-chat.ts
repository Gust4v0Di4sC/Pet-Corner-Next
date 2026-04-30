"use client";

import { useId, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  queryCustomerDeliveryChat,
  type CustomerDeliveryChatResponse,
} from "@/features/support/services/customer-delivery-chat.service";

type ChatRole = "user" | "assistant";

type SendDeliveryChatInput = {
  text: string;
  orderCode?: string;
};

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
  const [messages, setMessages] = useState<CustomerDeliveryChatMessage[]>([
    makeInitialAssistantMessage(),
  ]);

  const reactId = useId();
  const sessionId = useMemo(
    () => `delivery-session-${reactId.replace(/:/g, "")}`,
    [reactId]
  );

  const sendMessageMutation = useMutation({
    mutationFn: async (input: SendDeliveryChatInput) =>
      queryCustomerDeliveryChat({
        message: input.text,
        sessionId,
        orderCode: input.orderCode,
      }),
    onSuccess: (response) => {
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
    },
    onError: (error) => {
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
    },
  });

  const sendMessage = async (text: string, orderCode?: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || sendMessageMutation.isPending) {
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

    try {
      await sendMessageMutation.mutateAsync({
        text: trimmedText,
        orderCode,
      });
    } catch {
      return;
    }
  };

  const resetConversation = () => {
    setMessages([makeInitialAssistantMessage()]);
  };

  return {
    isSending: sendMessageMutation.isPending,
    messages,
    sendMessage,
    resetConversation,
  };
}
