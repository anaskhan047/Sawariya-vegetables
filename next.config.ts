// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
   buildExcludes: [/app-build-manifest\.json$/, /middleware-manifest\.json$/, /react-loadable-manifest\.json$/],
});

module.exports = withPWA({
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // allow all external images
      },
    ],
  },

  // You can add more config options here if needed
});
