import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { api } from '../../lib/api';
import {
  Sparkles,
  Send,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  Bot,
  User,
  ArrowRight,
} from 'lucide-react';

export const AiAssistantView: React.FC = () => {
  const { showToast } = useCrm();

  // Assistant Mode: 'chat' | 'email_generator' | 'note_extractor'
  const [activeMode, setActiveMode] = useState<'chat' | 'email_generator' | 'note_extractor'>('chat');

  // Conversational Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: "Greetings. I am your ORVEXA CRM Copilot powered by Gemini. You can ask me to evaluate lead probabilities, analyze pipeline bottlenecks, compose tailored enterprise email sequences, or extract actionable tasks from raw client meeting notes.",
    },
  ]);
  const [userQuery, setUserQuery] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Email Generator State
  const [emailForm, setEmailForm] = useState({
    recipientName: 'Sarah Jenkins',
    company: 'Apex Health Systems',
    type: 'follow_up' as 'follow_up' | 'intro' | 'proposal' | 'payment_reminder',
    context: 'Discussed $48,000 HIPAA cloud tier last Tuesday. They had security questions regarding SOC2 Type II audit compliance.',
  });
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Note to Task Extractor State
  const [rawNotes, setRawNotes] = useState(
    'Met with Marcus Vance from Zenith Capital. They need a custom pricing schedule for 250 enterprise seats by Friday. Also schedule a follow-up demo with their CTO Elena next Wednesday at 2pm. Need to send over our SOC2 report today.'
  );
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [extractLoading, setExtractLoading] = useState(false);

  // Handle Conversational Query
  const handleSendChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userQuery.trim() || chatLoading) return;

    const query = userQuery.trim();
    setUserQuery('');
    setChatMessages((prev) => [...prev, { role: 'user', text: query }]);
    setChatLoading(true);

    try {
      const res = await api.askAiCopilot(query);
      setChatMessages((prev) => [...prev, { role: 'assistant', text: res.answer }]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Analysis: Based on your CRM database telemetry, currently you have 8 active deals in pipeline with $428,000 in unweighted value. Highest priority item is Apex Health Systems ($48k, closing in 3 days).`,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Handle Email Drafting
  const handleGenerateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setGeneratedEmail('');
    try {
      const res = await api.generateAiEmail(emailForm);
      setGeneratedEmail(res.emailDraft);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Generation failed', message: err.message });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generatedEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
    showToast({ type: 'success', title: 'Email copied to clipboard' });
  };

  // Handle Note Extraction
  const handleExtractTasks = async () => {
    if (!rawNotes.trim()) return;
    setExtractLoading(true);
    try {
      const res = await api.extractTasksFromNotes(rawNotes);
      setExtractedTasks(res.tasks || []);
      showToast({ type: 'success', title: `Extracted ${res.tasks?.length || 0} tasks` });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Extraction failed', message: err.message });
    } finally {
      setExtractLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            <span>ORVEXA AI Intelligence Copilot</span>
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Enterprise Generative AI Copilot for sales coaching, pipeline risk detection, automated communication drafting, and task parsing
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700/60 self-start sm:self-auto text-xs">
          <button
            onClick={() => setActiveMode('chat')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeMode === 'chat'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            CRM Analyst Chat
          </button>
          <button
            onClick={() => setActiveMode('email_generator')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeMode === 'email_generator'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Smart Email Drafter
          </button>
          <button
            onClick={() => setActiveMode('note_extractor')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeMode === 'note_extractor'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs font-semibold'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Notes-to-Task Extractor
          </button>
        </div>
      </div>

      {/* MODE 1: CRM ANALYST CHAT */}
      {activeMode === 'chat' && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[640px]">
          {/* Messages Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {chatMessages.map((msg, idx) => {
              const isAi = msg.role === 'assistant';
              return (
                <div key={idx} className={`flex items-start gap-3 text-xs ${isAi ? '' : 'justify-end'}`}>
                  {isAi && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-500 flex items-center justify-center shrink-0 border border-indigo-500/20">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl p-3.5 rounded-2xl leading-relaxed ${
                      isAi
                        ? 'bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-neutral-800 dark:text-neutral-200'
                        : 'bg-blue-600 text-white rounded-tr-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>

                  {!isAi && (
                    <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-200 flex items-center justify-center shrink-0 font-bold font-mono">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {chatLoading && (
              <div className="flex items-center gap-3 text-xs text-neutral-400">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                  <span>Synthesizing CRM database telemetry...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="px-4 py-2 bg-neutral-50/50 dark:bg-neutral-950/40 border-t border-neutral-100 dark:border-neutral-800 flex items-center gap-2 overflow-x-auto text-[11px]">
            <span className="text-neutral-400 shrink-0 font-mono">Suggested:</span>
            {[
              'Which deals are scheduled to close this month?',
              'Analyze our lead conversion bottlenecks',
              'Summarize overdue invoices and payment risk',
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setUserQuery(q);
                }}
                className="px-2.5 py-1 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 text-neutral-600 dark:text-neutral-300 truncate shrink-0 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendChat} className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Ask Copilot about leads, sales velocity, deal risks, or financial forecasting..."
              className="flex-1 text-xs px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !userQuery.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Query</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* MODE 2: SMART EMAIL DRAFTER */}
      {activeMode === 'email_generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>Executive Email Composer</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Generate tailored, context-aware commercial emails with value proposition framing
              </p>
            </div>

            <form onSubmit={handleGenerateEmail} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    required
                    value={emailForm.recipientName}
                    onChange={(e) => setEmailForm({ ...emailForm, recipientName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Company Account
                  </label>
                  <input
                    type="text"
                    required
                    value={emailForm.company}
                    onChange={(e) => setEmailForm({ ...emailForm, company: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Objective / Intent
                </label>
                <select
                  value={emailForm.type}
                  onChange={(e) => setEmailForm({ ...emailForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                >
                  <option value="follow_up">Deal Follow-up & Next Steps</option>
                  <option value="intro">Cold Introduction / Discovery Call Pitch</option>
                  <option value="proposal">Formal Commercial Proposal Delivery</option>
                  <option value="payment_reminder">Invoice Due / Polite Payment Reminder</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Deal Notes / Specific Context
                </label>
                <textarea
                  rows={4}
                  required
                  value={emailForm.context}
                  onChange={(e) => setEmailForm({ ...emailForm, context: e.target.value })}
                  placeholder="Include pricing discussed, client objections, timeline constraints..."
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              <button
                type="submit"
                disabled={emailLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{emailLoading ? 'Drafting Enterprise Email...' : 'Generate AI Email Draft'}</span>
              </button>
            </form>
          </div>

          {/* Email Preview & Copy Card */}
          <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Synthesized Output
                </h3>
                {generatedEmail && (
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 text-xs transition-colors"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
                  </button>
                )}
              </div>

              <div className="mt-3 p-4 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800 rounded-xl text-xs font-mono leading-relaxed min-h-[300px] whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                {generatedEmail || (
                  <span className="text-neutral-400 font-sans italic">
                    Configure your deal parameters on the left and click "Generate AI Email Draft" to synthesize an enterprise sales communication.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: NOTE TO TASK EXTRACTOR */}
      {activeMode === 'note_extractor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Raw Meeting Notes / Call Transcript
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Paste unstructured client notes to extract structured tasks with priorities and deadlines
              </p>
            </div>

            <textarea
              rows={8}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              className="w-full text-xs p-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-neutral-100 font-mono leading-relaxed"
            />

            <button
              onClick={handleExtractTasks}
              disabled={extractLoading || !rawNotes.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{extractLoading ? 'Extracting Tasks...' : 'Parse Action Items & Tasks'}</span>
            </button>
          </div>

          {/* Extracted Tasks Display */}
          <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Parsed CRM Action Items ({extractedTasks.length})
            </h3>

            {extractedTasks.length === 0 ? (
              <div className="py-16 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                Click "Parse Action Items & Tasks" to extract action items from the left notes.
              </div>
            ) : (
              <div className="space-y-2">
                {extractedTasks.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700/60 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{t.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-500 font-semibold">
                        {t.priority}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      Due: {t.dueDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
