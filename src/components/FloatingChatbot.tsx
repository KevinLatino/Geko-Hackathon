import { Icon } from "@stellar/design-system";
import React, { useEffect, useRef, useState } from "react";
import "./FloatingChatbot.css";

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
  const [messages, setMessages] = useState<
    Array<{ id: number; text: string; sender: "user" | "bot" }>
  >([]);
  const [inputValue, setInputValue] = useState("");

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputValue,
        sender: "user" as const,
      };
      setMessages([...messages, newMessage]);
      setInputValue("");

      // Simulate bot response
      setTimeout(() => {
        const botResponse = {
          id: messages.length + 2,
          text: "Thanks for your message! I'm here to help.",
          sender: "bot" as const,
        };
        setMessages((prev) => [...prev, botResponse]);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`floating-chatbot-message ${
                    message.sender === "user" ? "user" : "bot"
                  }`}
                >
                  <p>{message.text}</p>
                </div>
              ))
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
            />
            <button
              className="floating-chatbot-send"
              onClick={handleSendMessage}
              aria-label="Send message"
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
