function attemptLoad(url: string, retries: number, delayMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.dataset.pluginUrl = url;
    script.onload = () => resolve();
    script.onerror = () => {
      document.head.removeChild(script);
      if (retries > 0) {
        setTimeout(() => attemptLoad(url, retries - 1, delayMs).then(resolve, reject), delayMs);
      } else {
        reject(new Error(`Failed to load plugin from ${url}`));
      }
    };
    document.head.appendChild(script);
  });
}

export function loadPluginScript(url: string): Promise<void> {
  const existing = document.querySelector(`script[data-plugin-url="${url}"]`);
  if (existing) return Promise.resolve();
  return attemptLoad(url, 5, 3000);
}
