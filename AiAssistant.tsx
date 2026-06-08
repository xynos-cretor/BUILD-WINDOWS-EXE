import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ArrowRight, 
  History, 
  Loader2, 
  TrendingUp, 
  PackageCheck, 
  UsersRound, 
  Calculator 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { erpApi } from '../lib/erpApi';

interface AiAssistantProps {
  company: any;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

export default function AiAssistant({ company }: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'default',
      sender: 'ai',
      text: `Hello! I am your **DAMSON AI Business Assistant**. I have fully scanned today's ERP database snapshots including Products status, Resort Rooms availability, Camera Repairs queue, Customers due balances, and Purchases. \n\nHow can I help you analyze your business logs today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const presetQueries = [
    { text: "Which products give highest profit?", icon: TrendingUp },
    { text: "Show low stock products.", icon: PackageCheck },
    { text: "Who are top customers?", icon: UsersRound },
    { text: "Generate monthly sales summary.", icon: Calculator },
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim() || loading) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      text: msgText
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await erpApi.askAI(company.id, msgText);
      const aiMsg: Message = {
        id: Date.now().toString() + '-ai',
        sender: 'ai',
        text: response.reply || "I didn't receive a valid assessment back. Please check if the GEMINI_API_KEY environment variable is configured in your Settings panel."
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: Date.now().toString() + '-err',
        sender: 'ai',
        text: `Unable to synthesize reply: ${err?.message || 'GEMINI_API_KEY could be missing or inactive.'}`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col gap-4">
      {/* Title block */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
            <Sparkles className="text-emerald-600 font-bold animate-pulse" /> DAMSON AI Executive Assistant
          </h2>
          <p className="text-xs text-zinc-500">
            Real-time business audit intelligence. Ask questions about highest profits, low-stock reports, guests stay ledger, or camera repair logs.
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
        {/* Chat window */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex items-start gap-3.5 max-w-4xl ${m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Icon */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                m.sender === 'user' 
                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                  : 'bg-white border-zinc-200 text-emerald-600'
              }`}>
                {m.sender === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>

              {/* Message Bubble */}
              <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                m.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-tr-none'
                  : 'bg-white text-zinc-800 rounded-tl-none border border-zinc-150'
              }`}>
                <div className="markdown-body prose-sm max-w-none text-xs">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3.5 mr-auto">
              <div className="w-8 h-8 rounded-xl bg-white border border-zinc-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={15} />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-white text-zinc-500 border border-zinc-150 flex items-center gap-2 text-xs shadow-sm">
                <Loader2 size={14} className="animate-spin text-emerald-600" /> Damson AI is scanning database snapshots...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Preset Query Click Area */}
        <div className="p-4 bg-white border-t border-zinc-150">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2.5">Instant Dynamic Quick Inquiries</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {presetQueries.map((q) => (
              <button
                key={q.text}
                onClick={() => handleSendMessage(q.text)}
                disabled={loading}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left text-[11px] font-medium text-zinc-600 hover:text-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
              >
                <q.icon size={14} className="text-emerald-600 shrink-0" />
                <span className="truncate">{q.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-zinc-200 bg-slate-50">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }} 
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask anything about reports, camera service queues, guests checkouts or custom ledger insights..."
              className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-zinc-100 placeholder-zinc-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 transition disabled:opacity-50 disabled:hover:bg-emerald-600 flex items-center justify-center"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
