import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Для GitHub Pages: заменить base ниже на '/<repo-name>/' если репозиторий не user/organization page
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'pages' || process.env.GITHUB_PAGES === 'true' ? '/language-assistant/' : '/',
}));


