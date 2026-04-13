const scriptPromises = new Map();

export function loadScript(src) {
  if (scriptPromises.has(src)) {
    return scriptPromises.get(src);
  }

  const existingScript = document.querySelector(`script[data-src="${src}"]`);

  if (existingScript && existingScript.dataset.loaded === 'true') {
    const resolvedPromise = Promise.resolve();
    scriptPromises.set(src, resolvedPromise);
    return resolvedPromise;
  }

  const promise = new Promise((resolve, reject) => {
    const script = existingScript || document.createElement('script');

    if (!existingScript) {
      script.src = src;
      script.async = false;
      script.dataset.src = src;
      document.body.appendChild(script);
    }

    const onLoad = () => {
      script.dataset.loaded = 'true';
      resolve();
    };

    const onError = () => reject(new Error(`Failed to load ${src}`));

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
  });

  scriptPromises.set(src, promise);
  return promise;
}
