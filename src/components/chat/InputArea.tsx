"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, FileText, Mic, Video, Globe } from "lucide-react";
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

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading || isUploading) return;
    
    let filesToSend = uploadedFiles;
    
    // Upload any pending files
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
      
      // Validate each file
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
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update input with final transcript
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
          
          if (event.error === 'not-allowed') {
            setVoiceError('Microphone access denied');
            alert('Microphone access denied. Please allow microphone access in your browser settings.');
            setIsListening(false);
          } else if (event.error === 'no-speech') {
            console.log('No speech detected');
            // Don't stop listening for no-speech, just continue
          } else if (event.error === 'network') {
            setVoiceError('Network error');
            console.warn('Network error - speech recognition requires internet connection');
            // Show a less intrusive message
            setTimeout(() => setVoiceError(null), 3000);
            setIsListening(false);
          } else if (event.error === 'aborted') {
            console.log('Speech recognition aborted');
            setIsListening(false);
          } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVoiceError('Permission denied');
            console.warn('Speech recognition permission denied');
            setTimeout(() => setVoiceError(null), 3000);
            setIsListening(false);
          } else {
            setVoiceError('Recognition error');
            console.warn('Speech recognition error:', event.error);
            setTimeout(() => setVoiceError(null), 3000);
            setIsListening(false);
          }
        };

        recognition.onend = () => {
          isRecognitionActiveRef.current = false;
          if (isListening) {
            // Restart if still in listening mode
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
          // Silently handle cleanup errors
          isRecognitionActiveRef.current = false;
        }
      }
    };
  }, []);

  // Handle listening state changes
  useEffect(() => {
    if (!recognitionRef.current) {
      if (isListening) {
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        setIsListening(false);
      }
      return;
    }

    if (isListening) {
      // Only start if not already active
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
      // Only stop if currently active
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

  return (
    <div className="px-6 pb-5 pt-2 bg-transparent relative z-20">
      <div className="max-w-3xl mx-auto">
        {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 px-1">
                {attachments.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white border border-[#d4dbe8] rounded-lg px-2.5 py-1.5 shadow-sm">
                        <FileText size={14} className="text-[#3b82f6]" />
                        <div className="flex flex-col">
                          <span className="text-[12px] font-medium text-[#475569] max-w-[120px] truncate">{file.name}</span>
                          <span className="text-[10px] text-[#94a3b8]">{formatFileSize(file.size)}</span>
                        </div>
                        <button onClick={() => removeAttachment(i)} className="text-[#94a3b8] hover:text-red-500 transition-colors bg-slate-50 hover:bg-red-50 p-0.5 rounded-md">
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className={`relative flex items-end gap-2 bg-white border rounded-2xl px-2 py-1.5 shadow-sm transition-all duration-300 ${
          isListening 
            ? 'border-red-400 shadow-red-100 shadow-lg animate-pulse-border' 
            : 'border-[#d4dbe8] focus-within:border-[#93b4e8]'
        }`}>
          <div className="relative">
              <button 
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                className={`p-2.5 rounded-xl transition-colors mb-0.5 ${showUploadMenu ? 'bg-blue-100 text-[#3b82f6]' : 'text-[#64748b] hover:text-[#3b82f6] hover:bg-blue-50'}`}
                title="Attach file"
              >
                  <Paperclip size={18} />
              </button>

              <AnimatePresence>
                  {showUploadMenu && (
                     <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-12 left-0 w-36 bg-white border border-[#e2e8f0] rounded-xl shadow-lg p-1.5 flex flex-col gap-0.5 z-50"
                     >
                        <button onClick={() => triggerUpload('.pdf,.txt,.doc,.docx')} className="flex items-center gap-2.5 text-left px-3 py-2 text-[13px] font-medium text-[#475569] hover:text-[#3b82f6] hover:bg-blue-50/80 rounded-lg transition-colors">
                            <FileText size={14} /> Documents
                        </button>
                        <button onClick={() => triggerUpload('video/*')} className="flex items-center gap-2.5 text-left px-3 py-2 text-[13px] font-medium text-[#475569] hover:text-[#3b82f6] hover:bg-blue-50/80 rounded-lg transition-colors">
                            <Video size={14} /> Videos
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

          {isListening && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute left-14 top-1/2 -translate-y-1/2 flex items-center gap-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-red-400 rounded-full"
                  animate={{
                    height: [8, 16, 8],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </motion.div>
          )}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Type your message..."}
            rows={1}
            disabled={isLoading || isListening}
            className={`flex-1 bg-transparent text-[#0f172a] text-[14px] resize-none outline-none max-h-40 py-2.5 custom-scrollbar disabled:opacity-50 transition-all ${
              isListening 
                ? 'placeholder-red-400 ml-8' 
                : 'placeholder-[#94a3b8] ml-1'
            }`}
          />

          <div className="flex items-center gap-1.5 flex-shrink-0 pb-1 pr-1">
            <button 
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`p-2 rounded-xl transition-all ${
                  webSearchEnabled 
                  ? "text-[#3b82f6] bg-blue-50" 
                  : "text-[#94a3b8] hover:text-[#3b82f6] hover:bg-blue-50"
              }`}
              title={webSearchEnabled ? "Web search enabled" : "Web search disabled"}
            >
                <Globe size={18} />
            </button>

            <div className="relative">
              <button 
                onClick={() => setIsListening(!isListening)}
                className={`p-2 rounded-xl transition-all ${
                    isListening 
                    ? "text-red-500 bg-red-50 animate-pulse" 
                    : voiceError
                    ? "text-orange-500 bg-orange-50"
                    : "text-[#94a3b8] hover:text-[#3b82f6] hover:bg-blue-50"
                }`}
                title={voiceError || "Voice input"}
              >
                  <Mic size={18} />
              </button>
              
              {voiceError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-orange-500 text-white text-[10px] rounded whitespace-nowrap shadow-lg"
                >
                  {voiceError}
                </motion.div>
              )}
            </div>

            <button
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isLoading || isUploading}
              className="p-2 text-[#94a3b8] hover:text-[#3b82f6] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-[18px] w-[18px] border-2 border-[#3b82f6] border-t-transparent" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}