# Astro starter

Astro starter with tailwind, alpine and i18n support.

### [🧑‍🚀 Astro website →](https://astro.build/)

### [🕮 Astro docs →](https://docs.astro.build/en/getting-started/)


## ✅ Features

- [x] Localization (with astro-i18next)
- [x] Light/Dark mode (provided by tailwind)
- [x] Discussion on articles (thanks to giscus)
- [x] Blog
- [x] CMS for editing blog post (thanks to decap CMS)
- [x] PWA (thanks to vite-pwa)

## ✍️ Admin dashboard

You can access the admin dashboard for editing blog post at `/admin`

For more information follow Decap CMS documentation at https://decapcms.org/docs/

In order to access the admin dashboard to change blog articles content you need to have access to the github repo, a quick way to test it test would be fork the repo and than configure decap cms accordingly to your cloud provider (netlify, cloudflare, vercel, etc...).

If you use cloudflare pages you can follow this guide https://github.com/i40west/netlify-cms-cloudflare-pages.

If you use netlify it's actually easier, you will need to change in the file `astro.config.mjs` NetlifyCMS config `config.backend.name` to git-gateway. (See https://decapcms.org/docs/git-gateway-backend/#git-gateway-with-netlify for more info)

<br/>

---

<p align="right"><a href="https://zank.studio" target="_blank">zank.studio</p>
