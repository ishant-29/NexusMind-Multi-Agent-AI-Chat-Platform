# MetaWurks Chat UI

A modern, AI-powered chat application with microservices architecture, featuring multiple AI agents, RAG (Retrieval-Augmented Generation) document search, and real-time conversation management.

## 🚀 Features

### Core Features
- **4 Specialized AI Agents** powered by Groq Llama 3.3 70B
  - General Assistant (hidden default, always available)
  - Research Agent (with conditional Tavily web search)
  - Coding Agent (code writing and debugging)
  - Creative Writing Agent (storytelling and content)
- **RAG Document System** - Upload, chunk, vectorize, and search documents
  - Semantic search using OpenAI embeddings
  - Support for PDF, TXT, DOC, DOCX files
  - "My Stuff" sidebar for document management
- **Real-time Chat** with streaming responses via SSE
- **Conversation Management** with branching support
- **File Attachments** - Upload and process multiple file types
- **Voice Input** - Speech-to-text support in chat
- **Web Search Toggle** - Enable/disable web search per message
- **Authentication** - Google and GitHub OAuth via NextAuth
- **Responsive UI** - Modern glassmorphic design with animations

### Technical Features
- Microservices architecture (5 independent services)
- MongoDB Atlas for data persistence and vector storage
- OpenAI text-embedding-3-small for document embeddings (1536 dimensions)
- Agno framework v2.0+ for AI agent orchestration
- Next.js 14 with App Router and Server Components
- TypeScript (frontend & services) + Python (agent service)
- Real-time streaming with Server-Sent Events (SSE)
- Intelligent document chunking with overlap
- Cosine similarity for semantic search
- JWT-based authentication with OAuth providers

---

## 📁 Project Structure

```
CHAT_UI-METAWURKS-/
├── src/                          # Frontend (Next.js)
│   ├── app/                      # App router pages & API routes
│   │   ├── api/                  # API endpoints
│   │   │   ├── chat/             # Chat & agent endpoints
│   │   │   ├── documents/        # Document management
│   │   │   └── ...               # Other API routes
│   │   ├── chat/                 # Chat pages
│   │   └── page.tsx              # Home page
│   ├── components/               # React components
│   │   ├── chat/                 # Chat UI components
│   │   ├── sidebar/              # My Stuff sidebar
│   │   └── ui/                   # Reusable UI components
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Utilities and services
│   └── types/                    # TypeScript types
├── services/                     # Backend microservices
│   ├── agent-service/            # AI agents (Python/Agno)
│   │   ├── agents/               # Agent configurations
│   │   │   └── agent_config.py   # 4 agent definitions
│   │   ├── tools/                # Custom tools
│   │   │   ├── custom_tools.py   # Text analysis tools
│   │   │   └── rag_tool.py       # RAG search tool
│   │   ├── main.py               # FastAPI server
│   │   └── requirements.txt      # Python dependencies
│   ├── auth-service/             # Authentication (Node.js)
│   ├── conversation-service/     # Chat management (Node.js)
│   ├── file-service/             # File upload & RAG (Node.js)
│   │   ├── src/
│   │   │   ├── models/           # MongoDB schemas
│   │   │   │   └── Document.ts   # Document & chunk models
│   │   │   ├── services/         # Business logic
│   │   │   │   ├── embeddingService.ts
│   │   │   │   ├── chunkingService.ts
│   │   │   │   └── documentProcessor.ts
│   │   │   ├── controllers/      # API controllers
│   │   │   └── routes/           # API routes
│   │   └── uploads/              # Uploaded files storage
│   └── user-service/             # User management (Node.js)
├── public/                       # Static assets
│   ├── metawurks-logo.svg        # Logo
│   └── uploads/                  # Public file uploads
├── .env.local                    # Environment variables
├── .env.example                  # Environment template
├── start-services.bat            # Start all services (Windows)
├── kill-services.bat             # Stop all services (Windows)
├── package.json                  # Frontend dependencies
└── README.md                     # This file
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom + Framer Motion
- **State Management:** React Hooks
- **Authentication:** NextAuth.js

### Backend Services
- **Agent Service:** Python + Agno + FastAPI
- **Other Services:** Node.js + Express + TypeScript
- **Database:** MongoDB Atlas
- **Vector Search:** OpenAI Embeddings

### AI & ML
- **LLM:** Groq (Llama 3.3 70B)
- **Web Search:** Tavily API
- **Embeddings:** OpenAI text-embedding-3-small
- **Agent Framework:** Agno

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- MongoDB Atlas account
- API Keys:
  - OpenAI API key (for embeddings)
  - Groq API key (for LLM)
  - Tavily API key (for web search)

### 1. Clone Repository
```bash
git clone <repository-url>
cd CHAT_UI-METAWURKS-
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Agent Service:**
```bash
cd services/agent-service
pip install -r requirements.txt
```

