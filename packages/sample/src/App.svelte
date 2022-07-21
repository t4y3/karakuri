<script lang="ts">
import Camera from './components/Camera/Camera.svelte';
import Light from './components/Light/Light.svelte';
import LightAmbient from './components/LightAmbient/LightAmbient.svelte';
import Picking from './components/Picking/Picking.svelte';
import Paper from './components/Paper/Paper.svelte';
import url from './stores/url';

const pages = {
  camera: {
    hash: '#camera',
    component: Camera,
    description: 'OrbitControls',
  },
  light: {
    hash: '#light',
    component: Light,
    description: 'Phong reflection model',
  },
  lightAmbient: {
    hash: '#lightAmbient',
    component: LightAmbient,
    description: 'Ambient',
  },
  picking: {
    hash: '#picking',
    component: Picking,
    description: '...',
  },
  paper: {
    hash: '#paper',
    component: Paper,
    description: '...',
  },
};
const pageList = Object.values(pages);
</script>

<main class="w-full h-full">
  {#if !$url.hash}
    <div class="max-w-7xl mx-auto p-8">
      <div class="max-w-3xl mx-auto">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {#each pageList as page, i}
            <div
              class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
              <div class="flex-1 min-w-0">
                <a href="{page.hash}" class="focus:outline-none">
                  <span class="absolute inset-0" aria-hidden="true"></span>
                  <span class="text-sm font-medium text-gray-900">{page.hash}</span>
                  {#if page.description}
                    <p class="text-sm text-gray-500 truncate">{page.description}</p>
                  {/if}
                </a>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
  {#if !!$url.hash}
    <svelte:component this="{pages[$url.hash.replace('#', '')].component}" />
  {/if}
</main>
