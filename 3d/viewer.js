const assetUrl = name => new URL('./assets/' + name, import.meta.url).href;
let library;
let modelRetry = 0;
function loadViewer() {
  if (!library) {
    library = import('./vendor/model-viewer-4.3.1.min.js').catch(error => {
      library = null;
      throw error;
    });
  }
  return library;
}

export function openOshViewer(trigger) {
  if (document.querySelector('.osh-dialog')) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'osh-dialog';
  dialog.setAttribute('aria-labelledby', 'osh-viewer-title');
  dialog.innerHTML = `
    <header class="osh-header"><h2 id="osh-viewer-title">Osh · 3D</h2>
      <button type="button" class="ghost-btn osh-close" aria-label="Закрыть просмотр">✕</button></header>
    <div class="osh-stage"><img class="osh-fallback" src="${assetUrl('preview.webp')}" alt="Тарелка плова" /></div>
    <p class="osh-status" role="status" aria-live="polite">Загрузка 3D-модели…</p>
    <footer class="osh-footer"><span>Вращайте мышью или пальцем. Приближайте колёсиком или двумя пальцами.</span>
      <button type="button" class="ghost-btn osh-reset" disabled>Сбросить вид</button>
      <button type="button" class="ghost-btn osh-retry" hidden>Повторить</button></footer>`;
  document.body.append(dialog);
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  const stage = dialog.querySelector('.osh-stage');
  const status = dialog.querySelector('.osh-status');
  const reset = dialog.querySelector('.osh-reset');
  const retry = dialog.querySelector('.osh-retry');
  let viewer, timer, attempt = 0;
  dialog.querySelector('.osh-close').onclick = () => dialog.close();
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    attempt++;
    clearTimeout(timer);
    viewer?.remove();
    dialog.remove();
    document.body.style.overflow = previousOverflow;
    trigger?.focus();
  }, {once: true});
  reset.onclick = () => {
    viewer.cameraOrbit = '25deg 45deg auto';
    viewer.cameraTarget = 'auto auto auto';
    viewer.fieldOfView = '30deg';
    viewer.jumpCameraToGoal();
  };
  async function start() {
    const current = ++attempt;
    clearTimeout(timer);
    viewer?.remove();
    reset.disabled = true;
    retry.hidden = true;
    status.textContent = 'Загрузка 3D-модели…';
    const fail = () => {
      if (current !== attempt || !dialog.open) return;
      attempt++;
      modelRetry++;
      clearTimeout(timer);
      viewer?.remove();
      reset.disabled = true;
      status.textContent = 'Не удалось загрузить 3D. Изображение блюда доступно; попробуйте ещё раз.';
      retry.hidden = false;
    };
    timer = setTimeout(fail, 60000);
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      if (!gl) throw new Error('WebGL unavailable');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      await loadViewer();
      if (current !== attempt || !dialog.open) return;
      viewer = document.createElement('model-viewer');
      const attrs = {
        // model-viewer caches rejected loads by URL; retry needs a fresh key.
        src: assetUrl('osh.glb') + (modelRetry ? `?retry=${modelRetry}` : ''),
        'ios-src': assetUrl('osh.usdz'),
        alt: 'Фотограмметрическая модель тарелки плова',
        'camera-controls': '', 'disable-pan': '', 'camera-orbit': '25deg 45deg auto',
        'min-camera-orbit': 'auto 0deg 60%', 'max-camera-orbit': 'auto 90deg 200%',
        'touch-action': 'none', 'shadow-intensity': '0.5', exposure: '0.85',
        'environment-image': 'neutral', 'interaction-prompt': 'none',
        ar: '', 'ar-modes': 'webxr scene-viewer quick-look', 'ar-placement': 'floor',
        'ar-scale': 'fixed', loading: 'eager', reveal: 'auto'
      };
      Object.entries(attrs).forEach(([key, value]) => viewer.setAttribute(key, value));
      const ar = document.createElement('button');
      ar.type = 'button'; ar.slot = 'ar-button'; ar.className = 'osh-ar ghost-btn';
      ar.textContent = 'Посмотреть в AR';
      viewer.append(ar);
      // The default pan-target marker can intercept a touch at the exact
      // model centre even when invisible. This viewer only needs orbit/zoom.
      const panTarget = document.createElement('span');
      panTarget.slot = 'pan-target';
      panTarget.hidden = true;
      viewer.append(panTarget);
      viewer.addEventListener('load', () => {
        if (current !== attempt) return;
        clearTimeout(timer); reset.disabled = false;
        status.textContent = viewer.canActivateAR ? 'Модель готова. Можно посмотреть её в AR.' : 'Модель готова. AR доступен на совместимых телефонах через HTTPS.';
      });
      viewer.addEventListener('error', fail);
      viewer.addEventListener('ar-status', event => {
        if (event.detail.status === 'failed') status.textContent = 'AR не удалось открыть. Продолжайте просмотр в 3D.';
      });
      stage.append(viewer);
    } catch (_) { fail(); }
  }
  retry.onclick = start;
  dialog.showModal();
  start();
}
