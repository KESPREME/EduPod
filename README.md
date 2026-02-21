# 🎧 EduPod

> **Transform PDFs into immersive audio learning experiences and interactive study materials using AI.**

EduPod is a full-stack educational platform designed to make learning engaging and accessible. By uploading academic materials (like PDFs), users can generate high-quality audio podcasts, dynamic quizzes, flashcards, and comprehensive study notes. To top it off, EduPod features a unique **3D Classroom** environment bringing the AI tutor to life, all wrapped in a sleek, **Neo-Brutalist** user interface.

## ✨ Key Features

- **📄 Document to Podcast Pipeline:** Upload any PDF and watch it transform into a structured, engaging audio lesson using advanced LLMs (via OpenRouter) and highly realistic Text-to-Speech engines (Azure Neural TTS / Edge TTS).
- **🧠 Interactive Study Tools:** Automatically generates custom Quizzes, printable Study Notes, and Flashcards based on the uploaded material to test retention.
- **🏫 3D Classroom Experience:** A `@react-three/fiber` powered immersive mode where users can watch an animated avatar deliver the lesson inside a virtual classroom environment.
- **🎨 Neo-Brutalist Design System:** A stunning visual identity featuring dynamic, deterministic SVG lesson thumbnails, stark contrasts, micro-animations with `framer-motion`, and a custom toast notification system.
- **🔔 Notifications & Digests:** Integrated Web Push Notifications to alert users when their background lesson generation completes, alongside an Email Digest preference system.

---

## 💻 Tech Stack

### Frontend
- **Framework:** [Next.js](https://nextjs.org/) (React 19)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **3D Graphics:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) & Drei
- **Icons:** [Lucide React](https://lucide.dev/)
- **State/Auth:** [Supabase JS](https://supabase.com/)

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **AI / LLM:** OpenAI SDK (configured for OpenRouter API)
- **Text-to-Speech:** Azure Cognitive Services Speech & `edge-tts` (fallback)
- **Document Processing:** `pypdf`
- **Audio Processing:** `pydub`
- **Database Connection:** Supabase Python Client

---

## 🚀 Getting Started

EduPod consists of a separated Next.js frontend and a FastAPI backend. For detailed deployment and local environment setup, please refer to our comprehensive **[Deployment Guide](DEPLOY.md)**.

### Quick Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/KESPREME/EduPod.git
   cd EduPod
   ```

2. **Start the Backend:**
   ```bash
   cd backend
   python -m venv venv
   # Activate venv (e.g. `venv\Scripts\activate` on Windows)
   pip install -r requirements.txt
   
   # Setup your environment variables (.env)
   # OPENROUTER_API_KEY=your_key
   
   python main.py
   ```

3. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   
   # Make sure .env.local points NEXT_PUBLIC_API_URL to http://localhost:8005
   
   npm run dev
   ```

4. **Visit:** `http://localhost:3000`

---

## 📂 Project Structure

```text
EduPod/
├── backend/                # FastAPI Application
│   ├── main.py             # Server entry point & API routes
│   ├── processor.py        # LLM pipeline for Quiz/Notes/Transcript generation
│   ├── synth.py            # TTS Audio synthesis logic
│   ├── requirements.txt    # Python dependencies
│   └── ...
├── frontend/               # Next.js Application
│   ├── src/app/            # App Router pages (Dashboard, Library, Create, etc.)
│   ├── src/components/     # Reusable UI components (LessonThumbnail, ClassroomScene, etc.)
│   ├── src/context/        # Global state (ToastContext, SettingsContext)
│   ├── package.json        # Node dependencies
│   └── ...
└── DEPLOY.md               # Detailed deployment instructions
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/KESPREME/EduPod/issues) if you want to contribute.

## 📝 License

This project is open-source and available under the MIT License.
