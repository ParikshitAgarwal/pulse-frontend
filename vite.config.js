import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { config } from './src/config'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': config.API_URL,
      '/socket.io': {
        target: config.SOCKET_URL,
        ws: true
      }
    }
  }
})