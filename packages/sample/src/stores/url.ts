// @see https://svelte.dev/repl/5abaac000b164aa1aacc6051d5c4f584?version=3.38.2
import { derived, writable } from 'svelte/store'


const href = writable(window.location.href)

const URL = window.URL;

const originalPushState = history.pushState
const originalReplaceState = history.replaceState

const updateHref = () => href.set(window.location.href)

history.pushState = function () {
  originalPushState.apply(this, arguments)
  updateHref()
}

history.replaceState = function () {
  originalReplaceState.apply(this, arguments)
  updateHref()
}

window.addEventListener('popstate', updateHref)
window.addEventListener('hashchange', updateHref)

export default {
  subscribe: derived(href, ($href) => new URL($href)).subscribe,
  ssrSet: (urlHref) => href.set(urlHref),
}
