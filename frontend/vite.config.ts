import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "src/assets"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Ensure CSS is properly extracted and chunked
    cssCodeSplit: true,
    // Generate source maps for debugging
    sourcemap: false,
    // Optimize build for production
    minify: 'terser',
    rollupOptions: {
      output: {
        // Better chunking for CSS and JS
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5000')
  },
  // Ensure proper base path for deployment
  base: './',
  css: {
    // Ensure PostCSS processes Tailwind correctly
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ]
    }
  }
});
