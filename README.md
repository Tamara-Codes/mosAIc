# 🍽️ mosAIc

A modern restaurant menu management system with AI-powered multilingual translations.

## ✨ Features

- **Smart Menu Management** - Create, edit, and organize menu items with categories
- **Drag & Drop Reordering** - Easily rearrange categories
- **AI Translations** - Automatic menu translations powered by OpenAI GPT-4o-mini
- **10 Languages** - Croatian, English, German, Italian, French, Spanish, Slovenian, Czech, Polish, Hungarian
- **QR Code Generation** - Let customers scan and view your menu on their phones
- **Allergen Tracking** - Track dietary restrictions and allergen information
- **Beautiful UI** - Modern, responsive interface built with React and shadcn/ui

## 🚀 Quick Start

### Backend
```bash
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment
Create a `.env` file:
```env
OPENAI_API_KEY=your_api_key_here
ADMIN_PASSWORD=your_admin_password
```

## 🛠️ Tech Stack

- **Backend:** FastAPI, SQLAlchemy, Python
- **Frontend:** React, TypeScript, Vite, shadcn/ui, TailwindCSS
- **AI:** OpenAI GPT-4o-mini
- **Database:** SQLite

## 📱 Access

- **Admin Dashboard:** http://localhost:8000 (login required)
- **Customer Menu:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs



