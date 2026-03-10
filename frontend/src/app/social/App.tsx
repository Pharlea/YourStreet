import { RouterProvider } from 'react-router';
import { router } from './routes';

export default function SocialApp() {
  return <RouterProvider router={router} />;
}
