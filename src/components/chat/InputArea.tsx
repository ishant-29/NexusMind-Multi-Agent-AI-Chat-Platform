"use client";
import { useState, useRef, useEffect } from "react";
import { ArrowUp, Paperclip, X, FileText, Mic, Video, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { validateFile, formatFileSize } from "@/lib/utils/fileHelpers";

interface Props {
  onSend: (content: string, scheduledFor?: Date, useWebSearch?: boolean, attachments?: any[]) => void;
  isLoading: boolean;
}

export default function InputArea({ onSend, isLoading }: Props) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [acceptFilter, setAcceptFilter] = useState<string>("*/*");
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef(false);
  // Mirrors isListening so recognition callbacks (bound once) see the current value
  const isListeningRef = useRef(false);

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || isUploading) return;

    let filesToSend = uploadedFiles;

    if (attachments.length > 0) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        attachments.forEach(file => formData.append("files", file));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const data = await response.json();
        filesToSend = data.files;
      } catch (error: any) {
        console.error("Upload error:", error);
        alert(error.message || "Failed to upload files. Please try again.");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSend(input.trim() || "[Sent with attachment]", undefined, webSearchEnabled, filesToSend);
    setInput("");
    setAttachments([]);
    setUploadedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      for (const file of newFiles) {
        const validation = validateFile(file);
        if (!validation.valid) {
          alert(validation.error);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }
      }

      setAttachments(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const triggerUpload = (filter: string) => {
    setAcceptFilter(filter);
    setShowUploadMenu(false);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          isRecognitionActiveRef.current = true;
        };

        recognition.onresult = (event: any) => {
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            }
          }

          if (finalTranscript) {
            setInput(prev => prev + finalTranscript);
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto";
              textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          isRecognitionActiveRef.current = false;

          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVoiceError('Microphone access denied');
            setTimeout(() => setVoiceError(null), 3000);
            setIsListening(false);
          } else if (event.error === 'no-speech') {
            // keep listening
          } else if (event.error === 'network') {
            setVoiceError('Network error');
            setTimeout(() => setVoiceError(null), 3000);
            setIsListening(false);
          } else if (event.error === 'aborted') {
            setIsListening(false);
          } else {
            setVoiceError('Recognition error');
            setTimeout(() => setVoiceError(null), 3000);
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          isRecognitionActiveRef.current = false;
          if (isListeningRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
              setIsListening(false);
            }
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current && isRecognitionActiveRef.current) {
        try {
          recognitionRef.current.stop();
          isRecognitionActiveRef.current = false;
        } catch (e) {
          isRecognitionActiveRef.current = false;
        }
      }
    };
  }, []);

  // Handle listening state changes
  useEffect(() => {
    isListeningRef.current = isListening;
    if (!recognitionRef.current) {
      if (isListening) {
        setVoiceError('Voice input not supported in this browser');
        setTimeout(() => setVoiceError(null), 3000);
        setIsListening(false);
      }
      return;
    }

    if (isListening) {
      if (!isRecognitionActiveRef.current) {
        try {
          setVoiceError(null);
          recognitionRef.current.start();
        } catch (e) {
          console.error('Failed to start recognition:', e);
          setVoiceError('Failed to start');
          setTimeout(() => setVoiceError(null), 3000);
          setIsListening(false);
        }
      }
    } else {
      if (isRecognitionActiveRef.current) {
        try {
          recognitionRef.current.stop();
          setVoiceError(null);
        } catch (e) {
          console.error('Failed to stop recognition:', e);
        }
      }
    }
  }, [isListening]);

  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isLoading && !isUploading;

  const iconButtonClass = (active: boolean) =>
    `nx-press p-2 rounded-lg transition-colors duration-150 ${
      active
        ? "text-accent bg-[oklch(0.82_0.13_205_/_0.12)]"
        : "text-ink-faint hover:text-ink hover:bg-raised"
    }`;

  return (
    <div className="px-4 pb-4 pt-2 relative z-20">
      <div className="max-w-3xl mx-auto">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2.5 px-1">
            {attachments.map((file, i) => (
              <div key={i} className="flex items-center gap-2 bg-raised border border-[var(--border-subtle)] rounded-[10px] px-2.5 py-1.5">
                <FileText size={13} className="text-accent" />
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-ink max-w-[140px] truncate">{file.name}</span>
                  <span className="text-[10px] text-ink-faint">{formatFileSize(file.size)}</span>
                </div>
                <button
                  onClick={() => removeAttachment(i)}
                  className="text-ink-faint hover:text-danger transition-colors duration-150 p-0.5 rounded"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={`nx-glass relative flex items-end gap-1 rounded-2xl px-2 py-1.5 transition-shadow duration-200 ${
            isListening || isLoading ? "nx-live" : "focus-within:nx-live"
          }`}
        >
          {/* Attach */}
          <div className="relative">
            <button
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              className={iconButtonClass(showUploadMenu)}
              title="Attach file"
              aria-label="Attach file"
              aria-expanded={showUploadMenu}
            >
              <Paperclip size={17} />
            </button>

            <AnimatePresence>
              {showUploadMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                  style={{ transformOrigin: "bottom left", zIndex: "var(--z-dropdown)" }}
                  className="absolute bottom-12 left-0 w-40 nx-glass rounded-xl p-1.5 flex flex-col gap-0.5"
                >
                  <button
                    onClick={() => triggerUpload('.pdf,.txt,.doc,.docx')}
                    className="flex items-center gap-2.5 text-left px-3 py-2 text-[13px] font-medium text-ink-secondary hover:text-ink hover:bg-raised rounded-lg transition-colors duration-150"
                  >
                    <FileText size={14} className="text-accent" /> Documents
                  </button>
                  <button
                    onClick={() => triggerUpload('video/*')}
                    className="flex items-center gap-2.5 text-left px-3 py-2 text-[13px] font-medium text-ink-secondary hover:text-ink hover:bg-raised rounded-lg transition-colors duration-150"
                  >
                    <Video size={14} className="text-accent" /> Videos
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={acceptFilter}
            className="hidden"
            multiple
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening…" : "Message NexusMind…"}
            rows={1}
            disabled={isLoading || isListening}
            className="flex-1 bg-transparent text-ink text-[14px] resize-none outline-none max-h-40 py-2.5 px-1.5 custom-scrollbar placeholder:text-ink-faint disabled:opacity-60"
          />

          <div className="flex items-center gap-0.5 shrink-0 pb-0.5">
            <button
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={iconButtonClass(webSearchEnabled)}
              title={webSearchEnabled ? "Web search on" : "Web search off"}
              aria-pressed={webSearchEnabled}
            >
              <Globe size={17} />
            </button>

            <div className="relative">
              <button
                onClick={() => setIsListening(!isListening)}
                className={`nx-press p-2 rounded-lg transition-colors duration-150 ${
                  isListening
                    ? "text-danger bg-[oklch(0.68_0.19_20_/_0.14)]"
                    : "text-ink-faint hover:text-ink hover:bg-raised"
                }`}
                title={voiceError || "Voice input"}
                aria-pressed={isListening}
              >
                <Mic size={17} className={isListening ? "animate-pulse" : ""} />
              </button>

              <AnimatePresence>
                {voiceError && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    role="status"
                    style={{ zIndex: "var(--z-tooltip)" }}
                    className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 rounded-lg bg-overlay border border-[var(--border-strong)] text-warning text-[11px] whitespace-nowrap shadow-lg shadow-black/30"
                  >
                    {voiceError}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleSend}
              disabled={!canSend}
              className={`nx-press ml-1 p-2 rounded-xl transition-colors duration-150 ${
                canSend
                  ? "bg-accent text-accent-ink hover:bg-accent-strong"
                  : "bg-raised text-ink-faint cursor-not-allowed"
              }`}
              title="Send"
              aria-label="Send message"
            >
              {isUploading ? (
                <span className="block w-[17px] h-[17px] rounded-full border-2 border-accent border-t-transparent animate-spin" />
              ) : (
                <ArrowUp size={17} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-ink-faint">
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
