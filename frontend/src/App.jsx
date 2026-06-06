import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LogoMark } from "./components/ui/Logo";

// Route-level code splitting — each page ships in its own chunk so the initial
// load stays light (recharts, the admin suite, chat, etc. load on demand).
const named = (factory, name) => lazy(() => factory().then((m) => ({ default: m[name] })));

const LandingPage = named(() => import("./pages/LandingPage"), "LandingPage");
const AuthPage = named(() => import("./pages/AuthPage"), "AuthPage");
const ForgotPasswordPage = named(() => import("./pages/ForgotPasswordPage"), "ForgotPasswordPage");
const ResetPasswordPage = named(() => import("./pages/ResetPasswordPage"), "ResetPasswordPage");
const NotificationsPage = named(() => import("./pages/NotificationsPage"), "NotificationsPage");
const Dashboard = named(() => import("./pages/Dashboard"), "Dashboard");
const BrowseProjects = named(() => import("./pages/BrowseProjects"), "BrowseProjects");
const ProjectDetails = named(() => import("./pages/ProjectDetails"), "ProjectDetails");
const ContractorPortfolio = named(() => import("./pages/ContractorPortfolio"), "ContractorPortfolio");
const ChatPage = named(() => import("./pages/ChatPage"), "ChatPage");
const ProfilePage = named(() => import("./pages/ProfilePage"), "ProfilePage");
const PostProject = named(() => import("./pages/PostProject"), "PostProject");
const FindContractors = named(() => import("./pages/FindContractors"), "FindContractors");
const SubscriptionPlans = named(() => import("./pages/SubscriptionPlans"), "SubscriptionPlans");
const PremiumUpgrade = named(() => import("./pages/PremiumUpgrade"), "PremiumUpgrade");
const MySubscription = named(() => import("./pages/MySubscription"), "MySubscription");
const ContractorRevenue = named(() => import("./pages/ContractorRevenue"), "ContractorRevenue");
const PaymentSuccess = named(() => import("./pages/PaymentSuccess"), "PaymentSuccess");
const PaymentFailed = named(() => import("./pages/PaymentFailed"), "PaymentFailed");
const AdminLayout = named(() => import("./pages/admin/AdminLayout"), "AdminLayout");
const AdminOverview = named(() => import("./pages/admin/AdminOverview"), "AdminOverview");
const AdminApprovals = named(() => import("./pages/admin/AdminApprovals"), "AdminApprovals");
const AdminPayments = named(() => import("./pages/admin/AdminPayments"), "AdminPayments");
const AdminRevenue = named(() => import("./pages/admin/AdminRevenue"), "AdminRevenue");
const AdminUsers = named(() => import("./pages/admin/AdminUsers"), "AdminUsers");
const AdminAnalytics = named(() => import("./pages/admin/AdminAnalytics"), "AdminAnalytics");

const PageLoader = () => (
  <div className="grid min-h-[60vh] place-items-center">
    <LogoMark size={44} className="animate-pulse" />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public marketing chrome */}
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
        </Route>

        {/* Auth — full-screen, no app chrome */}
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="register" element={<AuthPage mode="register" />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />

        {/* Authenticated app — sidebar / bottom-nav shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="browse-projects" element={<BrowseProjects />} />
            <Route path="projects/:id" element={<ProjectDetails />} />
            <Route path="contractors/:id" element={<ContractorPortfolio />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="chat/:chatId" element={<ChatPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="notifications" element={<NotificationsPage />} />

            <Route element={<ProtectedRoute roles={["customer"]} />}>
              <Route path="post-project" element={<PostProject />} />
              <Route path="find-contractors" element={<FindContractors />} />
            </Route>

            <Route element={<ProtectedRoute roles={["contractor"]} />}>
              <Route path="plans" element={<SubscriptionPlans />} />
              <Route path="premium" element={<PremiumUpgrade />} />
              <Route path="membership" element={<MySubscription />} />
              <Route path="earnings" element={<ContractorRevenue />} />
              <Route path="payment/success" element={<PaymentSuccess />} />
              <Route path="payment/failed" element={<PaymentFailed />} />
            </Route>
          </Route>
        </Route>

        {/* Admin — dedicated console layout */}
        <Route element={<ProtectedRoute roles={["admin"]} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="approvals" element={<AdminApprovals />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
