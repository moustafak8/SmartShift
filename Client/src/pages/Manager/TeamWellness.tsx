import { useState, useMemo } from "react";
import {
  Search,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { Badge, Button, Input, Card } from "../../components/ui";
import { Layout } from "../../components/Sidebar";
import { useFlaggedWellnessEntries } from "../../hooks/Manager/useFlaggedWellnessEntries";
import { useAuth } from "../../hooks/context/AuthContext";

export function TeamWellness() {
  const { departmentId } = useAuth();
  const { entries, isLoading, isError } = useFlaggedWellnessEntries(
    departmentId || 1
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<
    "all" | "high" | "medium" | "low"
  >("all");

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch = entry.entry_text
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesSeverity =
        filterSeverity === "all" || entry.flag_severity === filterSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [entries, searchQuery, filterSeverity]);

  const criticalEntries = filteredEntries.filter(
    (entry) => entry.flag_severity === "high"
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <TrendingUp className="h-4 w-4" />;
      case "negative":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const stats = useMemo(() => {
    if (entries.length === 0)
      return { avgSentiment: 0, highRiskCount: 0, totalEntries: 0 };

    const avgSentiment =
      entries.reduce(
        (sum, entry) => sum + parseFloat(entry.sentiment_score),
        0
      ) / entries.length;
    const highRiskCount = entries.filter(
      (entry) => entry.flag_severity === "high"
    ).length;

    return {
      avgSentiment: avgSentiment.toFixed(2),
      highRiskCount,
      totalEntries: entries.length,
    };
  }, [entries]);

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        <div className="border-b border-[#E5E7EB] bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-[#111827]">
              Flagged Wellness Entries
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Review wellness entries requiring attention
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 px-6 py-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
            <Input
              type="text"
              placeholder="Search wellness entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterSeverity}
            onChange={(e) =>
              setFilterSeverity(
                e.target.value as "all" | "high" | "medium" | "low"
              )
            }
            className="px-4 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <option value="all">All Severities</option>
            <option value="high">High Risk Only</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Low Risk</option>
          </select>
        </div>

        <div className="p-6">
          {isLoading && (
            <Card className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#3B82F6] border-r-transparent"></div>
              <p className="mt-4 text-sm text-[#6B7280]">
                Loading wellness entries...
              </p>
            </Card>
          )}

          {isError && (
            <Card className="p-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-[#EF4444] mb-4" />
              <h3 className="text-lg font-semibold text-[#EF4444] mb-2">
                Failed to load wellness entries
              </h3>
              <p className="text-sm text-[#6B7280]">
                Please try again later or contact support if the issue persists.
              </p>
            </Card>
          )}

          {!isLoading && !isError && criticalEntries.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
                <h2 className="text-lg font-semibold text-[#111827]">
                  Critical Attention Required
                </h2>
              </div>
              {criticalEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className="border-l-4 border-[#EF4444] bg-[#FEF2F2] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-medium text-[#111827]">
                          {entry.employee_name}
                        </h3>
                        <Badge className="bg-[#EF4444] text-white border-0">
                          HIGH RISK
                        </Badge>
                        <span className="text-sm text-[#6B7280]">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-[#374151] leading-relaxed">
                        {entry.entry_text}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 border border-[#E5E7EB]">
                          {getSentimentIcon(entry.sentiment_label)}
                          <span className="text-xs font-medium text-[#374151]">
                            Sentiment: {entry.sentiment_label} (
                            {entry.sentiment_score})
                          </span>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1.5 text-xs text-[#6B7280] border border-[#E5E7EB]">
                          Reason: {entry.flag_reason}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                      >
                        Review Full Entry
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="border border-[#E5E7EB]"
                      >
                        Take Action
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && !isError && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-[#111827]">
                All Entries ({filteredEntries.length})
              </h2>

              {filteredEntries.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-[#6B7280]">
                    No wellness entries found matching your criteria.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-[#E5E7EB] p-4 transition-all hover:border-[#3B82F6] hover:bg-[#EFF6FF]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-medium text-[#111827]">
                              {entry.employee_name}
                            </span>
                            <Badge
                              className={`${
                                entry.sentiment_label === "positive"
                                  ? "bg-[#DCFCE7] text-[#10B981]"
                                  : entry.sentiment_label === "negative"
                                  ? "bg-[#FEE2E2] text-[#EF4444]"
                                  : "bg-[#F3F4F6] text-[#6B7280]"
                              } border-0 capitalize`}
                            >
                              {entry.sentiment_label}
                            </Badge>
                            <Badge
                              className={`${
                                entry.flag_severity === "high"
                                  ? "bg-[#FEE2E2] text-[#EF4444]"
                                  : entry.flag_severity === "medium"
                                  ? "bg-[#FEF3C7] text-[#F59E0B]"
                                  : "bg-[#F3F4F6] text-[#6B7280]"
                              } border-0 uppercase`}
                            >
                              {entry.flag_severity}
                            </Badge>
                            <span className="text-sm text-[#6B7280]">
                              {formatDate(entry.created_at)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-[#374151] line-clamp-2">
                            {entry.entry_text}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-3">
                            <span className="rounded-full bg-[#F9FAFB] px-3 py-1 text-xs text-[#6B7280]">
                              Words: {entry.word_count}
                            </span>
                            <span className="rounded-full bg-[#F9FAFB] px-3 py-1 text-xs text-[#6B7280]">
                              Score: {entry.sentiment_score}
                            </span>
                            <span className="rounded-full bg-[#F9FAFB] px-3 py-1 text-xs text-[#6B7280]">
                              {entry.flag_reason}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="border border-[#E5E7EB]"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {!isLoading && !isError && entries.length > 0 && (
            <Card className="mt-6 p-6">
              <h2 className="mb-4 text-lg font-semibold text-[#111827]">
                Team Wellness Overview
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border-l-4 border-[#3B82F6] bg-white p-4 shadow-sm">
                  <div className="text-sm font-medium text-[#6B7280]">
                    Total Flagged Entries
                  </div>
                  <div className="mt-2 text-3xl font-bold text-[#111827]">
                    {stats.totalEntries}
                  </div>
                </div>
                <div className="rounded-lg border-l-4 border-[#EF4444] bg-white p-4 shadow-sm">
                  <div className="text-sm font-medium text-[#6B7280]">
                    High Risk Cases
                  </div>
                  <div className="mt-2 text-3xl font-bold text-[#111827]">
                    {stats.highRiskCount}
                  </div>
                </div>
                <div className="rounded-lg border-l-4 border-[#8B5CF6] bg-white p-4 shadow-sm">
                  <div className="text-sm font-medium text-[#6B7280]">
                    Avg Sentiment Score
                  </div>
                  <div className="mt-2 text-3xl font-bold text-[#111827]">
                    {stats.avgSentiment}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
