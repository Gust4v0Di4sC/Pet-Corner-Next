import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function getPackageName(id: string): string | null {
  const nodeModulePath = id.split("node_modules/").at(-1);
  if (!nodeModulePath) {
    return null;
  }

  const pathParts = nodeModulePath.split("/");
  if (pathParts[0]?.startsWith("@")) {
    return pathParts.length > 1 ? `${pathParts[0]}/${pathParts[1]}` : null;
  }

  return pathParts[0] ?? null;
}

function getVendorChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  const packageName = getPackageName(id);
  if (!packageName) {
    return "vendor";
  }

  if (
    packageName === "react" ||
    packageName === "react-dom" ||
    packageName === "scheduler" ||
    packageName === "use-sync-external-store"
  ) {
    return "vendor-react";
  }

  if (packageName === "react-router" || packageName === "react-router-dom" || packageName === "@remix-run/router") {
    return "vendor-router";
  }

  if (packageName === "firebase" || packageName.startsWith("@firebase/")) {
    return "vendor-firebase";
  }

  if (packageName.startsWith("@tanstack/")) {
    return "vendor-query";
  }

  if (
    packageName === "@mui/x-charts" ||
    packageName.startsWith("d3-") ||
    packageName === "internmap" ||
    packageName === "robust-predicates"
  ) {
    return "vendor-charts";
  }

  if (packageName.startsWith("@mui/") || packageName.startsWith("@emotion/")) {
    return "vendor-ui";
  }

  if (
    packageName === "react-hook-form" ||
    packageName === "@hookform/resolvers" ||
    packageName === "zod"
  ) {
    return "vendor-form-core";
  }

  if (packageName === "react-datepicker" || packageName === "react-imask") {
    return "vendor-form-widgets";
  }

  if (
    packageName === "@lottiefiles/dotlottie-react" ||
    packageName === "@lottiefiles/dotlottie-web" ||
    packageName === "react-tooltip"
  ) {
    return "vendor-widgets";
  }

  if (
    packageName === "xlsx" ||
    packageName === "cfb" ||
    packageName === "codepage" ||
    packageName === "crc-32" ||
    packageName === "adler-32" ||
    packageName === "ssf" ||
    packageName === "wmf"
  ) {
    return "vendor-xlsx";
  }

  return "vendor";
}

export default defineConfig({
  plugins: [react()],
  base: "/app-react/",
  build: {
    outDir: resolve(__dirname, "../petpage/public/app-react"),
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: getVendorChunk,
      },
    },
  },
  server: {
    port: 3001,
  },
  assetsInclude: ["**/*.lottie", "**/*.ttf", "**/*.woff", "**/*.woff2"],
  define: {
    global: "globalThis",
  },
});
