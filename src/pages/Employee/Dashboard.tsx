import { useState } from "react";
import { Layout } from "../../components/Sidebar";

export const Dashboard = () => {
    const [activePage, setActivePage] = useState("dashboard");

    const handleNavigate = (page: string) => {
        setActivePage(page);
        console.log("Navigating to:", page);
        // routing logic here later
    };

    return (
        <Layout
            activePage={activePage}
            onNavigate={handleNavigate}
            notificationCount={3}
        >
            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Employee Dashboard
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Welcome back! Here's your schedule and wellness overview.
                    </p>

                    {/* Dashboard Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Sample Cards */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Upcoming Shifts
                            </h3>
                            <p className="text-3xl font-bold text-blue-600">8</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Wellness Score
                            </h3>
                            <p className="text-3xl font-bold text-green-600">85%</p>
                        </div>

                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Pending Swaps
                            </h3>
                            <p className="text-3xl font-bold text-orange-600">2</p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};