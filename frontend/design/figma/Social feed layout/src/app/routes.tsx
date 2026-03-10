import { createBrowserRouter } from 'react-router';
import { MapView } from './pages/MapView';
import { CreateOccurrence } from './pages/CreateOccurrence';
import { MyReports } from './pages/MyReports';
import { OccurrenceDetails } from './pages/OccurrenceDetails';
import { MobileNavbar } from './components/MobileNavbar';
import { BottomNav } from './components/BottomNav';
import { Toaster } from './components/ui/sonner';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <MobileNavbar />
      <main className="pt-14">{children}</main>
      <BottomNav />
      <Toaster />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Layout>
        <MapView />
      </Layout>
    ),
  },
  {
    path: '/criar',
    element: (
      <Layout>
        <CreateOccurrence />
      </Layout>
    ),
  },
  {
    path: '/minhas-reclamacoes',
    element: (
      <Layout>
        <MyReports />
      </Layout>
    ),
  },
  {
    path: '/ocorrencia/:id',
    element: (
      <Layout>
        <OccurrenceDetails />
      </Layout>
    ),
  },
]);