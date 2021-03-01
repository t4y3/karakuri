<script lang="ts">
import { onMount } from 'svelte';
import { setup } from './script/script';
let canvasElement;

onMount(() => {
  setup(canvasElement);
});
</script>

<canvas class="w-full h-full" bind:this="{canvasElement}"></canvas>
