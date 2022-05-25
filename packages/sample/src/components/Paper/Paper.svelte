<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import Crane from './svgs/crane.svelte';
import Cross from './svgs/cross.svelte';
import Cross02 from './svgs/cross02.svelte';
import Cross03 from './svgs/cross03.svelte';
import Cross04 from './svgs/cross04.svelte';
import { Scene } from './script/setup';
import { generatePolygons } from './script/main';
import {  getPointsFromLine} from './script/svg';

let canvasElement;
let paneElement;
let svgElement;
const scene = new Scene();

onMount(() => {
  const list = generatePolygons(svgElement);
  scene.init(canvasElement, paneElement, list[0]);
  // list[0].onLineClick((line: SVGLineElement) => {
  //   updateGeometry(getPointsFromLine(line));
  // });
});
onDestroy(() => {
  scene.destroy();
});
</script>

<div class="w-full h-full flex">
  <div class="w-1/3 p-20 space-y-4" bind:this="{svgElement}">
    <div class="wrapper flex space-x-2 rotate-x-180">
      <Crane />
    </div>
<!--    <div class="wrapper flex space-x-2">-->
<!--      <Cross />-->
<!--    </div>-->
    <!--    <div class="wrapper flex space-x-2">-->
    <!--      <Cross02 />-->
    <!--    </div>-->
    <!--    <div class="wrapper flex space-x-2">-->
    <!--      <Cross03 />-->
    <!--    </div>-->
    <!--    <div class="wrapper flex space-x-2">-->
    <!--      <Cross04 />-->
    <!--    </div>-->
    <div class="triangles relative grid grid-cols-6 gap-4 rotate-x-180"></div>
  </div>
  <div class="w-2/3">
    <canvas class="w-full h-full" bind:this="{canvasElement}"></canvas>
  </div>
</div>

<div class="fixed right-8 top-8">
  <div bind:this="{paneElement}"></div>
</div>
