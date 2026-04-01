export function loadPluginScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-plugin-url="${url}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.dataset.pluginUrl = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load plugin from ${url}`));
    document.head.appendChild(script);
  });
}
