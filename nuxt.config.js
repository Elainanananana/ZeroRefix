// nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-15',
  devtools: { enabled: false },

  // 順序很重要：先載入 reset，再載入 tailwind（讓 Tailwind/你後續樣式覆蓋 reset）
  css: [
    '~/assets/css/reset.css',
    '~/assets/css/tailwind.css'
  ],

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  }
})

