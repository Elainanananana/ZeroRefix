// nuxt.config.ts
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-01-15",
	devtools: { enabled: false },

	// 順序很重要：先載入 reset，再載入 tailwind（讓 Tailwind/你後續樣式覆蓋 reset）
	css: ["~/assets/css/reset.css", "~/assets/css/tailwind.css"],

	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
	},
	app: {
		head: {
			link: [
				{ rel: "preconnect", href: "https://fonts.googleapis.com" },
				{
					rel: "preconnect",
					href: "https://fonts.gstatic.com",
					crossorigin: "",
				},
				// 依你的 Google Fonts 選擇器更換下面 href。這裡示範 Inter 與 Noto Sans TC。
				{
					rel: "stylesheet",
					href: "https://fonts.googleapis.com/css2?family=Rubik+Glitch&display=swap",
				},
			],
		},
	},

	modules: ["@nuxt/image"],
});
