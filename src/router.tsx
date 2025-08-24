import { createHashRouter } from 'react-router-dom';
import { RootLayout } from './ui/RootLayout';
import { HomePage } from './ui/pages/HomePage';
import { ProfilePage } from './ui/pages/ProfilePage';
import { GamePage } from './ui/pages/GamePage';
import { DictionaryPage } from './ui/pages/DictionaryPage';

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'game', element: <GamePage /> },
      { path: 'dictionary', element: <DictionaryPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
]);

