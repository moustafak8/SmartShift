import { useState } from "react";
import { Layout } from "../../components/Sidebar";
import { TeamOverview } from "./TeamOverview";

export const Dashboard = () => {
    const [activePage, setActivePage] = useState("dashboard");

    const handleNavigate = (page: string) => {
        setActivePage(page);
        console.log("Navigating to:", page);
    };

    const renderPage = () => {
        switch (activePage) {
            case "team":
                return <TeamOverview onNavigate={handleNavigate} />;
            case "dashboard":
                return (
                    <div className="p-8">
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Manager Dashboard
                            </h1>
                            <p className="text-gray-600 mb-8">
                                Welcome back! Here's what's happening with your team today.
                            </p>

                            {/* Dashboard Content */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Sample Cards */}
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Total Team Members
                                    </h3>
                                    <p className="text-3xl font-bold text-blue-600">24</p>
                                </div>

                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Active Shifts
                                    </h3>
                                    <p className="text-3xl font-bold text-green-600">12</p>
                                </div>

                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Pending Requests
                                    </h3>
                                    <p className="text-3xl font-bold text-orange-600">5</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="p-8">
                        <div className="max-w-7xl mx-auto">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
                            </h1>
                            <p className="text-gray-600">
                                This page is under construction.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Layout
            activePage={activePage}
            onNavigate={handleNavigate}
            notificationCount={8}
        >
            {renderPage()}
        </Layout>
    );
};
