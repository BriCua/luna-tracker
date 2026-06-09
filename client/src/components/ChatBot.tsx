import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { MessageCircle, X, Send, Loader2, Sparkles, User, Heart } from 'lucide-react'
import { useCycleStore } from '../store/cycleStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const phase = useCycleStore((state) => state.phase)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const { data } = await axios.post('/api/chat', {
        messages: [...messages, userMessage]
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (error) {
      console.error('Chat failed:', error)
      setMessages((prev) => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
      >
        <MessageCircle className="w-6 h-6" />
        {messages.length === 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-accent"></span>
          </span>
        )}
      </button>

      {/* Chat Drawer */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] shadow-2xl h-[85vh] transition-transform duration-500 transform ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-on-surface/5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-xl">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface leading-tight">Luna Guide</h3>
                <p className="text-xs text-on-surface/40">AI-powered empathy & support</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-on-surface/40" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 h-[calc(85vh-160px)]">
            {messages.length === 0 && (
              <div className="text-center py-12 px-6">
                <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-primary/40" />
                </div>
                <h4 className="font-bold text-on-surface mb-2">How can I help you support her?</h4>
                <p className="text-sm text-on-surface/50 leading-relaxed">
                  Ask me for advice on what to cook, how to talk about sensitive topics, or just general tips for the {phase?.name} phase.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none soft-shadow'
                      : 'bg-slate-100 text-on-surface rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1 opacity-60">
                    {msg.role === 'user' ? (
                      <>
                        <span className="text-[10px] font-bold uppercase">You</span>
                        <User className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase">Luna Guide</span>
                      </>
                    )}
                  </div>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs font-medium text-on-surface/40 italic">Luna is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-on-surface/5"
          >
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Luna something..."
                className="w-full p-4 pr-14 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 top-2 bottom-2 w-10 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
