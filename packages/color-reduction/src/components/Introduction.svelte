<script lang="ts">
import { onMount } from 'svelte';
import { app } from '../stores/app';

onMount(() => {
  const uploadArea = document.getElementById('upload-area');

  uploadArea.addEventListener('change', (e) => {
    changeHandler({
      e,
      data: undefined,
      callback: (image) => {
        $app.file = image;
      },
    });
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    changeHandler({
      e,
      data: e.dataTransfer.files[0],
      callback: (image) => {
        $app.file = image;
      },
    });
  });
  uploadArea.addEventListener('dragenter', (e) => {
    e.preventDefault();
  });
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
  });

  const changeHandler = ({ e, data, callback }) => {
    // drag and dropの場合は e.dataTransfer.files[0] を使用
    let file = data === undefined ? e.target.files[0] : data;

    // 拡張子チェック
    if (!file.type.match(/^image\/(png|jpg|jpeg|gif)$/)) {
      return;
    }

    // 容量チェック(5MB)
    if (10 * 1024 * 1024 <= file.size) {
      return;
    }

    let image = new Image();
    let fileReader = new FileReader();

    fileReader.onload = (e) => {
      let base64 = e.target.result;

      image.onload = () => {
        callback(image);
      };
      image.src = base64;
    };

    fileReader.readAsDataURL(file);
  };
});

const handleSelect = (e) => {
  $app.file = e.currentTarget;
};
</script>

<!-- This example requires Tailwind CSS v2.0+ -->

<div class="h-full flex flex-col">
  <!-- Hero card -->
  <div class="relative flex-grow">
    <div class="w-full h-full">
      <div id="upload-area"  class="h-full flex flex-col justify-center relative shadow-lg sm:overflow-hidden">
        <div class="absolute inset-0">
          <div class="h-full w-full bg-gray-100"></div>
        </div>
        <div class="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
          <h1 class="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            <span class="block text-gray-800">Visualize color reduction</span>
            <span class="block text-gray-500">Any image you like.</span>
          </h1>
          <p class="mt-6 max-w-lg mx-auto text-center text-xl text-gray-500 sm:max-w-4xl">
            The logic of color reduction is difficult.
            I hope that visualizing it will help you understand it.
            Implemented with reference to Median cut.
            It is implemented using webgl.<br>
            Sorry, maybe only chrome is supported.
          </p>

          <div id="upload" class="px-4 py-8 sm:px-0">
            <form action="">
              <div class="sm:mt-0 sm:col-span-2">
                <div class="text-center">
                  <svg class="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"></path>
                  </svg>
                  <p class="mt-1 text-sm text-gray-500">
                    <label
                      id="original-image-label"
                      for="original-image-file"
                      class="cursor-pointer font-medium text-pink-600 hover:text-pink-500 focus:outline-none focus:underline transition duration-150 ease-in-out">
                      Upload a file
                      <input type="file" id="original-image-file" class="hidden" />
                    </label>
                    or drag and drop
                  </p>
                  <p class="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Logo cloud -->
  <div class="bg-gray-100">
    <div class="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <p class="text-center text-sm font-semibold uppercase text-gray-500 tracking-wide">Or try one of these:</p>
      <div class="mt-6 grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5">
        <div class="col-span-1 flex flex-col justify-start md:col-span-2 lg:col-span-1">
          <img src="./assets/bison.jpg" alt="" class="cursor-pointer" on:click="{handleSelect}" />
          <span
            >Photo by <a
              href="https://unsplash.com/@vincentledvina?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
              >Vincent Ledvina</a>
            on
            <a
              href="https://unsplash.com/s/visual/4050ed5c-59f1-4b72-965f-8d82efcfbc94?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
              >Unsplash</a
            ></span>
        </div>
        <div class="col-span-1 flex flex-col justify-start md:col-span-2 lg:col-span-1">
          <img src="./assets/colorful.jpg" alt="" class="cursor-pointer" on:click="{handleSelect}" />
          <span
            >Photo by <a
              href="https://unsplash.com/@greysonjoralemon?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
              >Greyson Joralemon</a>
            on
            <a
              href="https://unsplash.com/s/photos/colorful?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
              >Unsplash</a
            ></span>
        </div>
        <div class="col-span-1 flex flex-col justify-start md:col-span-2 lg:col-span-1">
          <img src="./assets/shibuya.jpg" alt="" class="cursor-pointer" on:click="{handleSelect}" />
          <span
            >Photo by <a
              href="https://unsplash.com/@jezael?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
              >Jezael Melgoza</a>
            on
            <a
              href="https://unsplash.com/s/photos/japan?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
              >Unsplash</a
            ></span>
        </div>
        <div class="col-span-1 flex flex-col justify-start md:col-span-2 lg:col-span-1">
          <img src="./assets/telephone_booth.jpg" alt="" class="cursor-pointer" on:click="{handleSelect}" />
          <span
            >Photo by <a
              href="https://unsplash.com/@jannerboy62?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
              >Nick Fewings</a>
            on
            <a
              href="https://unsplash.com/s/photos/red?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText"
              >Unsplash</a
            ></span>
        </div>
        <div class="col-span-1 flex flex-col justify-start md:col-span-2 lg:col-span-1">
          <img src="./assets/pineapple.jpg" alt="" class="cursor-pointer" on:click="{handleSelect}" />
        </div>
      </div>
    </div>
  </div>
</div>
