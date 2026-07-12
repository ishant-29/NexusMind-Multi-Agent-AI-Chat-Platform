'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  File,
  FileText,
  Trash2,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  ChevronRight,
  ChevronDown,
  Hash,
} from 'lucide-react';

interface Document {
  _id: string;
  originalName: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: 'processing' | 'completed' | 'failed';
  totalChunks: number;
  metadata?: {
    wordCount?: number;
    totalPages?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface MyStuffSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentSelect?: (documentId: string, documentName: string) => void;
}

export default function MyStuffSidebar({ isOpen, onClose, onDocumentSelect }: MyStuffSidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();

      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExt)) {
      alert(`File type not supported. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        fetchDocuments();
      } else {
        alert(`Upload failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Delete this document?')) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setDocuments(docs => docs.filter(doc => doc._id !== documentId));
      } else {
        alert(`Delete failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={15} className="text-success" />;
      case 'processing':
        return <Clock size={15} className="text-accent animate-pulse" />;
      case 'failed':
        return <AlertCircle size={15} className="text-danger" />;
      default:
        return <File size={15} className="text-ink-faint" />;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 'var(--z-backdrop)' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed left-0 top-0 bottom-0 w-[380px] max-w-[92vw] bg-surface border-r border-[var(--border-subtle)] flex flex-col"
            style={{ zIndex: 'var(--z-modal)' }}
            role="dialog"
            aria-label="My Stuff: document library"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--border-subtle)] shrink-0">
              <h2 className="text-[15px] font-semibold text-ink flex items-center gap-2">
                <FileText size={17} className="text-accent" />
                My Stuff
              </h2>
              <button
                onClick={onClose}
                className="nx-press p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-raised transition-colors duration-150"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            {/* Upload */}
            <div className="p-4 border-b border-[var(--border-subtle)] shrink-0">
              <label className="nx-press flex items-center justify-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-strong text-accent-ink rounded-[10px] cursor-pointer transition-colors duration-150 text-[13px] font-semibold">
                <Upload size={15} />
                {uploading ? 'Uploading…' : 'Upload document'}
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.txt,.doc,.docx"
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <p className="text-[11.5px] text-ink-faint mt-2 text-center">
                PDF, TXT, DOC, DOCX · up to 50MB
              </p>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  type="text"
                  placeholder="Search documents"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-raised border border-[var(--border-subtle)] rounded-[10px] text-[13px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-[var(--accent)] transition-colors duration-150"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 min-h-0">
              {loading ? (
                <div className="space-y-2" aria-hidden="true">
                  {[100, 80, 90].map((w, i) => (
                    <div key={i} className="nx-skeleton h-14" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <FileText size={28} className="mx-auto text-ink-faint mb-3" />
                  <p className="text-[13px] text-ink-secondary">
                    {searchQuery ? 'No documents match your search.' : 'No documents yet.'}
                  </p>
                  {!searchQuery && (
                    <p className="text-[12px] text-ink-faint mt-1.5 leading-relaxed">
                      Upload a document and agents can search it when answering you.
                    </p>
                  )}
                </div>
              ) : (
                filteredDocuments.map((doc) => (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-[10px] border border-[var(--border-subtle)] bg-raised/60 p-3 hover:bg-raised transition-colors duration-150"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="shrink-0 mt-0.5">{getStatusIcon(doc.status)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => setExpandedDoc(expandedDoc === doc._id ? null : doc._id)}
                            className="flex-1 text-left min-w-0"
                          >
                            <h3 className="font-medium text-[13px] text-ink truncate">
                              {doc.originalName}
                            </h3>
                            <p className="text-[11.5px] text-ink-faint mt-0.5">
                              {formatFileSize(doc.fileSize)} · {formatDate(doc.createdAt)}
                            </p>
                          </button>

                          <div className="flex items-center gap-0.5 shrink-0">
                            {doc.status === 'completed' && onDocumentSelect && (
                              <button
                                onClick={() => onDocumentSelect(doc._id, doc.originalName)}
                                className="p-1.5 rounded-md text-accent hover:bg-overlay transition-colors duration-150"
                                title="Reference in chat"
                              >
                                <Hash size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(doc._id)}
                              className="p-1.5 rounded-md text-ink-faint hover:text-danger hover:bg-overlay transition-colors duration-150"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              onClick={() => setExpandedDoc(expandedDoc === doc._id ? null : doc._id)}
                              className="p-1.5 rounded-md text-ink-faint hover:text-ink hover:bg-overlay transition-colors duration-150"
                              aria-label={expandedDoc === doc._id ? 'Collapse details' : 'Expand details'}
                            >
                              {expandedDoc === doc._id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {expandedDoc === doc._id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-[11.5px] text-ink-faint space-y-1">
                                <div>Status: <span className="text-ink-secondary capitalize">{doc.status}</span></div>
                                <div>Chunks: <span className="text-ink-secondary">{doc.totalChunks}</span></div>
                                {doc.metadata?.wordCount && (
                                  <div>Words: <span className="text-ink-secondary">{doc.metadata.wordCount.toLocaleString()}</span></div>
                                )}
                                {doc.metadata?.totalPages && (
                                  <div>Pages: <span className="text-ink-secondary">{doc.metadata.totalPages}</span></div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[var(--border-subtle)] text-[11.5px] text-ink-faint text-center shrink-0">
              {documents.length} document{documents.length !== 1 ? 's' : ''} in your library
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
