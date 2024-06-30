import { defineConfig } from 'vitest/config'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'

export default defineConfig({
	plugins: [react(), vanillaExtractPlugin()],
	test: {
		globals: true,
		environment: 'jsdom',
		setupFiles: './src/__tests__/setupTests.ts',
	},
})
