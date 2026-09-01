import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { FAQ_QUESTIONS } from '../data/mockData';
import { useChat } from '../contexts/ChatContext';
import { chatAPI } from '../services/api';
import type { CreateChatInteractionRequest } from '../services/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function ChatBot() {
  const { isOpen, openChat, closeChat } = useChat();
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de enseñanza con IA. Puedo ayudarte a integrar la inteligencia artificial generativa en tus cursos, responder preguntas sobre estrategias pedagógicas y brindarte orientación sobre mejores prácticas. ¿En qué puedo asistirte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMinimized) return;
    const el = messagesScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, isMinimized]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const questionText = inputValue.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: questionText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    const payload: CreateChatInteractionRequest = {
      question: questionText,
      conversationId,
    };

    try {
      const interaction = await chatAPI.createInteraction(payload);

      setConversationId(interaction.conversationId);

      const assistantMessage: Message = {
        id: interaction.id,
        role: 'assistant',
        content: interaction.answer,
        timestamp: new Date(interaction.createdAt),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error al enviar mensaje al chatbot:', error);
      toast.error(
        error?.message ||
          'No se pudo enviar el mensaje al asistente. Intenta de nuevo más tarde.',
      );
    } finally {
      setIsTyping(false);
    }
  };

  // La lógica de respuesta simulada anterior se reemplazó por el backend de chat.

  const handleFAQClick = (question: string) => {
    setInputValue(question);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={openChat}
        data-tour="chatbot-fab"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#5454e9] hover:bg-[#4040d0]"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex min-h-0 flex-col rounded-lg border-2 border-[#f5f7fb] bg-card shadow-2xl transition-all ${
        isMinimized ? 'h-14 w-80' : 'h-[600px] w-96'
      }`}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b-2 border-[#f5f7fb] p-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3>Asistente IA de Enseñanza</h3>
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">En línea</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={closeChat}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Mensajes: min-h-0 + overflow-y-auto para que el scroll funcione dentro del panel flex */}
          <div
            ref={messagesScrollRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 [-webkit-overflow-scrolling:touch]"
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${message.role === 'user'
                        ? 'bg-[#5454e9] text-white'
                        : 'bg-muted text-foreground'
                      }`}
                  >
                    <p className="break-words whitespace-pre-wrap text-sm">{message.content}</p>
                    <span className="mt-1 block text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-muted p-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FAQ Suggestions */}
          {messages.length === 1 && (
            <div className="shrink-0 px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-2">
                {FAQ_QUESTIONS.slice(0, 3).map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 border-2 border-[#f5f7fb]"
                    onClick={() => handleFAQClick(q)}
                  >
                    {q.length > 35 ? q.substring(0, 35) + '...' : q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="shrink-0 border-t-2 border-[#f5f7fb] p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe tu pregunta..."
                className="flex-1 border-2 border-[#f5f7fb]"
              />
              <Button onClick={handleSend} size="icon" className="bg-[#5454e9] hover:bg-[#4040d0]">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