**Other Services:**
```bash
cd services/auth-service && npm install
cd ../conversation-service && npm install
cd ../file-service && npm install
cd ../user-service && npm install
```

### 3. Configure Environment Variables

**Root `.env.local`:** (Frontend & NextAuth)
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/metawurks

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# API Keys (for frontend API routes)
GROQ_API_KEY=gsk_your-groq-api-key
TAVILY_API_KEY=tvly-your-tavily-api-key
OPENAI_API_KEY=sk-your-openai-api-key

# Service URLs (for frontend to backend communication)
AUTH_SERVICE_URL=http://localhost:4000
USER_SERVICE_URL=http://localhost:4001
CONVERSATION_SERVICE_URL=http://localhost:4002
FILE_SERVICE_URL=http://localhost:4003
AGENT_SERVICE_URL=http://localhost:7777
```

**Agent Service `.env`:** (`services/agent-service/.env`)
```env
# API Keys
GROQ_API_KEY=gsk_your-groq-api-key
TAVILY_API_KEY=tvly-your-tavily-api-key

# Service Configuration
AGNO_PORT=7777
CORS_ORIGIN=http://localhost:3000

# Service URLs
FILE_SERVICE_URL=http://localhost:4003

# MongoDB (optional for agent memory)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/metawurks
```

**File Service `.env`:** (`services/file-service/.env`)
```env
NODE_ENV=development
PORT=4003

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/metawurks

# JWT Secret (for auth verification)
JWT_SECRET=your-jwt-secret-key

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your-openai-api-key
EMBEDDING_MODEL=text-embedding-3-small

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Auth Service `.env`:** (`services/auth-service/.env`)
```env
NODE_ENV=development
PORT=4000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/metawurks

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=30d

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Conversation Service `.env`:** (`services/conversation-service/.env`)
```env
NODE_ENV=development
PORT=4002

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/metawurks

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# CORS
CORS_ORIGIN=http://localhost:3000
```

**User Service `.env`:** (`services/user-service/.env`)
```env
NODE_ENV=development
PORT=4001

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/metawurks

# JWT Secret
JWT_SECRET=your-jwt-secret-key

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Important Notes:**
- Use the same `JWT_SECRET` across all services
- Use the same `MONGODB_URI` for all services
- Get API keys from:
  - OpenAI: https://platform.openai.com/api-keys
  - Groq: https://console.groq.com/keys
  - Tavily: https://tavily.com
  - OAuth: Google Cloud Console & GitHub Settings

### 4. Start Services

**Option 1: Use Batch Script (Windows) - Recommended**
```bash
start-services.bat
```
This will open 6 terminal windows, one for each service.

**Option 2: Manual Start (Any OS)**

Open 6 separate terminals:

