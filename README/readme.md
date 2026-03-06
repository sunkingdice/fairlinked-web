# BrowserGate — Technical Brief

## Infrastructure

- **Server:** Hetzner CX22, Ubuntu 24.04, Nuremberg (nbg1)
- **IP:** 89.167.112.105 / 2a01:4f9:c014:df6::1
- **SSH:** `ssh bg-web` (User: deploy, key auth only, root login disabled)
- **Domain:** browsergate.eu (DNS at INWX: ns.inwx.de, ns2.inwx.de, ns3.inwx.eu)
- **Firewall:** ufw — ports 22, 80, 443 only
- **Repo:** git@github.com:sunkingdice/browsergate-web.git
- **Server path:** ~/browsergate/site (cloned from GitHub via deploy key)

## Stack

- **Hugo** — static site generator (extended edition, v0.157.0)
- **Svelte 5** — interactive components compiled as islands
- **Vite** — builds Svelte islands into static JS bundles
- **Caddy** — web server, auto TLS, will reverse proxy SvelteKit later
- **SvelteKit + adapter-node** — complaint app (TODO, will run on port 3000)
- **Pingen API** — sends physical complaint letters via Deutsche Post (€0.86/letter)
- **Stripe** — payment processing (€5/complaint)
- **Claude API** — generates complaint letter text

## Project Structure

```
browsergate/
├── archetypes/
├── content/
├── layouts/
│   └── index.html              # Main template, mounts Svelte islands
├── static/
│   └── js/islands/
│       └── logo-carousel.js    # Compiled Svelte bundle (built from svelte-islands/)
├── svelte-islands/             # Svelte source (NOT deployed, build output goes to static/)
│   ├── src/
│   │   ├── LogoCarousel.svelte
│   │   └── logo-carousel-entry.js
│   ├── vite.config.js
│   ├── svelte.config.js
│   └── package.json
├── hugo.toml
└── .gitignore
```

## Svelte Islands Pattern

Components are standalone Svelte 5 apps compiled by Vite into `static/js/islands/`. CSS is injected (no separate CSS files). Each island has:

1. A `.svelte` component in `svelte-islands/src/`
2. An entry file that imports and mounts it: `mount(Component, { target: document.getElementById('...') })`
3. A `<div id="...">` + `<script type="module">` in the Hugo template

Build: `cd svelte-islands && npx vite build` → outputs to `static/js/islands/`

Vite config uses `svelte.config.js` with `compilerOptions: { css: 'injected' }` (CommonJS, no "type": "module" in package.json).

## Deploy

```bash
# On Mac
git push

# On server (ssh bg-web)
cd ~/browsergate/site
git pull
hugo --minify
```

## Caddy Config (/etc/caddy/Caddyfile)

```caddyfile
browsergate.eu {
    root * /home/deploy/browsergate/site/public
    file_server
    encode gzip zstd
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
    }
}

www.browsergate.eu {
    redir https://browsergate.eu{uri} permanent
}
```

When SvelteKit complaint app is added, Caddy gets:

```caddyfile
handle /complain* {
    reverse_proxy localhost:3000
}
```

## TODO

- SvelteKit complaint app (/complain): form → Claude API → PDF → Pingen → Stripe
- Bunny CDN in front of Caddy
- Logo SVG variants (uncovered, unhinged, uncontrolled, unauthorized)
- Systemd service for SvelteKit app

## Email (Migadu)

- **Domain:** browsergate.org
- **Account:** admin@browsergate.org
- **Webmail:** https://webmail.migadu.com

| Service | Server | Port | Security |
|---------|--------|------|----------|
| IMAP | imap.migadu.com | 993 | TLS |
| SMTP | smtp.migadu.com | 465 | TLS |
| SMTP (alt) | smtp.migadu.com | 587 | StartTLS |
| POP3 | pop.migadu.com | 995 | TLS |
| ManageSieve | imap.migadu.com | 4190 | StartTLS |

All services use password auth with `admin@browsergate.org` as username. Password stored separately (not in repo).

For the contact form, use SMTP on port 465 (TLS).

## Notes

- Ubuntu 24.04 SSH service is `ssh`, not `sshd`
- Caddy runs as user `caddy` — home dirs need chmod 755
- TLS will auto-provision once DNS delegation is working
