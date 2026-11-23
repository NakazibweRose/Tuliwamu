
import { useState } from "react";
import axios from "axios";
import {
  Bot,
  Send,
  User,
  BookOpen,
  ShieldCheck,
  Scale,
  FileText,
  Sparkles,
  LoaderCircle,
  AlertCircle,
} from "lucide-react";

const AI_API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

const suggestedQuestions = [
  "What are the responsibilities of a Probation and Social Welfare Officer?",
  "What should happen when a child reports abuse?",
  "What protections are available for a child in conflict with the law?",
  "Which institutions are involved in child protection in Uganda?",
];

function Assistant() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (text = question) => {
    const trimmedQuestion = text.trim();

    if (!trimmedQuestion || loading) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: trimmedQuestion,
    };

    setMessages((previous) => [...previous, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${AI_API_URL}/api/legal-assistant/ask`,
        {
          question: trimmedQuestion,
          top_k: 5,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 120000,
        }
      );

      const result = response.data;

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            result.answer ||
            "The assistant returned no answer.",
          sources: result.sources || [],
          warnings: result.warnings || [],
          status: result.status || "success",
        },
      ]);
    } catch (error) {
      console.error("AI Legal Assistant error:", error);

     const errorMessage =
  error.response?.data?.detail ||
  error.message ||
  "Unknown AI connection error.";
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: errorMessage,
          sources: [],
          warnings: [],
          status: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-[#19324D]">
          AI Legal Assistant
        </h1>
        <p className="text-slate-500 mt-1">
          Access child protection and juvenile justice information in Uganda.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex gap-4 items-start">
        <div className="bg-teal-50 text-[#367C78] p-3 rounded-lg">
          <ShieldCheck size={24} />
        </div>

        <div>
          <h2 className="font-semibold text-[#19324D]">
            Professional legal information support
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            This assistant helps authorised officers locate relevant
            legal and procedural information. It does not replace
            legal professionals or make decisions about individual cases.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl min-h-[550px] flex flex-col">
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <div className="bg-[#19324D] text-white p-2 rounded-lg">
            <Scale size={22} />
          </div>

          <div>
            <h2 className="font-semibold text-[#19324D]">
              Tuliwamu Legal Knowledge Assistant
            </h2>
            <p className="text-xs text-slate-500">
              Ugandan child protection and juvenile justice resources
            </p>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-6">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center pt-8">
              <div className="bg-teal-50 text-[#367C78] w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot size={30} />
              </div>

              <h3 className="text-xl font-semibold text-[#19324D]">
                How can I help you today?
              </h3>

              <p className="text-sm text-slate-500 mt-2 mb-8">
                Ask a question about child protection, juvenile justice,
                legal procedures or institutional responsibilities.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {suggestedQuestions.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleSend(item)}
                    disabled={loading}
                    className="border border-slate-200 rounded-lg p-4 text-sm text-slate-600 hover:border-[#367C78] hover:bg-teal-50 transition-colors disabled:opacity-50"
                  >
                    <Sparkles
                      size={17}
                      className="text-[#367C78] mb-2"
                    />
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="bg-[#19324D] text-white p-2 rounded-lg h-fit">
                    <Bot size={18} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-4 ${
                    message.role === "user"
                      ? "bg-[#19324D] text-white"
                      : "bg-slate-50 border border-slate-200 text-slate-700"
                  }`}
                >
                  {message.role === "user" ? (
                    <div className="flex items-center gap-2 mb-2 text-xs text-slate-300">
                      <User size={14} />
                      You
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#367C78]">
                      <Bot size={15} />
                      Tuliwamu Assistant
                    </div>
                  )}

                  <p className="text-sm leading-6 whitespace-pre-wrap">
                    {message.text}
                  </p>

                  {message.status === "no_evidence" && (
                    <p className="mt-3 text-xs text-amber-700">
                      No sufficient supporting passages were found
                      in the available documents.
                    </p>
                  )}

                  {message.sources?.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 pt-3">
                      <p className="text-xs font-semibold text-[#19324D] mb-3">
                        Retrieved reference materials
                      </p>

                      {message.sources.map((source, index) => (
                        <div
                          key={source.id || index}
                          className="flex gap-2 items-start text-xs text-slate-500 mb-3"
                        >
                          <FileText
                            size={15}
                            className="shrink-0 mt-0.5"
                          />

                          <div>
                            <p className="font-medium text-slate-700">
                              {source.id && `[${source.id}] `}
                              {source.document || "Untitled document"}
                            </p>

                            <p>
                              PDF page: {source.page ?? "Not specified"}
                            </p>

                            {source.category && (
                              <p>Category: {source.category}</p>
                            )}

                            {source.review_status && (
                              <p>
                                Review status: {source.review_status}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {message.warnings?.length > 0 && (
                    <div className="mt-4 border-t border-amber-200 pt-3">
                      <div className="flex gap-2 items-center text-xs font-semibold text-amber-800 mb-2">
                        <AlertCircle size={15} />
                        Important warnings
                      </div>

                      {message.warnings.map((warning, index) => (
                        <p
                          key={index}
                          className="text-xs text-amber-700 mb-2 leading-5"
                        >
                          {warning}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {message.role === "user" && (
                  <div className="bg-teal-100 text-[#19324D] p-2 rounded-lg h-fit">
                    <User size={18} />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 items-start">
              <div className="bg-[#19324D] text-white p-2 rounded-lg">
                <Bot size={18} />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                <LoaderCircle
                  size={17}
                  className="animate-spin text-[#367C78]"
                />
                <p className="text-sm text-slate-500">
                  Searching legal documents and preparing an answer...
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
            className="flex gap-3"
          >
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question about child protection or juvenile justice..."
              disabled={loading}
              className="flex-1 min-w-0 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50"
            />

            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="bg-[#367C78] text-white px-5 rounded-lg hover:bg-[#2d6865] disabled:opacity-40"
            >
              {loading ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-3 text-center">
            AI-generated information must be checked against current
            official documents and verified by authorised professionals.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-2 text-xs text-slate-500">
        <BookOpen size={16} className="shrink-0 mt-0.5" />
        Always verify legal information against current official documents
        and seek guidance from authorised professionals.
      </div>
    </div>
  );
}

export default Assistant;
