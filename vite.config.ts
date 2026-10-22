import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative assets allow the same build to work at /blog/ on GitHub Pages.
export default defineConfig({ plugins: [react()], base: './' });
