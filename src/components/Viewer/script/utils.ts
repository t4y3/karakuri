const loadImage = async (src) => {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.addEventListener('load', async () => {
      resolve(img);
    });
    img.src = src;
  });
};

export { loadImage }