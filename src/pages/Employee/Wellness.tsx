import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Sidebar';
import { Card } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';

export function Wellness() {
    const [activePage, setActivePage] = useState('wellness');
    const [entryText, setEntryText] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleNavigate = (page: string) => {
        setActivePage(page);

        // Route to appropriate pages
        switch (page) {
            case "wellness":
                navigate("/employee/wellness");
                break;
            case "dashboard":
                navigate("/employee/dashboard");
                break;
            default:
                console.log("Navigating to:", page);
        }
    };

    const handleSubmit = () => {
        if (!entryText.trim()) return;

        setSubmitted(true);
        setTimeout(() => {
            setEntryText('');
            setSubmitted(false);
        }, 3000);
    };

    return (
        <Layout
            activePage={activePage}
            onNavigate={handleNavigate}
            notificationCount={3}
        >
            <div className="bg-white">
                <div className="px-8 py-6 border-b border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                        Daily Wellness Check-in
                    </h1>
                    <p className="text-sm text-gray-600">
                        Track your wellbeing to help us support you better
                    </p>
                </div>

                <div className="p-8">
                    {submitted ? (
                        <Card className="p-8 text-center bg-green-50 border-green-500">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl text-white">✓</span>
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Thanks for sharing!</h2>
                            <p className="text-gray-600 mb-2">Your wellness data has been recorded</p>
                            <p className="text-sm text-gray-500">Remember to rest and take care of yourself</p>
                        </Card>
                    ) : (
                        <>
                            <Card className="p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-lg font-semibold mb-3 text-gray-900">How are you feeling today?</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Share your thoughts about today's shift, mood, sleep quality, nutrition, or stress levels...
                                </p>
                                <Textarea
                                    placeholder='e.g., "Worked 12h night shift, got 4h sleep, ate sandwich, stressed about understaffing..."'
                                    value={entryText}
                                    onChange={(e) => setEntryText(e.target.value)}
                                    className="min-h-[180px] resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </Card>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!entryText.trim()}
                                    variant="primary"
                                    size="md"
                                >
                                    Submit Entry
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
}