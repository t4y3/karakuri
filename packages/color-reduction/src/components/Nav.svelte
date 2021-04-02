<script>
import { steps } from '../stores/steps';
</script>

<nav aria-label="Progress" class="max-w-sm">
  <ol class="overflow-hidden">
    {#each $steps.steps as item, i}
      <li class="relative pb-10" class:pb-10="{ i < $steps.steps.length - 1 }">
        {#if i < $steps.steps.length - 1}
          <div class="-ml-px absolute mt-0.5 top-4 left-4 w-0.5 h-full bg-gray-600" aria-hidden="true"></div>
        {/if}
        <!-- Complete Step -->
        <div class="relative flex items-start group">
          {#if i < $steps.current}
            <span class="h-9 flex items-center">
              <span
                class="relative z-10 w-8 h-8 flex items-center justify-center bg-gray-600 rounded-full group-hover:bg-gray-800">
                <!-- Heroicon name: check -->
                <svg
                  class="w-5 h-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true">
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"></path>
                </svg>
              </span>
            </span>
          {/if}
          {#if i === $steps.current}
            <span class="h-9 flex items-center" aria-hidden="true">
              <span
                class="relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-600 rounded-full">
                <span class="h-2.5 w-2.5 bg-gray-600 rounded-full"></span>
              </span>
            </span>
          {/if}
          {#if $steps.current < i}
            <span class="h-9 flex items-center" aria-hidden="true">
              <span
                class="relative z-10 w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full group-hover:border-gray-400">
                <span class="h-2.5 w-2.5 bg-transparent rounded-full group-hover:bg-gray-300"></span>
              </span>
            </span>
          {/if}
          <span class="ml-4 min-w-0 flex flex-col space-y-1">
            <span class="text-xs font-semibold uppercase tracking-wide text-gray-300">{item.title}</span>
            {#each item.list as children, j}
              <span class="text-sm text-gray-500">{children}</span>
            {/each}
          </span>
        </div>
      </li>
    {/each}
  </ol>
</nav>
