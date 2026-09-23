/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginPage } from './components/auth/LoginPage';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { ToastContainer } from './components/common/ToastContainer';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickCreateModal } from './components/common/QuickCreateModal';

// Views
import { DashboardView } from './components/views/DashboardView';
import { LeadsView } from './components/views/LeadsView';
import { CustomersView } from './components/views/CustomersView';
import { DealsView } from './components/views/DealsView';
import { PipelineView } from './components/views/PipelineView';
import { TasksView } from './components/views/TasksView';
import { FollowUpsView } from './components/views/FollowUpsView';
import { CalendarView } from './components/views/CalendarView';
import { AppointmentsView } from './components/views/AppointmentsView';
import { ProductsView } from './components/views/ProductsView';
import { InvoicesView } from './components/views/InvoicesView';
import { PaymentsView } from './components/views/PaymentsView';
import { CommunicationsView } from './components/views/CommunicationsView';
import { DocumentsView } from './components/views/DocumentsView';
import { ReportsView } from './components/views/ReportsView';
import { TeamView } from './components/views/TeamView';
import { AiAssistantView } from './components/views/AiAssistantView';
import { SettingsView } from './components/views/SettingsView';

const MainContent: React.FC = () => {
  const { activeView, isAuthenticated, isLoadingSession, currentUser } = useCrm();
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // If currently verifying session
  if (isLoadingSession) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg font-mono shadow-xl shadow-blue-600/30 animate-pulse">
            OX
          </div>
          <div className="text-center">
            <h2 className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-mono">
              ORVEXA CRM
            </h2>
            <p className="text-xs text-neutral-400 mt-1 font-mono">
              Verifying enterprise security credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Protected route check: if unauthenticated, redirect to LoginPage
  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'leads':
        return <LeadsView />;
      case 'customers':
        return <CustomersView />;
      case 'deals':
        return <DealsView />;
      case 'pipeline':
        return <PipelineView />;
      case 'tasks':
        return <TasksView />;
      case 'follow-ups':
      case 'followups':
        return <FollowUpsView />;
      case 'calendar':
        return <CalendarView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'products':
        return <ProductsView />;
      case 'invoices':
        return <InvoicesView />;
      case 'payments':
        return <PaymentsView />;
      case 'communications':
        return <CommunicationsView />;
      case 'documents':
        return <DocumentsView />;
      case 'reports':
        return <ReportsView />;
      case 'team':
        return <TeamView />;
      case 'ai-assistant':
      case 'ai_assistant':
        return <AiAssistantView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100 antialiased selection:bg-blue-500/20 selection:text-blue-500">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        <Header
          collapsed={collapsed}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scrollbar-thin">
          <div className="max-w-7xl mx-auto w-full">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <GlobalSearchModal />
      <QuickCreateModal />
      <UserProfileModal />
    </div>
  );
};

export default function App() {
  return (
    <CrmProvider>
      <MainContent />
    </CrmProvider>
  );
}
