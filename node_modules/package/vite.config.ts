// vite.config.js (na sua aplicação React)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/app-react/', // Importante: define o caminho base
  build: {
    outDir: '../../PertCornerNext/petpage/public', // Diretório de saída direto para o Next.js
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    port: 3001,
  },
  // Configuração para lidar com assets
  assetsInclude: ['**/*.lottie', '**/*.ttf', '**/*.woff', '**/*.woff2'],
  optimizeDeps: {
    exclude: ['*.lottie', '*.ttf']
  },
  // Se estiver usando alguma lib específica para lottie
  define: {
    global: 'globalThis',
  }
})