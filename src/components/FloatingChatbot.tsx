import { Icon } from "@stellar/design-system";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import "./FloatingChatbot.css";
import { useEnvelopes } from "../hooks/useEnvelopes";
import { CONTRACT_ID, TOKEN_ADDRESSES } from "./modules/envelopes/constants";
import { toSnakeCaseMax32 } from "../util/snake_case";

// Función para mapear nombres de tokens a direcciones de contrato
const getTokenContractAddress = (
  tokenNameOrAddress: string | undefined
): string => {
  if (!tokenNameOrAddress) {
    return TOKEN_ADDRESSES.USDC; // Default a USDC
  }

  // Si ya es una dirección (empieza con C y tiene 56 caracteres), usarla directamente
  if (tokenNameOrAddress.startsWith("C") && tokenNameOrAddress.length === 56) {
    return tokenNameOrAddress;
  }

  // Mapear nombres de tokens a direcciones
  const tokenUpper = tokenNameOrAddress.toUpperCase();
  const tokenMap: Record<string, string> = {
    XLM: TOKEN_ADDRESSES.XLM,
    USDC: TOKEN_ADDRESSES.USDC,
    // Agregar más tokens si es necesario
  };

  return tokenMap[tokenUpper] || TOKEN_ADDRESSES.USDC; // Default a USDC si no se encuentra
};

// Tipos para los mensajes del chat
interface ChatMessage {
  id: number;
  text: string;
  sender: "user" | "bot";
}

// Tipos para las instrucciones del backend
interface InstructionParam {
  name: string;
  description?: string;
  tokenContract?: string;
  amount: number | string; // Puede venir como número o string
}

interface ChatInstructions {
  action: string;
  params: InstructionParam[];
}

interface ChatResponse {
  response?: string; // Campo que viene del backend
  message?: string; // Campo alternativo
  instructions?: ChatInstructions;
  sessionId?: string; // También puede venir en la respuesta
}

