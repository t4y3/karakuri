<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
import { Scene } from './script/setup';
let canvasElement;
let timelineElement;
const scene = new Scene();

onMount(() => {
  scene.init(canvasElement, timelineElement);
});
  onDestroy(() => {
    scene.destroy();
  });
</script>

<canvas class="w-full h-full" bind:this="{canvasElement}"></canvas>
<div class="fixed left-0 right-0 bottom-0 h-1/5">
  <div id="timeline" class="h-full" bind:this="{timelineElement}"></div>
</div>