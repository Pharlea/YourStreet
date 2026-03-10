import LoginCard from "./LoginCard";

interface RightSectionProps {
  onGoogleLogin: () => void;
  logoSrc: string;
}

export default function RightSection({ onGoogleLogin, logoSrc }: RightSectionProps) {
  return (
    <div className="lg:w-1/2 bg-white p-8 lg:p-16 flex items-center justify-center">
      <LoginCard onGoogleLogin={onGoogleLogin} logoSrc={logoSrc} />
    </div>
  );
}