const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [position, setPosition] = useState({
    x: window.innerWidth - 100,
    y: window.innerHeight - 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Generar sessionId al cargar el componente o recuperarlo del localStorage
  const [sessionId] = useState<string>(() => {
    const storedSessionId = localStorage.getItem("chat_session_id");
    if (storedSessionId) {
      return storedSessionId;
    }
    const newSessionId = uuidv4();
    localStorage.setItem("chat_session_id", newSessionId);
    return newSessionId;
  });

  // Estado loading para bloquear envío cuando está esperando respuesta
  const [loading, setLoading] = useState(false);

  // Estado para bloquear input mientras se ejecutan las instrucciones
  const [executingInstructions, setExecutingInstructions] = useState(false);

  // Cargar mensajes del localStorage al iniciar
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const storedMessages = localStorage.getItem(`chat_messages_${sessionId}`);
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages) as ChatMessage[];
        return parsed;
      } catch (e) {
        console.error("Error parsing stored messages:", e);
        return [];
      }
    }
    return [];
  });

  const [inputValue, setInputValue] = useState("");

  // Hook para usar los métodos de envelopes
  const { createEnvelope, deposit, listEnvelopes } = useEnvelopes(CONTRACT_ID);

  // Obtener URL del backend desde variables de entorno
  const backendUrl: string =
    (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:4000";

  const handleOpen = () => {
    setIsOpen(true);
    // Force reflow to ensure initial state is applied before animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpening(true);
      });
    });
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsOpening(false);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  // Calculate safe modal position when opened
  const getSafeModalPosition = () => {
    const modalWidth = 380;
    const modalHeight = 500;
    const padding = 20;

    // Calculate position above the button
    let modalX = position.x;
    let modalY = position.y - modalHeight - 10; // 10px gap between button and modal

    // If modal would go off the right edge, align to right
    if (modalX + modalWidth > window.innerWidth - padding) {
      modalX = window.innerWidth - modalWidth - padding;
    }

    // If modal would go off the left edge, align to left
    if (modalX < padding) {
      modalX = padding;
    }

    // If modal would go off the top edge, position below the button
    if (modalY < padding) {
      modalY = position.y + 70; // Position below button (60px button + 10px gap)
    }

    // If modal would go off the bottom edge, align to bottom
    if (modalY + modalHeight > window.innerHeight - padding) {
      modalY = window.innerHeight - modalHeight - padding;
    }

    return { x: modalX, y: modalY };
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Calculate offset from mouse position to button top-left corner
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  // Handle drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Position button so the drag point follows the cursor
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - 60;
        const maxY = window.innerHeight - 60;
        const minX = 0;
        const minY = 0;

        setPosition({
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, dragOffset]);

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      // Calculate offset from touch position to button top-left corner
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        // Position button so the drag point follows the touch
        const newX = touch.clientX - dragOffset.x;
        const newY = touch.clientY - dragOffset.y;

        // Keep within viewport bounds
        const maxX = window.innerWidth - 60;
        const maxY = window.innerHeight - 60;
        const minX = 0;
        const minY = 0;

        setPosition({
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY)),
        });
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, dragOffset]);

  // Persistir mensajes en localStorage cuando cambian
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(
        `chat_messages_${sessionId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, sessionId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Función para manejar las instrucciones del backend
  const handleInstructions = useCallback(
    async (instructions: ChatInstructions) => {
      console.log("🎯 Iniciando procesamiento de instrucciones:", {
        action: instructions.action,
        paramsCount: instructions.params.length,
        params: instructions.params,
      });

      if (instructions.action !== "create_plan") {
        console.warn("⚠️ Acción desconocida:", instructions.action);
        return;
      }

      setExecutingInstructions(true);
      try {
        // Para cada param: convertir description a snake_case, crear envelope y depositar
        for (let i = 0; i < instructions.params.length; i++) {
          const param = instructions.params[i];
          console.log(
            `\n📦 Procesando parámetro ${i + 1}/${instructions.params.length}:`,
            param
          );
          console.log("🔍 Tipo de amount recibido:", typeof param.amount);
          console.log("🔍 Valor raw de amount:", param.amount);
          console.log(
            "🔍 JSON del parámetro completo:",
            JSON.stringify(param, null, 2)
          );

          try {
            // Convertir description a snake_case y truncar a 32 bytes máximo
            const descriptionSnake = param.description
              ? toSnakeCaseMax32(param.description)
              : toSnakeCaseMax32(param.name);

            // Mapear tokenContract: puede venir como "XLM", "USDC" o como dirección
            const tokenContractRaw = param.tokenContract;
            const tokenContract = getTokenContractAddress(tokenContractRaw);

            // Convertir name a snake_case y truncar a 32 bytes máximo
            const nameSnake = toSnakeCaseMax32(param.name);

            // Normalizar amount: puede venir como string o número
            // Asegurarse de convertirlo correctamente a número
            const amountRaw = param.amount;
            const amountNumber =
              typeof amountRaw === "string"
                ? parseFloat(amountRaw)
                : Number(amountRaw);

            console.log("💰 Procesamiento de monto:", {
              amountRaw: amountRaw,
              amountType: typeof amountRaw,
              amountNumber: amountNumber,
              amountIsNaN: isNaN(amountNumber),
              amountString: String(amountRaw),
            });

            // Calcular bytes para logging
            const nameBytes = new TextEncoder().encode(nameSnake).length;
            const descBytes = new TextEncoder().encode(descriptionSnake).length;

            console.log("🔄 Conversiones realizadas:", {
              nombreOriginal: param.name,
              nombreSnakeCase: nameSnake,
              nombreBytes: nameBytes,
              descripcionOriginal: param.description || param.name,
              descripcionSnakeCase: descriptionSnake,
              descripcionBytes: descBytes,
              tokenContractOriginal: tokenContractRaw,
              tokenContractMapeado: tokenContract,
              montoOriginal: amountRaw,
              montoComoNumero: amountNumber,
            });

            // Validar que no excedan 32 bytes
            if (nameBytes > 32) {
              console.warn(
                `⚠️ Nombre truncado: ${nameSnake} (${nameBytes} bytes, máximo 32)`
              );
            }
            if (descBytes > 32) {
              console.warn(
                `⚠️ Descripción truncada: ${descriptionSnake} (${descBytes} bytes, máximo 32)`
              );
            }

            // Obtener la lista de envelopes antes de crear para comparar después
            console.log("📋 Obteniendo lista de envelopes antes de crear...");
            const envelopesBefore = await listEnvelopes();
            console.log("📋 Envelopes antes:", envelopesBefore);
            const maxIdBefore =
              envelopesBefore.length > 0
                ? Math.max(...envelopesBefore.map((e) => Number(e.id)))
                : 0;
            console.log("🆔 ID máximo antes:", maxIdBefore);

            // Crear el envelope
            console.log("✨ Creando envelope...");
            await createEnvelope(nameSnake, descriptionSnake, tokenContract);
            console.log("✅ Envelope creado exitosamente");

            // Esperar un poco para que la transacción se procese en la blockchain
            console.log(
              "⏳ Esperando 2 segundos para que la transacción se procese..."
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Obtener la lista de envelopes después de crear
            console.log("📋 Obteniendo lista de envelopes después de crear...");
            const envelopesAfter = await listEnvelopes();
            console.log("📋 Envelopes después:", envelopesAfter);

            // Encontrar el nuevo envelope (el que tiene el ID más alto que antes)
            const newEnvelopes = envelopesAfter.filter(
              (e) => Number(e.id) > maxIdBefore
            );
            console.log("🆕 Nuevos envelopes encontrados:", newEnvelopes);

            // Si no encontramos un nuevo envelope, usar el de mayor ID
            const targetEnvelope =
              newEnvelopes.length > 0
                ? newEnvelopes.sort((a, b) => Number(b.id) - Number(a.id))[0]
                : envelopesAfter.sort((a, b) => Number(b.id) - Number(a.id))[0];

            console.log("🎯 Envelope objetivo:", targetEnvelope);

            // Usar amountNumber que ya normalizamos arriba
            if (targetEnvelope && amountNumber > 0 && !isNaN(amountNumber)) {
              // Depositar el monto en el envelope
              // USDC tiene 6 decimales, así que multiplicamos por 1,000,000
              // Para evitar problemas de precisión con números grandes, usamos string manipulation
              const amountString = amountNumber.toFixed(6); // Asegurar 6 decimales
              const [integerPart, decimalPart = ""] = amountString.split(".");
              const decimalPartPadded = decimalPart.padEnd(6, "0").slice(0, 6); // Asegurar exactamente 6 dígitos
              const amountInStroops = BigInt(integerPart + decimalPartPadded);

              console.log("💰 Depositando fondos:", {
                envelopeId: targetEnvelope.id,
                montoOriginalRaw: amountRaw,
                montoComoNumero: amountNumber,
                montoComoString: amountString,
                parteEntera: integerPart,
                parteDecimal: decimalPartPadded,
                montoEnStroops: amountInStroops.toString(),
                montoEnStroopsNumber: Number(amountInStroops),
                multiplicacionDirecta: amountNumber * 1000000,
                multiplicacionDirectaFloor: Math.floor(amountNumber * 1000000),
              });

              // Convertir amount a la cantidad mínima (stroops para USDC con 6 decimales)
              await deposit(BigInt(targetEnvelope.id), amountInStroops);
              console.log("✅ Depósito completado exitosamente");
            } else {
              if (!targetEnvelope) {
                console.warn(
                  "⚠️ No se encontró envelope objetivo para depositar"
                );
              }
              if (amountNumber === 0 || isNaN(amountNumber)) {
                console.log(
                  `ℹ️ El monto es ${amountNumber} (NaN: ${isNaN(amountNumber)}), no se realiza depósito`
                );
              }
            }
            console.log(`✅ Parámetro ${i + 1} procesado exitosamente\n`);
          } catch (error) {
            console.error(`❌ Error procesando parámetro ${i + 1}:`, error);
            console.error("Detalles del error:", {
              errorType:
                error instanceof Error ? error.constructor.name : typeof error,
              errorMessage:
                error instanceof Error ? error.message : String(error),
              errorStack: error instanceof Error ? error.stack : undefined,
            });
            // Agregar mensaje de error al chat
            setMessages((prev) => {
              const errorId =
                prev.length === 0 ? 1 : Math.max(...prev.map((m) => m.id)) + 1;
              return [
                ...prev,
                {
                  id: errorId,
                  text: `Error al procesar "${param.name}": ${error instanceof Error ? error.message : "Error desconocido"}`,
                  sender: "bot",
                },
              ];
            });
          }
        }
        console.log("🎉 Todas las instrucciones procesadas exitosamente");
      } catch (error) {
        console.error("❌ Error general manejando instrucciones:", error);
        console.error("Detalles del error:", {
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        setMessages((prev) => {
          const errorId =
            prev.length === 0 ? 1 : Math.max(...prev.map((m) => m.id)) + 1;
          return [
            ...prev,
            {
              id: errorId,
              text: "Error al ejecutar las instrucciones. Por favor, inténtalo de nuevo.",
              sender: "bot",
            },
          ];
        });
      } finally {
        setExecutingInstructions(false);
        console.log("🏁 Procesamiento de instrucciones finalizado");
      }
    },
    [createEnvelope, deposit, listEnvelopes]
  );

  // Al enviar mensaje del usuario, añadirlo a messages, luego llamar al endpoint /chat del backend
  const handleSendMessage = async () => {
    if (inputValue.trim() && !loading && !executingInstructions) {
      const messageText = inputValue.trim();

      // Añadir mensaje del usuario al historial
      setMessages((prev) => {
        const userMessageId =
          prev.length === 0 ? 1 : Math.max(...prev.map((m) => m.id)) + 1;
        const userMessage: ChatMessage = {
          id: userMessageId,
          text: messageText,
          sender: "user",
        };
        return [...prev, userMessage];
      });
      setInputValue("");

      // Bloquear input mientras se espera respuesta
      setLoading(true);

      try {
        // Enviar al backend
        console.log("📤 Enviando mensaje al backend:", {
          message: messageText,
          sessionId: sessionId,
          backendUrl: backendUrl,
        });

        const response = await fetch(`${backendUrl}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: messageText,
            sessionId: sessionId,
          }),
        });

        if (!response.ok) {
          console.error("❌ Error en la respuesta del backend:", {
            status: response.status,
            statusText: response.statusText,
          });
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Al recibir respuesta JSON
        const data = (await response.json()) as ChatResponse;
        console.log("📥 Respuesta completa del backend:", data);
        console.log(
          "📥 Respuesta completa del backend (stringified):",
          JSON.stringify(data, null, 2)
        );

        // El backend puede usar "response" o "message", preferir "response"
        const botMessageText = data.response || data.message || "Sin respuesta";
        console.log("💬 Mensaje del bot:", botMessageText);
        console.log("📋 Instrucciones recibidas:", data.instructions);
        console.log("🔍 Todas las claves de la respuesta:", Object.keys(data));

        // Añadir el mensaje del bot al historial
        setMessages((prev) => {
          const botMessageId =
            prev.length === 0 ? 1 : Math.max(...prev.map((m) => m.id)) + 1;
          const botMessage: ChatMessage = {
            id: botMessageId,
            text: botMessageText,
            sender: "bot",
          };
          return [...prev, botMessage];
        });

        // Verificar si existe json.instructions. Si existe, llamar a handleInstructions
        if (data.instructions) {
          console.log("🔧 Procesando instrucciones:", data.instructions);
          await handleInstructions(data.instructions);
        } else {
          console.log("ℹ️ No se recibieron instrucciones en la respuesta");
        }
      } catch (error) {
        console.error("❌ Error enviando mensaje al backend:", error);
        console.error("Detalles del error:", {
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          backendUrl: backendUrl,
          message: messageText,
          sessionId: sessionId,
        });
        // Mostrar mensaje de error al usuario
        setMessages((prev) => {
          const errorId =
            prev.length === 0 ? 1 : Math.max(...prev.map((m) => m.id)) + 1;
          return [
            ...prev,
            {
              id: errorId,
              text: "Lo siento, ha ocurrido un error. Inténtalo de nuevo.",
              sender: "bot",
            },
          ];
        });
      } finally {
        setLoading(false);
        console.log("🏁 Proceso de envío de mensaje finalizado");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !loading &&
      !executingInstructions
    ) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`floating-chatbot-button ${isDragging ? "dragging" : ""}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={() => {
          // Only toggle if not dragging
          if (!isDragging) {
            if (isOpen) {
              handleClose();
            } else {
              handleOpen();
            }
          }
        }}
        aria-label="Open chatbot"
      >
        <img
          src="/Geko.svg"
          alt="Geko Chatbot"
          style={{ width: "36px", height: "32px", objectFit: "contain" }}
        />
      </button>

      {isOpen && (
        <div
          ref={modalRef}
          className={`floating-chatbot-modal ${isClosing ? "closing" : isOpening ? "opening" : ""}`}
          style={{
            left: `${getSafeModalPosition().x}px`,
            top: `${getSafeModalPosition().y}px`,
          }}
        >
          <div className="floating-chatbot-header">
            <h3>Talk To Geko</h3>
            <button
              className="floating-chatbot-close"
              onClick={handleClose}
              aria-label="Close chatbot"
            >
              <Icon.XClose size="sm" />
            </button>
          </div>

          <div ref={messagesRef} className="floating-chatbot-messages">
            {messages.length === 0 ? (
              <div className="floating-chatbot-empty">
                <p>Start a conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`floating-chatbot-message ${
                      message.sender === "user" ? "user" : "bot"
                    }`}
                  >
                    <p>{message.text}</p>
                  </div>
                ))}
                {/* Mostrar indicador "El bot está escribiendo..." cuando loading */}
                {loading && (
                  <div className="floating-chatbot-message bot">
                    <p className="floating-chatbot-typing">
                      El bot está escribiendo...
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="floating-chatbot-input-container">
            <input
              type="text"
              className="floating-chatbot-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading || executingInstructions}
            />
            <button
              className="floating-chatbot-send"
              onClick={() => void handleSendMessage()}
              aria-label="Send message"
              disabled={loading || executingInstructions}
            >
              <Icon.Send01 size="sm" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
