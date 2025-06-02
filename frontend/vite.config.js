// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // Ensure Vite serves on 127.0.0.1
    port: 5173,      // Your current dev port
    strictPort: true // Fail if port is already in use
  }
});