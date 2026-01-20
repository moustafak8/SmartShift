import { useState, useMemo } from "react";
import {
  AlertCircle,
  BarChart3,
  AlertTriangle,
  FileText,
  CheckCheck,
  Activity,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Layout } from "../../components/Sidebar";
import {
  useInsights,
  useInsightUnreadCount,
  useMarkInsightAsRead,
} from "../../hooks/Manager/useInsights";
import { useAuth } from "../../hooks/context/AuthContext";
import type { AIInsight, InsightFilter } from "../../hooks/types/insight";

const getTypeConfig = (type: string, priority: string) => {
  if (priority === "urgent") {
    return {
      icon: AlertCircle,
      label: "URGENT",
      borderColor: "border-[#EF4444]",
      iconColor: "text-[#EF4444]",
    };
  }
  if (type === "weekly_summary") {
    return {
      icon: BarChart3,
      label: "WEEKLY SUMMARY",
      borderColor: "border-[#3B82F6]",
      iconColor: "text-[#3B82F6]",
    };
  }
  if (type === "alert" || priority === "high") {
    return {
      icon: AlertTriangle,
      label: "ALERT",
      borderColor: "border-[#F59E0B]",
      iconColor: "text-[#F59E0B]",
    };
  }
  return {
    icon: FileText,
    label: "INFO",
    borderColor: "border-[#6B7280]",
    iconColor: "text-[#6B7280]",
  };
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function AIInsights() {
  const { departmentId } = useAuth();

  const { insights, isLoading, isError, refetch } = useInsights(
    departmentId ?? undefined,
  );
  const { count: unreadCount } = useInsightUnreadCount(
    departmentId ?? undefined,
  );
  const markAsRead = useMarkInsightAsRead();

  const [selectedFilter, setSelectedFilter] = useState<InsightFilter>("all");

  const filteredInsights = useMemo(() => {
    if (selectedFilter === "all") return insights;
    if (selectedFilter === "unread") return insights.filter((i) => !i.is_read);
    if (selectedFilter === "urgent")
      return insights.filter((i) => i.priority === "urgent");
    return insights.filter((i) => i.insight_type === selectedFilter);
  }, [insights, selectedFilter]);

  const handleMarkAsRead = (insight: AIInsight) => {
    if (!insight.is_read) {
      markAsRead.mutate(insight.id);
    }
  };

  const handleMarkAllRead = () => {
    insights.filter((i) => !i.is_read).forEach((i) => markAsRead.mutate(i.id));
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        <div className="border-b border-[#E5E7EB] bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-[#111827]">
              AI Insights
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Actionable insights generated from AI analysis of wellness data
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <div className="px-6 py-3 bg-[#EFF6FF] border-b border-[#DBEAFE]">
            <span className="text-sm font-medium text-[#3B82F6]">
              {unreadCount} new insight{unreadCount > 1 ? "s" : ""} available
            </span>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {(
                ["all", "unread", "weekly_summary", "urgent"] as InsightFilter[]
              ).map((filter) => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter === "all" && "All"}
                  {filter === "unread" && `Unread (${unreadCount})`}
                  {filter === "weekly_summary" && "Weekly"}
                  {filter === "urgent" && "Alerts"}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="flex items-center"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            </div>
          </div>

          {isLoading && (
            <Card className="p-16 text-center bg-white">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#3B82F6] border-r-transparent"></div>
              <p className="mt-4 text-[#6B7280] font-medium">
                Loading insights...
              </p>
            </Card>
          )}

          {isError && (
            <Card className="p-16 text-center border-2 border-[#EF4444]/30 bg-[#FEF2F2]">
              <AlertCircle className="w-14 h-14 mx-auto text-[#EF4444] mb-4" />
              <h3 className="text-xl font-bold text-[#111827] mb-2">
                Failed to Load Insights
              </h3>
              <p className="text-[#6B7280] mb-6 max-w-md mx-auto">
                Something went wrong while fetching insights.
              </p>
              <Button
                onClick={handleRefresh}
                variant="secondary"
                className="border-2"
              >
                Try Again
              </Button>
            </Card>
          )}

          {!isLoading && !isError && filteredInsights.length === 0 && (
            <Card className="p-16 text-center border border-[#E5E7EB] bg-white">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] flex items-center justify-center mx-auto mb-5">
                <Activity className="w-10 h-10 text-[#9CA3AF]" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">
                No Insights Yet
              </h3>
              <p className="text-[#6B7280] max-w-md mx-auto">
                AI-generated insights will appear here when there is sufficient
                wellness data to analyze.
              </p>
            </Card>
          )}

          {!isLoading && !isError && filteredInsights.length > 0 && (
            <div className="space-y-4">
              {filteredInsights.map((insight) => {
                const config = getTypeConfig(
                  insight.insight_type,
                  insight.priority,
                );
                const Icon = config.icon;
                return (
                  <div
                    key={insight.id}
                    onClick={() => handleMarkAsRead(insight)}
                    className="cursor-pointer"
                  >
                    <Card
                      className={`border-l-4 ${config.borderColor} hover:shadow-lg transition-all`}
                    >
                      <div className="px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Icon
                                  className={`w-5 h-5 ${config.iconColor}`}
                                />
                                <h3 className="font-semibold text-[#111827]">
                                  {config.label}
                                </h3>
                              </div>
                              {!insight.is_read && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-medium">
                                  New
                                </span>
                              )}
                              <span className="text-sm text-[#6B7280]">
                                {formatDate(insight.created_at)}
                              </span>
                            </div>
                            <h4 className="font-semibold text-[#111827] mt-3 mb-2">
                              {insight.title}
                            </h4>
                            <div className="text-sm text-[#374151] whitespace-pre-wrap">
                              {insight.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
