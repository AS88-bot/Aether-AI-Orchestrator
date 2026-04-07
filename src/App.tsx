import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  StickyNote, 
  CheckCircle2, 
  Circle, 
  Send, 
  Bot, 
  User, 
  Trash2,
  LayoutDashboard,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Task, CalendarEvent, Note, Message } from '@/src/types.ts';
import { cn } from '@/src/lib/utils.ts';
import { createOrchestratorTools, getGeminiResponse } from '@/src/services/geminiService.ts';
import { createTask, getTasks } from '@/src/services/firebaseService.ts';
import { auth } from '@/src/firebase.ts';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';
import { format } from 'date-fns';
import { Content, Part } from '@google/genai';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GEMINI_API_KEY: string;
    }
  }
}

interface ChatViewProps {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  sendMessage: (e?: React.FormEvent) => Promise<void> | void;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatView: React.FC<ChatViewProps> = ({ 
  messages, 
  input, 
  setInput, 
  sendMessage, 
  isTyping, 
  messagesEndRef 
}) => {
  return (
    <motion.div 
      key="chat"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 md:p-8"
    >
      <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Welcome to Aether</h2>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                Your intelligent life orchestrator. Try saying "Schedule a meeting tomorrow at 5pm" or "Add a task to buy groceries".
              </p>
            </div>
          </div>
        )}
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-4 max-w-[85%]",
              m.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              m.role === 'user' ? "bg-indigo-600" : "bg-white/10"
            )}>
              {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "px-4 py-3 rounded-2xl text-sm leading-relaxed",
              m.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-[#1a1a1a] border border-white/5 text-gray-200 rounded-tl-none"
            )}>
              {m.content}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div className="bg-[#1a1a1a] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="mt-6 relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Aether to organize your life..."
          className="w-full bg-[#1a1a1a] border border-white/10 rounded-2xl px-6 py-4 pr-14 focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-gray-600"
        />
        <button 
          type="submit"
          disabled={!input.trim() || isTyping}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
};

