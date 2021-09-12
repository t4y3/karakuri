<script lang="ts">
import { app } from './stores/app';
import Nav from './components/Nav.svelte';
// import Pane from './components/Pane.svelte';
import Viewer from './components/Viewer/Viewer.svelte';
import Introduction from './components/Introduction.svelte';

const handleRemove = () => {
  $app.file = null;
};
</script>

<main class="w-full h-full">
  {#if !$app.file}
    <Introduction />
  {:else}
    <Viewer class="w-full h-full" />
    <div class="fixed right-8 top-8 hidden md:block">
      <Nav></Nav>
    </div>
    <div class="fixed left-8 top-8 bg-gray-100 p-2 cursor-pointer rounded-full" on:click="{handleRemove}">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="w-8 text-gray-800">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    </div>
  {/if}
</main>
