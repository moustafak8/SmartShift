import { Layout } from "../../components/Sidebar";

export const Dashboard = () => {
  return (
    <Layout>
      <div className="bg-white">
        <div className="px-7 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
           Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Welcome Back 
          </p>
        </div>
      </div>
    </Layout>
  );
};
