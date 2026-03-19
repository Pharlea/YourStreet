import { useMemo } from "react";
import { RouterProvider } from "react-router";
import { createSocialRouter } from "./routes";

interface SocialAppProps {
  onLogout: () => Promise<void>;
}

export default function SocialApp({ onLogout }: SocialAppProps) {
  const router = useMemo(() => createSocialRouter(onLogout), [onLogout]);

  return <RouterProvider router={router} />;
}
