import type { ReactNode } from "react";
import { createBrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { BottomNav } from "./components/BottomNav";
import { MobileNavbar } from "./components/MobileNavbar";
import { CreateOccurrence } from "./pages/CreateOccurrence";
import { MapView } from "./pages/MapView";
import { MyReports } from "./pages/MyReports";
import { OccurrenceDetails } from "./pages/OccurrenceDetails";

function Layout({ children, onLogout }: { children: ReactNode; onLogout: () => Promise<void> }) {
  return (
    <div className="min-h-screen bg-background">
      <MobileNavbar onLogout={onLogout} />
      <main className="pt-14">{children}</main>
      <BottomNav />
      <Toaster />
    </div>
  );
}

export function createSocialRouter(onLogout: () => Promise<void>) {
  return createBrowserRouter([
    {
      path: "/",
      element: (
        <Layout onLogout={onLogout}>
          <MapView />
        </Layout>
      ),
    },
    {
      path: "/criar",
      element: (
        <Layout onLogout={onLogout}>
          <CreateOccurrence />
        </Layout>
      ),
    },
    {
      path: "/ocorrencias",
      element: (
        <Layout onLogout={onLogout}>
          <MyReports />
        </Layout>
      ),
    },
    {
      path: "/ocorrencia/:id",
      element: (
        <Layout onLogout={onLogout}>
          <OccurrenceDetails />
        </Layout>
      ),
    },
  ]);
}
