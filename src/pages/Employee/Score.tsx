import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Activity, Brain, TrendingUp, BarChart, Lightbulb } from 'lucide-react';
import { Layout } from '../../components/Sidebar';
import { Card } from '../../components/ui/Card';
import { useScoreDetails } from '../../hooks/Employee/useScoreDetails';

export function Score() {
    const [activePage, setActivePage] = useState('fatigue');
    const navigate = useNavigate();
    const { scoreData, isLoading, isError } = useScoreDetails();

    const handleNavigate = (page: string) => {
        setActivePage(page);

        switch (page) {
            case "wellness":
                navigate("/employee/wellness");
                break;
            case "dashboard":
                navigate("/employee/dashboard");
                break;
            case "fatigue":
                navigate("/employee/score");
                break;
            default:
                console.log("Navigating to:", page);
        }
    };

    const getRiskLevel = (score: number) => {
        if (score < 30) return { level: 'LOW', color: 'text-green-600', bg: 'bg-green-600' };
        if (score < 60) return { level: 'MEDIUM', color: 'text-blue-600', bg: 'bg-blue-600' };
        return { level: 'HIGH', color: 'text-red-600', bg: 'bg-red-600' };
    };

    return (
        <Layout
            activePage={activePage}
            onNavigate={handleNavigate}
            notificationCount={3}
        >
            <div className="bg-white">
                <div className="px-7 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                        Your Wellness Score
                    </h1>
                    <p className="text-sm text-gray-600">
                        Track and understand your wellness metrics
                    </p>
                </div>

                <div className="p-8">
                    {isLoading ? (
                        <Card className="p-6 text-center">
                            <p className="text-gray-500">Loading your wellness score...</p>
                        </Card>
                    ) : isError ? (
                        <Card className="p-6 text-center bg-red-50 border-red-200">
                            <p className="text-red-600">Failed to load wellness score. Please try again later.</p>
                        </Card>
                    ) : scoreData ? (
                        <>
                            <div className="mb-8">
                                <div className="text-center mb-3">
                                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-2">
                                        <TrendingUp className="w-4 h-4 text-blue-600" />
                                        <span>Current Score</span>
                                    </div>
                                    <div className={`text-5xl font-bold mb-4 ${getRiskLevel(scoreData.total_score).color}`}>
                                        {scoreData.total_score}/100
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all"
                                        style={{ width: `${scoreData.total_score}%` }}
                                    />
                                </div>
                                <div className="text-center">
                                    <span className={`inline-block px-4 py-1 rounded-full font-semibold text-white text-sm ${getRiskLevel(scoreData.total_score).bg}`}>
                                        {scoreData.risk_level.toUpperCase()} RISK
                                    </span>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <BarChart className="w-5 h-5 text-blue-600" />
                                    Score Breakdown
                                </h2>


                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CalendarIcon className="w-4 h-4 text-blue-600" />
                                        <h3 className="font-semibold text-gray-900">
                                            Schedule Pressure ({scoreData.breakdown.schedule_pressure.weight}%)
                                        </h3>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${(scoreData.breakdown.schedule_pressure.score / scoreData.breakdown.schedule_pressure.weight) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {scoreData.breakdown.schedule_pressure.score}/{scoreData.breakdown.schedule_pressure.weight} points
                                    </p>
                                </div>


                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-4 h-4 text-blue-600" />
                                        <h3 className="font-semibold text-gray-900">
                                            Physical Wellness ({scoreData.breakdown.physical_wellness.weight}%)
                                        </h3>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${(scoreData.breakdown.physical_wellness.score / scoreData.breakdown.physical_wellness.weight) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {scoreData.breakdown.physical_wellness.score}/{scoreData.breakdown.physical_wellness.weight} points
                                    </p>
                                </div>


                                <div className="mb-8">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Brain className="w-4 h-4 text-blue-600" />
                                        <h3 className="font-semibold text-gray-900">
                                            Mental Health ({scoreData.breakdown.mental_health.weight}%)
                                        </h3>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${(scoreData.breakdown.mental_health.score / scoreData.breakdown.mental_health.weight) * 100}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        {scoreData.breakdown.mental_health.score}/{scoreData.breakdown.mental_health.weight} points
                                    </p>
                                </div>
                            </div>


                            <div className="border-t pt-6">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-blue-600" />
                                    Recommendations
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <div className="font-semibold text-gray-900 mb-1">Prioritize sleep tonight</div>
                                        <p className="text-sm text-gray-600">Aim for 7-8 hours</p>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 mb-1">Prep healthy meals</div>
                                        <p className="text-sm text-gray-600">Your nutrition is important</p>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 mb-1">Take short breaks</div>
                                        <p className="text-sm text-gray-600">5-min breathing exercises</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>
        </Layout>
    );
}
