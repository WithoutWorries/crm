const CACHE_PREFIX = 'reference-offline-'
const CACHE_NAME = `${CACHE_PREFIX}v3`
const KNOWLEDGE_SHELL = '/knowledge'
const STATIC_PATH_PREFIX = '/_next/static/'

function offlinePage(title, message, status = 503) {
  return new Response(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#17324d"><title>${title}</title><style>body{margin:0;background:#f4f6f8;color:#17324d;font:16px system-ui,-apple-system,sans-serif}main{max-width:34rem;margin:16vh auto;padding:2rem}h1{font-size:1.6rem;margin:0 0 .75rem}p{line-height:1.55;color:#526273}</style></head><body><main><h1>${title}</h1><p>${message}</p></main></body></html>`,
    {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}

async function cacheKnowledgeShell() {
  const cache = await caches.open(CACHE_NAME)
  const response = await fetch(KNOWLEDGE_SHELL, {
    credentials: 'include',
    cache: 'reload',
  })

  // A redirect to login must never become the offline application shell.
  if (!response.ok || new URL(response.url).pathname !== KNOWLEDGE_SHELL) return

  await cache.put(KNOWLEDGE_SHELL, response.clone())
  const html = await response.text()
  const assetPaths = new Set([
    '/reference-icon.png',
    ...Array.from(
      html.matchAll(/(?:src|href)=["'](\/_next\/static\/[^"'<> ]+)["']/g),
      (match) => match[1].replaceAll('&amp;', '&')
    ),
  ])

  await Promise.allSettled(
    Array.from(assetPaths, async (path) => {
      const assetResponse = await fetch(path, { cache: 'reload' })
      if (assetResponse.ok) await cache.put(path, assetResponse)
    })
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    cacheKnowledgeShell()
      .catch((error) => console.warn('[OFFLINE_SHELL_INSTALL]', error))
      .finally(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
              .map((key) => caches.delete(key))
          )
        ),
      self.clients.claim(),
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (url.pathname.startsWith(STATIC_PATH_PREFIX) || url.pathname === '/reference-icon.png') {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put(request, response.clone())
        }
        return response
      })
    )
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (
            response.ok &&
            url.pathname === KNOWLEDGE_SHELL &&
            new URL(response.url).pathname === KNOWLEDGE_SHELL
          ) {
            const cache = await caches.open(CACHE_NAME)
            await cache.put(KNOWLEDGE_SHELL, response.clone())
          }
          return response
        })
        .catch(async () => {
          if (url.pathname === '/login') {
            return offlinePage(
              'Reference is locked',
              'Reconnect to the internet to sign in. Any captures already saved on this device remain protected in the queue.'
            )
          }
          if (url.pathname !== KNOWLEDGE_SHELL) {
            return Response.redirect(KNOWLEDGE_SHELL, 302)
          }
          const cached = await caches.match(KNOWLEDGE_SHELL)
          if (cached) return cached
          return offlinePage(
            'Reference is offline',
            'Connect once while signed in to prepare offline capture on this device.'
          )
        })
    )
  }
})
