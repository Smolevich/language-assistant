import { createHashRouter } from 'react-router-dom';
import { RootLayout } from './ui/RootLayout';
import { HomePage } from './ui/pages/HomePage';
import { ProfilePage } from './ui/pages/ProfilePage';
import { GamePage } from './ui/pages/GamePage';

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'game', element: <GamePage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);


