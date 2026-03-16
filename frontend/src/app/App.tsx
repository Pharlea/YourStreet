import { useState } from "react";
import { LeftSection, RightSection, TabType } from "./components/ui";
import { useAuth } from "../hooks/useAuth";
import SocialApp from "./social/SocialApp";
import logo from "../assets/2ee5a729a53e6d7122aac1e983d6dd6a232f1a6b.png";

export default function App() {
  const [activePanel, setActivePanel] = useState<TabType | null>(null);
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  const handlePanelToggle = (panel: TabType) => {
    // Se clicar no painel já ativo, fecha. Senão, abre o novo painel
    setActivePanel(activePanel === panel ? null : panel);
  };

  const handleGoogleLogin = () => {
    console.log("Iniciando login com Google...");
    login();
  };

  // Tela de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se estiver autenticado, mostra a area social (mapa/criar/minhas ocorrencias)
  if (isAuthenticated && user) {
    return <SocialApp onLogout={logout} />;
  }

  // Tela de login
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <LeftSection 
        activePanel={activePanel} 
        onPanelToggle={handlePanelToggle} 
      />
      <RightSection 
        onGoogleLogin={handleGoogleLogin}
        logoSrc={logo} 
      />
    </div>
  );
}
