'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Send,
  Loader2,
  User,
  Bot,
  Copy,
  Check,
  Lightbulb,
  TrendingUp,
  Mail,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { makeRequest } from '@/lib/api-service'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Suggestion {
  icon: React.ReactNode
  label: string
  prompt: string
}

const SUGGESTIONS: Suggestion[] = [
  {
    icon: <TrendingUp className="h-4 w-4" />,
    label: 'Analyze sales performance',
    prompt: 'Analyze our sales performance this quarter and suggest improvements',
  },
  {
    icon: <Mail className="h-4 w-4" />,
    label: 'Draft follow-up email',
    prompt: 'Help me draft a follow-up email for a lead who showed interest but hasn\'t responded',
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    label: 'Lead prioritization tips',
    prompt: 'What criteria should I use to prioritize my leads?',
  },
  {
    icon: <FileText className="h-4 w-4" />,
    label: 'Create proposal outline',
    prompt: 'Help me create an outline for a sales proposal',
  },
]

export function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI sales assistant. How can I help you today? I can help you with lead analysis, email drafting, sales strategies, and more.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Call your AI endpoint
      const response = await makeRequest<{ reply: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: content,
          context: messages.slice(-10).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      // Fallback response if API fails
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment or contact support if the issue persists.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, fallbackMessage])
      console.error('AI chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestion = (suggestion: Suggestion) => {
    sendMessage(suggestion.prompt)
  }

  const copyToClipboard = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Sales Assistant
          </SheetTitle>
          <SheetDescription>
            Get help with leads, deals, emails, and sales strategies
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  {message.role === 'assistant' ? (
                    <>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  ) : (
                    <>
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>
                <div
                  className={`group relative max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.role === 'assistant' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-10 top-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(message.id, message.content)}
                    >
                      {copiedId === message.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="p-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">Suggestions</p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-2 px-3"
                  onClick={() => handleSuggestion(suggestion)}
                >
                  {suggestion.icon}
                  <span className="ml-2 text-xs truncate">{suggestion.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// Smaller inline AI suggestion component
interface AIInsightProps {
  type: 'lead' | 'deal' | 'task'
  data: any
}

export function AIInsight({ type, data }: AIInsightProps) {
  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchInsight = async () => {
    setLoading(true)
    try {
      const response = await makeRequest<{ insight: string }>('/ai/insight', {
        method: 'POST',
        body: JSON.stringify({ type, data }),
      })
      setInsight(response.insight)
    } catch (error) {
      console.error('Failed to fetch AI insight:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (insight) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <Badge variant="outline" className="mb-1 text-xs">
                AI Insight
              </Badge>
              <p className="text-sm">{insight}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={fetchInsight}
      className="text-muted-foreground"
    >
      <Sparkles className="h-4 w-4 mr-2" />
      Get AI Insight
    </Button>
  )
}
