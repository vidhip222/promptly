# 🚀 Promptly

Promptly is a no-code platform for building **custom AI chatbots** for specific departments or domains—starting with HR. Upload documents, define your bot’s personality, and instantly deploy it via chat, Slack, or embed on your site.

---

## 🛠️ Tech Stack

| Layer         | Technology                            |
|---------------|----------------------------------------|
| Frontend      | React (Next.js), TailwindCSS           |
| Backend       | FastAPI (Python)                       |
| LLMs          | Gemini Chat & Assistants API           |
| Embeddings    | Gemini `2.0 Flash`        |
| Vector DB     | Pinecone (semantic search)             |
| File Parsing  | LangChain, Pdf-Parse, Mammoth, Unstructured |
| Auth          | Supabase Auth            |
| Storage       | Supabase Storage               |
| Database      | PostgreSQL (via Supabase)   |
| Hosting       | Vercel (frontend), Render (backend)    |

---

## 💡 Features

- ✨ Build custom chatbots with personas (e.g., HR Manager, IT Support)
- 📁 Upload internal docs (PDF, DOCX, TXT, CSV)
- 🔍 Retrieve answers based on your company's real data
- 🔗 Deploy via shareable link, Slack, or website widget
- 🧠 Powered by Gemini 2.0 + semantic search
- 🌐 Web Crawler Support
- 🧩 Templates
- 🎭 Custom Personalities & Tone
---

## 🧑‍💻 Local Setup Instructions

### 1. Clone the Repo

\`\`\`bash
git clone https://github.com/yourusername/promptly.git
cd promptly
