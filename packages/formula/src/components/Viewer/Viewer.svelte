<script lang="ts">
import { onMount } from 'svelte';
import { setup } from './script/setup';
let canvasElement;

onMount(() => {
  setup(canvasElement);
});
</script>

<canvas class="w-full h-full" bind:this="{canvasElement}"></canvas>
