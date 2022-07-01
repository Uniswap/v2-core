import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.svg"],
  resolve: {
    alias: {
      "@": `${__dirname}/src/`,
    },
  },
});
