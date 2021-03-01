<script lang="ts">
import { onMount } from 'svelte';
import Tweakpane from 'tweakpane';
import { settings } from '../stores/settings';

let element;

onMount(() => {
  const Pane = new Tweakpane({ container: element });

  Pane.addInput({ bucketsCount: $settings.bucketsCount }, 'bucketsCount', {
    min: 1,
    max: 128,
    step: 1,
  }).on('change', (v) => {
    $settings.bucketsCount = v;
  });
});
</script>

<div bind:this="{element}"></div>
