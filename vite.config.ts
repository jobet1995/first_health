import { defineConfig } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // Base public path when served in development or production
  base: '/static/',

  // Build configuration
  build: {
    // Output directory for production build
    outDir: 'static/dist',
    
    // Generate manifest for Django integration
    manifest: true,
    
    // Emit assets to the output directory
    emptyOutDir: true,
    
    // Rollup options
    rollupOptions: {
      // Entry points for your application
      input: {
        main: path.resolve(__dirname, 'static/src/main.ts'),
        styles: path.resolve(__dirname, 'static/src/styles/main.css'),
      },
      output: {
        // Asset file naming
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Source map generation
    sourcemap: true,
    
    // Target modern browsers
    target: 'es2015',
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    } as any,
  },

  // Development server configuration
  server: {
    // Port for Vite dev server
    port: 5173,
    
    // Open browser on server start
    open: false,
    
    // Enable CORS for Django integration
    cors: true,
    
    // Proxy API requests to Django dev server
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    
    // Watch options
    watch: {
      usePolling: true,
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './static/src'),
      '@components': path.resolve(__dirname, './static/src/components'),
      '@styles': path.resolve(__dirname, './static/src/styles'),
      '@utils': path.resolve(__dirname, './static/src/utils'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css'],
  },

  // CSS configuration
  css: {
    postcss: './postcss.config.mjs',
    devSourcemap: true,
  },

  // Plugin configuration
  plugins: [],

  // Optimize dependencies
  optimizeDeps: {
    include: [],
    exclude: [],
  },
})
