<script lang="ts">
import { onMount } from 'svelte';
import Tweakpane from 'tweakpane';
import { settings } from '../stores/settings';

let element;

onMount(() => {
  const Pane = new Tweakpane({ container: element });

  Pane.addInput({ fanCount: $settings.fanCount }, 'fanCount', {
    min: 4,
    max: 360,
    step: 1,
  }).on('change', (v) => {
    $settings.fanCount = v;
  });
});
</script>

<div bind:this="{element}"></div>
