import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { BrowseProjects } from "./pages/BrowseProjects";
import { ChatPage } from "./pages/ChatPage";
import { Dashboard } from "./pages/Dashboard";
import { LandingPage } from "./pages/LandingPage";
import { PostProject } from "./pages/PostProject";
import { ProfilePage } from "./pages/ProfilePage";
import { ProjectDetails } from "./pages/ProjectDetails";

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
          <Route path="chat" element={<ChatPage />} />
          <Route path="chat/:chatId" element={<ChatPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute roles={["customer"]} />}>
          <Route path="post-project" element={<PostProject />} />
        </Route>
      </Route>
    </Routes>
  );
}
