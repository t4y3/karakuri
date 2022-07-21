const loadImage = async (src): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.addEventListener('load', async () => {
      resolve(img);
    });
    img.src = src;
  });
};

export { loadImage }