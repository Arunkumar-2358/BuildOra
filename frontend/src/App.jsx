import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { BrowseProjects } from "./pages/BrowseProjects";
import { ChatPage } from "./pages/ChatPage";
import { ContractorPortfolio } from "./pages/ContractorPortfolio";
import { Dashboard } from "./pages/Dashboard";
import { FindContractors } from "./pages/FindContractors";
import { LandingPage } from "./pages/LandingPage";
import { PostProject } from "./pages/PostProject";
import { ProfilePage } from "./pages/ProfilePage";
import { ProjectDetails } from "./pages/ProjectDetails";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminApprovals } from "./pages/admin/AdminApprovals";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminOverview } from "./pages/admin/AdminOverview";
import { AdminPayments } from "./pages/admin/AdminPayments";
import { AdminUsers } from "./pages/admin/AdminUsers";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />

        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="browse-projects" element={<BrowseProjects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="contractors/:id" element={<ContractorPortfolio />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:chatId" element={<ChatPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["customer"]} />}>
          <Route path="post-project" element={<PostProject />} />
          <Route path="find-contractors" element={<FindContractors />} />
        </Route>

        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