**Terminal 1 - Frontend:**
```bash
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Agent Service:**
```bash
cd services/agent-service
python main.py
# Runs on http://localhost:7777
```

**Terminal 3 - Auth Service:**
```bash
cd services/auth-service
npm run dev
# Runs on http://localhost:4000
```

**Terminal 4 - Conversation Service:**
```bash
cd services/conversation-service
npm run dev
# Runs on http://localhost:4002
```

**Terminal 5 - File Service:**
```bash
cd services/file-service
npm run dev
# Runs on http://localhost:4003
```

**Terminal 6 - User Service:**
```bash
cd services/user-service
npm run dev
# Runs on http://localhost:4001
```

**Verify All Services Are Running:**
- Frontend: http://localhost:3000
- Agent Service: http://localhost:7777/health
- Auth Service: http://localhost:4000/health
- Conversation Service: http://localhost:4002/health
- File Service: http://localhost:4003/health
- User Service: http://localhost:4001/health

**Stop All Services:**
```bash
kill-services.bat  # Windows
# Or press Ctrl+C in each terminal
```

### 5. Access Application
Open http://localhost:3000

---

## 🤖 AI Agents

All agents use **Groq Llama 3.3 70B Versatile** model and have access to **RAG document search**.

### 1. General Assistant (Hidden Default)
- **ID:** `general`
- **Visibility:** Hidden from selector, works as default
- **Purpose:** General conversation and assistance
- **Tools:** RAG document search
- **Use Case:** Default agent when no specific agent is selected
- **Instructions:** Helpful, conversational, adapts to user needs

### 2. Research Agent
- **ID:** `research`
- **Visibility:** Shown in selector (🔍)
- **Purpose:** Web research and information gathering
- **Tools:** 
  - Tavily web search (only when web search toggle is ON)
  - RAG document search
- **Use Case:** Finding current information, research tasks, fact-checking
- **Instructions:** Search web for accurate info, cite sources, provide comprehensive answers
- **Note:** Web search is conditional - user controls via toggle button

### 3. Coding Agent
- **ID:** `coding`
- **Visibility:** Shown in selector (💻)
- **Purpose:** Code writing, debugging, and explanation
- **Tools:** RAG document search
- **Use Case:** Programming help, code review, debugging, best practices
- **Instructions:** Write clean code, explain step-by-step, follow best practices

### 4. Creative Writing Agent
- **ID:** `creative`
- **Visibility:** Shown in selector (✍️)
- **Purpose:** Creative content and storytelling
- **Tools:** RAG document search
- **Use Case:** Writing stories, poems, creative content, narratives
- **Instructions:** Be creative, use vivid descriptions, adapt tone to request

### Agent Selection
- **Default:** General Assistant (automatic, no selection needed)
- **Selector:** Shows 3 agents (Research, Coding, Creative)
- **Switching:** Click agent selector in header to change
- **Persistence:** Selected agent persists during conversation

---

## 📚 RAG Document System

### Overview
The RAG (Retrieval-Augmented Generation) system allows you to upload documents, which are automatically processed, chunked, vectorized, and stored in MongoDB. Agents can then search these documents to provide context-aware answers.

### Features
- **Upload documents** (PDF, TXT, DOC, DOCX) up to 50MB
- **Automatic processing:**
  - Text extraction (pdf-parse, mammoth)
  - Intelligent chunking with 200-char overlap
  - Vector embeddings via OpenAI
  - Storage in MongoDB Atlas
- **Semantic search** using cosine similarity
- **Document management** in "My Stuff" sidebar
- **Multi-document search** across your entire knowledge base

### How It Works

**1. Upload & Processing Pipeline:**
```
Upload → Text Extraction → Chunking → Embedding → MongoDB Storage
```

- **Text Extraction:** Extracts text from PDF/DOC/DOCX files
- **Chunking:** Splits into 500-2000 char chunks (adaptive based on length)
- **Overlap:** 200 characters between chunks to preserve context
- **Embeddings:** OpenAI text-embedding-3-small (1536 dimensions)
- **Storage:** Chunks + embeddings stored in MongoDB

**2. Search Flow:**
```
Query → Generate Embedding → Calculate Similarity → Return Top Results → Agent Uses Context
```

- **Query Embedding:** User question converted to vector
- **Similarity:** Cosine similarity calculated for all chunks
- **Ranking:** Results sorted by relevance score (0.0-1.0)
- **Threshold:** Default minimum score of 0.7
- **Context:** Top results provided to agent for answer generation

### How to Use

**1. Upload Document:**
   - Click "My Stuff" button in chat header
   - Click "Upload Document" button
   - Select file (PDF, TXT, DOC, DOCX)
   - Wait for processing status:
     - ⏳ Processing (chunking & embedding)
     - ✅ Completed (ready to search)
     - ❌ Failed (check logs)

**2. Search Documents:**
   - **Automatic:** Ask agent "What does my document say about X?"
   - **Explicit:** "Search my documents for [topic]"
   - **List first:** "What documents do I have?" then ask questions
   - Agent automatically uses RAG tool to search and cite sources

**3. Manage Documents:**
   - **View all:** Open "My Stuff" sidebar
   - **Search:** Use search bar to filter by name
   - **Details:** Click expand arrow to see chunks, words, pages
   - **Delete:** Click trash icon to remove document
   - **Status:** Check processing status (✅⏳❌)

### Supported File Types
- **PDF** (`.pdf`) - Extracted using pdf-parse
- **Text** (`.txt`) - Direct text reading
- **Word** (`.doc`, `.docx`) - Extracted using mammoth

### RAG Tools (Available to All Agents)

**1. search_documents(query, document_ids, limit, min_score)**
   - Search user's documents for relevant information
   - Returns top N most relevant chunks with scores
   - Can filter by specific document IDs

**2. list_documents()**
   - List all uploaded documents
   - Shows status, chunks, upload date

**3. get_document_info(document_id)**
   - Get detailed info about specific document
   - Shows metadata, word count, pages

### Performance
- **Processing:** 5-30 seconds per document
- **Search:** 1-2 seconds per query
- **Storage:** ~6KB per chunk (embeddings)
- **Batch processing:** 10 chunks at a time to avoid rate limits

---

## 🔌 API Endpoints

### Frontend (Port 3000)
- `/` - Chat interface
- `/chat/[id]` - Specific conversation
- `/api/chat/agent` - Agent streaming endpoint
- `/api/documents/*` - Document management

### Agent Service (Port 7777)
- `GET /health` - Health check
- `GET /api/agents/list` - List available agents
- `POST /api/agent/run` - Run agent with message

### Auth Service (Port 4000)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Conversation Service (Port 4002)
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message

### File Service (Port 4003)
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `POST /api/documents/search` - RAG search
- `DELETE /api/documents/:id` - Delete document

### User Service (Port 4001)
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

---

## 🎨 UI Features

### Chat Interface
- Real-time message streaming
- Markdown rendering
- Code syntax highlighting
- File attachments preview
- Voice input support
- Web search toggle
- Agent selector

### My Stuff Sidebar
- Document upload interface
- Document list with status
- Search/filter documents
- Expand for details
- Delete documents
- Status indicators (✅⏳❌)

### Responsive Design
- Mobile-friendly
- Dark mode support
- Glassmorphic UI
- Smooth animations
- Loading states

---

## 🔐 Security

- JWT-based authentication
- OAuth integration (Google, GitHub)
- User-scoped data access
- File type validation
- File size limits
- CORS configuration
- Environment variable protection

---

## 📊 Performance

### Document Processing
- Text extraction: 1-5 seconds
- Chunking: < 1 second
- Embedding generation: 2-5 seconds per 10 chunks
- Total: 5-30 seconds per document

### Search Performance
- Query embedding: ~1 second
- Similarity calculation: < 1 second for 1000 chunks
- Total search: 1-2 seconds

### Chat Response
- Streaming starts: < 1 second
- Full response: 2-10 seconds (depends on length)

---

## 🐛 Troubleshooting

### Services Won't Start
- Check if ports are available (3000, 4000-4003, 7777)
- Verify MongoDB connection string
- Check API keys are set
- Review service logs for errors

### Document Upload Fails
- Verify file size < 50MB
- Check file type is supported
- Ensure OpenAI API key is set
- Check file service logs

### Agent Not Responding
- Verify Groq API key is set
- Check agent service is running
- Review agent service logs
- Ensure MongoDB connection

### Web Search Not Working
- Verify Tavily API key is set
- Check web search toggle is ON
- Select Research Agent
- Check agent service logs

---

## 📝 Development

### Run in Development Mode
```bash
# Frontend with hot reload
npm run dev

# Services with nodemon
cd services/[service-name]
npm run dev
```

### Build for Production
```bash
# Frontend
npm run build
npm start

# Services
cd services/[service-name]
npm run build
npm start
```

### Code Quality
```bash
# Lint
npm run lint

# Type check
npm run type-check
```

---

## 🚢 Deployment

### Manual Deployment
1. Build all services
2. Set production environment variables
3. Deploy to hosting platform (Vercel, Railway, etc.)
4. Configure MongoDB Atlas
5. Set up reverse proxy if needed

### Production Checklist
- [ ] Set all environment variables
- [ ] Configure MongoDB Atlas with production credentials
- [ ] Set secure JWT secrets
- [ ] Configure OAuth callbacks for production domain
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Set up backup strategy

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review service logs

---

## 🎯 Roadmap

### Planned Features
- [ ] Document # autocomplete in chat
- [ ] Document preview/viewer
- [ ] Batch document upload
- [ ] Document folders
- [ ] Advanced search filters
- [ ] Document sharing
- [ ] OCR for scanned PDFs
- [ ] Multi-language support
- [ ] Custom agent creation
- [ ] Agent marketplace
- [ ] Mobile app
- [ ] Desktop app

---

## 📚 Documentation

### Project Files
- **README.md** - Complete project documentation (this file)
- **.env.example** - Environment variable template
- **start-services.bat** - Start all services (Windows)
- **kill-services.bat** - Stop all services (Windows)
- **CLEANUP_SUMMARY.txt** - List of removed files

### No Additional Documentation
All documentation has been consolidated into this README.md file for simplicity.

---

## 🔄 Recent Changes

### Latest Updates
- ✅ Reduced from 11 agents to 4 agents
- ✅ Implemented RAG document system with vector search
- ✅ Added "My Stuff" sidebar for document management
- ✅ Made web search conditional (toggle button)
- ✅ Removed all unnecessary documentation files
- ✅ Removed Docker/infrastructure files (not used)
- ✅ Consolidated all docs into single README.md

### Architecture
- **No Docker:** Services run manually on local machine
- **No NGINX:** Direct service-to-service communication
- **MongoDB Atlas:** Cloud database (not local)
- **Manual Deployment:** Each service runs independently

---

**Built with ❤️ using Next.js, Agno, and Groq**
