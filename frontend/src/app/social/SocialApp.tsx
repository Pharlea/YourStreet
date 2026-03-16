import { RouterProvider } from "react-router";
import { createSocialRouter } from "./routes";

interface SocialAppProps {
  onLogout: () => Promise<void>;
}

export default function SocialApp({ onLogout }: SocialAppProps) {
  return <RouterProvider router={createSocialRouter(onLogout)} />;
}
