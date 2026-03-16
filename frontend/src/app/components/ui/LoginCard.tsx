import GoogleLoginButton from "./GoogleLoginButton";

interface LoginCardProps {
  onGoogleLogin: () => void;
  logoSrc: string;
}

export default function LoginCard({ onGoogleLogin, logoSrc }: LoginCardProps) {
  return (
    <div className="w-full max-w-md">
      {/* Card de Login */}
      <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-10 border border-gray-100">
        {/* Logotipo */}
        <div className="flex justify-center mb-8">
          <img
            src={logoSrc}
            alt="Logo"
            className="h-20 w-auto object-contain"
          />
        </div>

        {/* Título */}
        <h2 className="text-2xl text-center text-black mb-3">
          Acesse com sua conta
        </h2>

        {/* Subtítulo */}
        <p className="text-center text-gray-600 mb-8 text-sm">
          Entre com sua conta Google para continuar.
        </p>

        {/* Botão Google */}
        <GoogleLoginButton onClick={onGoogleLogin} />

        {/* Texto de segurança */}
        <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
          Utilizamos autenticação segura do Google. Não armazenamos sua senha.
        </p>
      </div>

      {/* Rodapé */}
      <p className="text-center text-sm text-gray-500 mt-8">
        © 2026 YourStreet – Transformando bairros juntos.
      </p>
    </div>
  );
}