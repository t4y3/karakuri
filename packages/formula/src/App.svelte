<script lang="ts">
import Pane from './components/Pane.svelte';
import Viewer from './components/Viewer/Viewer.svelte';
</script>

<main class="w-full h-full">
  <Viewer class="w-full h-full" />
  		<div class="fixed right-8 top-8">
  			<Pane></Pane>
  		</div>
</main>
