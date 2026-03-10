import logo from 'figma:asset/ede3a534f8f26a0692f1ac18242992f5bd4a8b10.png';

export function MobileNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-border z-50">
      <div className="h-full max-w-md mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src={logo} alt="Your Street" className="h-8 w-8" />
          <span className="font-semibold text-lg">Your Street</span>
        </div>
      </div>
    </nav>
  );
}