interface DashboardViewProps {
  tasks: Task[];
  events: CalendarEvent[];
  notes: Note[];
  toggleTask: (id: string) => Promise<void> | void;
  deleteItem: (itemType: 'task' | 'event' | 'note', id: string) => Promise<void> | void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  tasks, 
  events, 
  notes, 
  toggleTask, 
  deleteItem 
}) => {
  return (
    <motion.div 
      key="dashboard"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tasks Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-lg">Tasks</h3>
            </div>
            <span className="text-xs font-medium bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full">
              {tasks.filter(t => !t.completed).length} Pending
            </span>
          </div>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No tasks yet</p>
            ) : (
              tasks.map(task => (
                <motion.div 
                  layout
                  key={task.id}
                  className="group bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl flex items-start gap-3 hover:border-white/10 transition-all"
                >
                  <button onClick={() => toggleTask(task.id)} className="mt-0.5">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", task.completed ? "text-gray-500 line-through" : "text-gray-200")}>
                      {task.title}
                    </p>
                    {task.deadline && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500 uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        {task.deadline}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => deleteItem('task', task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* Events Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-lg">Schedule</h3>
            </div>
          </div>
          <div className="space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No events scheduled</p>
            ) : (
              events.map(event => (
                <div key={event.id} className="group bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gray-200">{event.title}</p>
                    <button 
                      onClick={() => deleteItem('event', event.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-500/5 w-fit px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" />
                    {event.datetime}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Notes Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-lg">Notes</h3>
            </div>
          </div>
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No notes saved</p>
            ) : (
              notes.map(note => (
                <div key={note.id} className="group bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">{note.content}</p>
                    <button 
                      onClick={() => deleteItem('note', note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all shrink-0 ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600 uppercase tracking-tighter">
                    {format(note.createdAt, 'MMM d, yyyy')}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('aether_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('aether_events');
    return saved ? JSON.parse(saved) : [];
  });
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('aether_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'dashboard'>('chat');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('aether_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('aether_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('aether_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!user) {
      setTasks([]);
      setEvents([]);
      setNotes([]);
      return;
    }

    const fetchInitialData = async () => {
      try {
        const tasksData = await getTasks();
        if (tasksData.length > 0) setTasks(tasksData as Task[]);
        
        const [eventsData, notesData] = await Promise.all([
          fetch("/api/get-events").then(res => res.json()),
          fetch("/api/get-notes").then(res => res.json()),
        ]);
        if (eventsData.length > 0) setEvents(eventsData);
        if (notesData.length > 0) setNotes(notesData);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    fetchInitialData();
  }, [isAuthReady, user]);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.code === 'auth/unauthorized-domain') {
        setLoginError('unauthorized-domain');
      } else {
        setLoginError(error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const executeTool = async (name: string, args: any) => {
    if (!user) {
      return "Error: You must be logged in to perform this action. Please click the 'Login with Google' button in the sidebar.";
    }
    console.log("Tool called:", name, args);
    const headers = { 'Content-Type': 'application/json' };
    switch (name) {
      case "create_task":
        const taskRes = await createTask(args);
        setTasks(prev => [taskRes.task, ...prev]);
        return taskRes.status;

      case "get_tasks":
        const tasksData = await getTasks();
        setTasks(tasksData as Task[]);
        return JSON.stringify(tasksData);

      case "schedule_event":
        const eventRes = await fetch("/api/schedule-event", {
          method: "POST",
          headers,
          body: JSON.stringify(args)
        }).then(res => res.json());
        setEvents(prev => [eventRes.event, ...prev]);
        return eventRes.result;

      case "get_events":
        const eventsData = await fetch("/api/get-events").then(res => res.json());
        setEvents(eventsData);
        return JSON.stringify(eventsData);

      case "save_note":
        const noteRes = await fetch("/api/save-note", {
          method: "POST",
          headers,
          body: JSON.stringify(args)
        }).then(res => res.json());
        setNotes(prev => [noteRes.note, ...prev]);
        return noteRes.result;

      case "get_notes":
        const notesData = await fetch("/api/get-notes").then(res => res.json());
        setNotes(notesData);
        return JSON.stringify(notesData);

      default:
        throw new Error("Unknown tool");
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY || '';
      const tools = createOrchestratorTools();
      
      const history: Content[] = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
      history.push({ role: 'user', parts: [{ text: input }] });

      let result = await getGeminiResponse(apiKey, history, tools);
      let functionCalls = result.functionCalls;
      
      // Handle potential multiple tool calls
      while (functionCalls && functionCalls.length > 0) {
        const toolResults: Part[] = [];
        for (const call of functionCalls) {
          const toolResult = await executeTool(call.name, call.args);
          toolResults.push({
            functionResponse: {
              name: call.name,
              response: { result: toolResult },
            },
          });
        }

        // Add model's call and tool response to history
        const modelContent = result.candidates?.[0]?.content;
        if (modelContent) {
          history.push({
            role: 'model',
            parts: modelContent.parts as Part[],
          });
          history.push({
            role: 'user',
            parts: toolResults,
          });

          result = await getGeminiResponse(apiKey, history, tools);
          functionCalls = result.functionCalls;
        } else {
          break;
        }
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.text || "I've processed your request.",
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newCompleted = !task.completed;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
    
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompleted })
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const deleteItem = async (itemType: 'task' | 'event' | 'note', id: string) => {
    if (itemType === 'task') setTasks(prev => prev.filter(t => t.id !== id));
    if (itemType === 'event') setEvents(prev => prev.filter(e => e.id !== id));
    if (itemType === 'note') setNotes(prev => prev.filter(n => n.id !== id));

    try {
      const endpoint = itemType === 'task' 
        ? `/api/tasks/${id}` 
        : itemType === 'event' 
          ? `/api/events/${id}` 
          : `/api/notes/${id}`;
          
      await fetch(endpoint, { method: "DELETE" });
    } catch (error) {
      console.error(`Failed to delete ${itemType}:`, error);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-20 md:w-64 bg-[#111111] border-r border-white/5 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden md:block">Aether</h1>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('chat')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === 'chat' ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="font-medium hidden md:block">Orchestrator</span>
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                activeTab === 'dashboard' ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium hidden md:block">Dashboard</span>
            </button>
          </nav>

          <div className="mt-8 pt-8 border-t border-white/5">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-4">
                  {user.photoURL && (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                  )}
                  <div className="hidden md:block overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                >
                  <Clock className="w-5 h-5" />
                  <span className="font-medium hidden md:block">Logout</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/20"
              >
                <User className="w-5 h-5" />
                <span className="font-medium hidden md:block">Login with Google</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-white/5 hidden md:block">
          <div className="bg-indigo-900/20 rounded-2xl p-4 border border-indigo-500/20">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">All agents online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        <AnimatePresence mode="wait">
      {activeTab === 'chat' ? (
        <ChatView 
          messages={messages}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isTyping={isTyping}
          messagesEndRef={messagesEndRef}
        />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {!user && (
            <div className="p-8 bg-indigo-600/10 border-b border-indigo-500/20 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Authentication Required</h3>
                    <p className="text-sm text-gray-400">Please log in to sync your data with the cloud.</p>
                  </div>
                </div>
                <button 
                  onClick={handleLogin}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  Login with Google
                </button>
              </div>

              {loginError === 'unauthorized-domain' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <Trash2 className="w-5 h-5" />
                    <h4 className="font-bold">Unauthorized Domain Error</h4>
                  </div>
                  <p className="text-sm text-gray-300">
                    Firebase is blocking this login because the current domain is not authorized. Please follow these steps to fix it:
                  </p>
                  <ol className="text-sm text-gray-400 list-decimal list-inside space-y-2 ml-2">
                    <li>Go to the <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">Firebase Console</a></li>
                    <li>Select project: <code className="bg-white/5 px-1.5 py-0.5 rounded text-gray-200">aether-ai-178b1</code></li>
                    <li>Go to <span className="font-semibold text-gray-200">Authentication &gt; Settings &gt; Authorized domains</span></li>
                    <li>Add these two domains:</li>
                  </ol>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between group">
                      <code className="text-xs text-gray-400 truncate">ais-dev-jntq2kkmxhpbb4sjpxi2cq-406331881361.asia-east1.run.app</code>
                      <button 
                        onClick={() => navigator.clipboard.writeText('ais-dev-jntq2kkmxhpbb4sjpxi2cq-406331881361.asia-east1.run.app')}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 ml-2"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between group">
                      <code className="text-xs text-gray-400 truncate">ais-dev-jntq2kkmxhpbb4sjpxi2cq-406331881361.asia-east1.run.app</code>
                      <button 
                        onClick={() => navigator.clipboard.writeText('ais-pre-jntq2kkmxhpbb4sjpxi2cq-406331881361.asia-east1.run.app')}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 ml-2"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic mt-4">
                    After adding these, refresh this page and try logging in again.
                  </p>
                </div>
              )}
            </div>
          )}
          <DashboardView 
            tasks={tasks}
            events={events}
            notes={notes}
            toggleTask={toggleTask}
            deleteItem={deleteItem}
          />
        </div>
      )}
        </AnimatePresence>
      </main>

      {/* Right Panel - Contextual Info (Desktop only) */}
      <aside className="hidden xl:flex w-80 bg-[#111111] border-l border-white/5 flex-col p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">Quick Stats</h2>
        
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Productivity</span>
              <span className="text-xs font-bold text-green-400">+12%</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                className="h-full bg-indigo-500"
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-3 uppercase tracking-wider">65% of weekly goals met</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Upcoming Today</h3>
            {events.length > 0 ? (
              events.slice(0, 3).map(e => (
                <div key={e.id} className="flex items-center gap-3 group cursor-pointer">
                  <div className="w-1 h-8 bg-indigo-500/50 rounded-full group-hover:bg-indigo-500 transition-colors" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">{e.title}</p>
                    <p className="text-xs text-gray-500">{e.datetime}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600 italic">Clear schedule for today</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
