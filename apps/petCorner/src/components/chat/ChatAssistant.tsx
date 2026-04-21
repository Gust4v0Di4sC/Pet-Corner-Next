import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";

import { useToast } from "../../hooks/useToast";
import { queryChat, type ChatQueryResult } from "../../services/chatService";
import "./chat-assistant.css";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  intent?: string;
  rowsSample?: Array<Record<string, unknown>>;
};

type Props = {
  placement?: "default" | "resource-fab";
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text:
    "Oi! Pergunte sobre clientes, animais, produtos, servicos e catalogo. Exemplo: Quantos servicos ativos temos?",
};

function makeMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function toAssistantMessage(response: ChatQueryResult): ChatMessage {
  return {
    id: makeMessageId(),
    role: "assistant",
    text: response.answer,
    intent: response.intent,
    rowsSample: response.rowsSample,
  };
}

export default function ChatAssistant({ placement = "default" }: Props) {
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string>(makeSessionId());

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [isOpen, messages]);

  const canSubmit = useMemo(
    () => !isSending && question.trim().length > 0,
    [isSending, question]
  );

  const closePanel = () => {
    if (isSending) {
      return;
    }

    setIsOpen(false);
  };

  const handleSubmit: NonNullable<ComponentPropsWithoutRef<"form">["onSubmit"]> = async (
    event
  ) => {
    event.preventDefault();

    const nextQuestion = question.trim();

    if (!nextQuestion || isSending) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: makeMessageId(),
        role: "user",
        text: nextQuestion,
      },
    ]);
    setQuestion("");
    setIsSending(true);

    try {
      const response = await queryChat({
        question: nextQuestion,
        sessionId: sessionIdRef.current,
      });

      setMessages((current) => [...current, toAssistantMessage(response)]);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível consultar o chat agora.";

      setMessages((current) => [
        ...current,
        {
          id: makeMessageId(),
          role: "assistant",
          text: message,
        },
      ]);
      toast.warning(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`chat-assistant__fab${
          placement === "resource-fab" ? " chat-assistant__fab--resource-anchor" : ""
        }`}
        onClick={() => setIsOpen((current) => !current)}
        aria-label={isOpen ? "Fechar chat de consultas" : "Abrir chat de consultas"}
        title="Chat de consultas"
      >
        <i className={`fa ${isOpen ? "fa-times" : "fa-comments"}`} aria-hidden="true" />
      </button>

      <section
        className={`chat-assistant__panel${
          placement === "resource-fab" ? " chat-assistant__panel--resource-anchor" : ""
        }${isOpen ? " is-open" : ""}`}
        aria-label="Chat de consultas do sistema"
        aria-hidden={!isOpen}
      >
        <header className="chat-assistant__header">
          <div>
            <p className="chat-assistant__eyebrow">Gemini + Firestore</p>
            <h2>Chat de consultas</h2>
          </div>

          <button
            type="button"
            className="chat-assistant__close"
            onClick={closePanel}
            disabled={isSending}
            aria-label="Fechar"
          >
            <i className="fa fa-times" />
          </button>
        </header>

        <div className="chat-assistant__messages" ref={messagesRef}>
          {messages.map((message) => (
            <article
              key={message.id}
              className={`chat-assistant__message chat-assistant__message--${message.role}`}
            >
              <p>{message.text}</p>

              {message.intent ? (
                <small className="chat-assistant__intent">Intenção: {message.intent}</small>
              ) : null}

              {message.role === "assistant" && message.rowsSample?.length ? (
                <div className="chat-assistant__sample">
                  <strong>Amostra de dados</strong>
                  {message.rowsSample.slice(0, 3).map((row, rowIndex) => (
                    <pre key={`${message.id}-${rowIndex}`}>{JSON.stringify(row, null, 2)}</pre>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <form className="chat-assistant__form" onSubmit={handleSubmit}>
          <label htmlFor="chat-question" className="chat-assistant__label">
            Pergunta
          </label>

          <textarea
            id="chat-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ex.: Qual o total de produtos com estoque baixo?"
            rows={3}
            maxLength={500}
            disabled={isSending}
          />

          <button type="submit" disabled={!canSubmit}>
            {isSending ? "Consultando..." : "Consultar"}
          </button>
        </form>
      </section>
    </>
  );
}
