import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { ChatWidget } from "@/components/chatbot/chat-widget";
import type { UserRol } from "@/types/database";

interface DashboardLayoutProps {
  children:   React.ReactNode;
  userRol:    UserRol;
  userName:   string;
  userEmail:  string;
  avatarUrl?: string | null;
  pageTitle?: string;
}

export function DashboardLayout({
  children,
  userRol,
  userName,
  userEmail,
  avatarUrl,
  pageTitle,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-tq-cream">
      {/* Sidebar — hidden en mobile */}
      <div className="hidden md:flex">
        <Sidebar
          userRol={userRol}
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar
          userRol={userRol}
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          pageTitle={pageTitle}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 max-w-[1400px] mx-auto fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Chatbot flotante — visible en todos los dashboards */}
      <ChatWidget />
    </div>
  );
}
