import { useState } from "react";
import { MessageSquare, Lightbulb, Sparkles, RotateCcw, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Textarea";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useWellnessInsights } from "../../hooks/Manager/useQuery";
import type { WellnessInsightPayload } from "../../hooks/types/rag";
import { Layout } from "../../components/Sidebar";

export function RAGQuery() {
  const [query, setQuery] = useState("");
  const { mutate: searchInsights, isPending, data, isError, error } = useWellnessInsights();

  const suggestedQuestions = [
    "Who got < 4h sleep this week?",
    "Show entries about stress",
    "Summarize this week's sentiment",
    "Which shifts have worst wellness?",
  ];

  const handleAsk = () => {
    if (!query.trim()) return;
    searchInsights({ query });
  };

  const handleSuggestedQuestion = (question: string) => {
    setQuery(question);
    searchInsights({ query: question });
  };

  const handleNewQuery = () => {
    setQuery("");
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "bg-[#DCFCE7] text-[#166534] border-[#10B981]";
      case "negative":
        return "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]";
      default:
        return "bg-[#F3F4F6] text-[#374151] border-[#9CA3AF]";
    }
  };

  const responseData: WellnessInsightPayload | null = data?.payload || null;

  return (
    <Layout notificationCount={8}>
      <div className="bg-white min-h-screen">
      <div className="border-b border-[#E5E7EB] bg-white">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-semibold text-[#111827] flex items-center gap-2">
            AI Wellness Insights
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Ask questions about your team's wellness data and get AI-powered insights
          </p>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <Card className="p-6 bg-white border border-[#E5E7EB] rounded-xl mb-6">
          <h2 className="text-lg font-semibold text-[#111827] mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#3B82F6]" />
            Ask About Your Team's Health
          </h2>
          <div className="relative">
            <Textarea
              placeholder="Which employees mentioned sleep issues this week?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              className="min-h-[100px] pr-24 border-[#b9b9b9]"
              disabled={isPending}
            />
            <Button
              onClick={handleAsk}
              disabled={isPending || !query.trim()}
              className="absolute bottom-3 right-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white disabled:opacity-50"
              size="sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...
                </>
              ) : (
                "Ask AI →"
              )}
            </Button>
          </div>
        </Card>

        <div className="mb-8">
          <h3 className="text-sm font-medium text-[#6B7280] mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Suggested Questions:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedQuestion(question)}
                disabled={isPending}
                className="text-left px-4 py-3 rounded-lg border border-[#E5E7EB] hover:border-[#3B82F6] hover:bg-[#F0F9FF] transition-colors text-sm text-[#374151] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {isPending && (
          <Card className="p-8 bg-white border border-[#E5E7EB] rounded-xl">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin mb-4" />
              <p className="text-[#6B7280] text-center">
                Analyzing wellness entries and generating insights...
              </p>
            </div>
          </Card>
        )}

        {isError && (
          <Card className="p-6 bg-[#FEE2E2] border-l-4 border-[#EF4444] rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#991B1B] mb-1">Error</h3>
                <p className="text-sm text-[#7F1D1D]">
                  {error?.message || "Failed to get insights. Please try again."}
                </p>
              </div>
            </div>
          </Card>
        )}

        {responseData && !isPending && (
          <div>
            <div className="h-px bg-[#E5E7EB] mb-6"></div>

            <Card className="p-6 bg-[#EFF6FF] border-l-4 border-[#3B82F6] rounded-xl mb-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#3B82F6]" />
                  AI Response
                </h2>
              </div>

              <div className="bg-white p-4 rounded-lg border border-[#3B82F6]/20 mb-6">
                <p className="text-sm text-[#6B7280] mb-2 font-medium">Query:</p>
                <p className="text-[#111827]">{responseData.query}</p>
              </div>

              <div className="prose prose-sm max-w-none mb-6">
                <p className="text-[#374151] leading-relaxed whitespace-pre-wrap">
                  {responseData.answer}
                </p>
              </div>

              {responseData.sources && responseData.sources.length > 0 && (
                <div>
                  <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    Sources ({responseData.sources.length})
                  </h3>
                  <div className="space-y-3">
                    {responseData.sources.map((source) => (
                      <div
                        key={source.entry_id}
                        className="p-4 bg-white rounded-lg border border-[#E5E7EB] hover:border-[#3B82F6] transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#3B82F6] text-white text-xs font-semibold">
                              {source.citation_number}
                            </span>
                            <div>
                              <span className="font-semibold text-[#111827]">
                                {source.employee_name}
                              </span>
                              <span className="text-sm text-[#6B7280] ml-2">
                                {source.entry_date}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`text-xs border ${getSentimentColor(
                                source.sentiment
                              )}`}
                            >
                              {source.sentiment}
                            </Badge>
                            {source.is_flagged && (
                              <Badge className="bg-[#FEF3C7] text-[#92400E] border-[#F59E0B] text-xs">
                                Flagged
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-[#6B7280] italic mb-2">
                          "{source.preview}"
                        </p>
                        <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                          <span>Entry ID: {source.entry_id}</span>
                          <span>Relevance: {(source.score * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={handleNewQuery}
                className="border border-[#E5E7EB]"
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Query
              </Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </Layout>
  );
}
