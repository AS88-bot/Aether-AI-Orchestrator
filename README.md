# Aether - Intelligent Life Orchestrator

Aether is not just a productivity tool; it is a sophisticated, AI-first life management ecosystem designed to bridge the gap between human intent and digital organization. By leveraging state-of-the-art Large Language Models, Aether transforms the way you interact with your daily responsibilities, turning complex planning into simple, natural conversations.

## The Vision

In an age of information overload, Aether acts as a cognitive filter and personal assistant. The goal is to reduce the "mental load" of managing a modern life. Instead of navigating through complex menus, setting manual reminders, and context-switching between different apps, Aether provides a single, intelligent interface that understands *what* you need to do and *how* you want to do it.

## How it Works

Aether utilizes the **Gemini API** to parse natural language inputs. When you speak or type to the Orchestrator, it doesn't just store text; it identifies entities, dates, and actions. 

- **Intent Recognition**: Aether understands the difference between a fleeting thought ("I should read more"), a concrete task ("Buy milk today"), and a scheduled event ("Meeting with Sarah at 3 PM Friday").
- **Contextual Awareness**: The system maintains a history of your interactions, allowing for follow-up requests and a more personalized experience over time.
- **Seamless Integration**: Your conversations directly drive the state of your dashboard, creating a tight loop between planning and visualization.

## Key Features

### 🧠 The AI Orchestrator
The heart of Aether. A conversational partner that handles the heavy lifting of organization.
- **Natural Language Task Entry**: "Remind me to call the dentist next Tuesday morning."
- **Smart Scheduling**: "Schedule a gym session for 6 AM every weekday."
- **Note Taking**: "Save a note that the Wi-Fi password is 'Aether2024'."

### 📊 Unified Life Dashboard
A high-fidelity interface that provides a bird's-eye view of your digital life.
- **Dynamic Task Lists**: Categorized and sorted by urgency and creation date.
- **Integrated Calendar**: A visual timeline of your commitments.
- **Quick Notes**: A digital scratchpad for your ideas and important information.

### ⚡ Real-time Synchronization
Built on **Firebase Firestore**, Aether ensures that your data is always up-to-date. Whether you're on your desktop or mobile, your orchestrator is always in sync.

### 🔒 Privacy & Security
Your life is personal. Aether uses **Firebase Authentication** with Google Sign-In to ensure that only you have access to your data. Security rules are strictly enforced at the database level to protect your information.

### 🎨 Premium Design Language
Aether features a "Dark Mode" first, glassmorphism-inspired UI. Built with **React**, **Tailwind CSS**, and **Framer Motion**, the interface is designed to be as calming as it is functional.

## Philosophy: The "Aether" State

The name "Aether" refers to the fifth element—the material that fills the region of the universe above the terrestrial sphere. In our context, Aether represents the invisible, intelligent layer that sits above your raw data, organizing it into meaningful patterns. 

We believe that technology should be **invisible but omnipresent**. You shouldn't have to "learn" how to use Aether; it should learn how to help you. By removing the friction of traditional UI (buttons, forms, complex navigation) and replacing it with dialogue, we allow you to stay in your "flow state" longer.

## User Experience: Designed for Focus

Every interaction in Aether is designed to minimize distraction:
- **Minimalist Aesthetic**: We use a deep charcoal and indigo palette to reduce eye strain and create a focused environment.
- **Micro-interactions**: Subtle animations provide feedback without being intrusive, making the digital experience feel tactile and responsive.
- **Voice-Ready Structure**: While currently text-based, the underlying architecture is designed to support voice-to-text orchestration, paving the way for a truly hands-free life management experience.

## Getting Started

### Prerequisites

- Node.js and npm installed.
- A Firebase project set up at [Firebase Console](https://console.firebase.google.com/).

### Setup Instructions

1. **Firebase Configuration**:
   Update `src/firebase.ts` with your project's configuration object.

2. **Authentication Setup**:
   - Enable **Google Auth** in the Firebase Console under `Authentication > Sign-in method`.
   - Add your application's domain to the **Authorized domains** list in Firebase Authentication settings.

3. **Firestore Rules**:
   Deploy the security rules provided in `firestore.rules` to your Firebase project to ensure data integrity and security.

4. **Environment Variables**:
   Ensure your `GEMINI_API_KEY` is set in your environment to enable the AI Orchestrator features.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Firebase (Auth & Firestore)
- **AI**: Google Gemini API

---

**Author**: Aisha Sultana
