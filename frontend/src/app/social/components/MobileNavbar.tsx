import logo from "../../../assets/2ee5a729a53e6d7122aac1e983d6dd6a232f1a6b.png";
import { useAuth } from "../../../hooks/useAuth";

export function MobileNavbar() {
  const { logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50">
      <div className="h-full max-w-md mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="Your Street" className="h-8 w-8" />
          <span className="font-semibold text-lg">Your Street</span>
        </div>
        {/* Logout button */}
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:text-red-800"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
