import { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";
import AuthService from "../../../services/AuthService";

interface LoginCardProps {
  onGoogleLogin: () => void;
  logoSrc: string;
}

export default function LoginCard({ onGoogleLogin, logoSrc }: LoginCardProps) {
  const [mode, setMode] = useState<'google' | 'login' | 'register'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    try {
      if (mode === 'login') {
        await AuthService.getInstance().loginWithEmail(email, password);
      } else if (mode === 'register') {
        await AuthService.getInstance().register(email, password, name);
      }
      // reload para atualizar estado
      window.location.href = '/';
    } catch (err: any) {
      setError(err?.message || 'Ocorreu um erro');
    }
  };

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
          {mode === 'google' && 'Acesse com sua conta'}
          {mode === 'login' && 'Entrar com email'}
          {mode === 'register' && 'Cadastre‑se'}
        </h2>

        {/* Subtítulo */}
        {mode === 'google' && (
          <p className="text-center text-gray-600 mb-8 text-sm">
            Entre com sua conta Google para continuar.
          </p>
        )}
        {mode === 'login' && (
          <p className="text-center text-gray-600 mb-8 text-sm">
            Use seu email e senha.
          </p>
        )}
        {mode === 'register' && (
          <p className="text-center text-gray-600 mb-8 text-sm">
            Informe nome, email e senha para criar uma conta.
          </p>
        )}

        {/* Conteúdo de cada modo */}
        {mode === 'google' && <GoogleLoginButton onClick={onGoogleLogin} />}

        {(mode === 'login' || mode === 'register') && (
          <div className="space-y-4">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="Nome"
                className="w-full px-4 py-2 border rounded"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            )}
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border rounded"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Senha"
              className="w-full px-4 py-2 border rounded"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              className="w-full bg-yellow-500 text-white py-2 rounded font-semibold hover:bg-yellow-600 transition"
              onClick={handleSubmit}
            >
              {mode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
            {mode === 'login' && (
              <button
                className="w-full mt-2 text-sm text-gray-600 underline"
                onClick={() => {
                  // entrar como convidado para ver ocorrências
                  localStorage.setItem('guest', 'true');
                  window.location.href = '/';
                }}
              >
                Ver ocorrências sem conta
              </button>
            )}
          </div>
        )}

        {/* Texto de segurança */}
        {mode === 'google' && (
          <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
            Utilizamos autenticação segura do Google. Não armazenamos sua senha.
          </p>
        )}

        {/* Links de troca de modo */}
        <div className="text-center mt-6">
          {mode === 'google' && (
            <button
              className="text-sm text-blue-500 hover:underline"
              onClick={() => setMode('login')}
            >
              Entrar com email
            </button>
          )}
          {mode === 'login' && (
            <>
              <button
                className="text-sm text-blue-500 hover:underline mr-4"
                onClick={() => setMode('register')}
              >
                Não tem conta? Cadastre‑se
              </button>
              <button
                className="text-sm text-gray-500 hover:underline"
                onClick={() => setMode('google')}
              >
                Voltar
              </button>
            </>
          )}
          {mode === 'register' && (
            <>
              <button
                className="text-sm text-blue-500 hover:underline mr-4"
                onClick={() => setMode('login')}
              >
                Já tem conta? Entrar
              </button>
              <button
                className="text-sm text-gray-500 hover:underline"
                onClick={() => setMode('google')}
              >
                Voltar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rodapé geral */}
      <p className="text-center text-sm text-gray-500 mt-8">
        © 2026 YourStreet – Transformando bairros juntos.
      </p>
    </div>
  );
}
