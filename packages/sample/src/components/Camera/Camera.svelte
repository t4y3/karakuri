<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { Scene } from './script/setup';
let canvasElement;
let paneElement;
const scene = new Scene();

onMount(() => {
  scene.init(canvasElement, paneElement)
});
onDestroy(() => {
  scene.destroy();
});
</script>

<canvas class="w-full h-full" bind:this="{canvasElement}"></canvas>
<div class="fixed right-8 top-8">
  <div bind:this={paneElement} ></div>
</div>