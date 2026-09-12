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
  let viewer, timer, capabilityTimer, attempt = 0;
  const diagnostics = {
    userAgent: navigator.userAgent,
    platform: navigator.userAgentData?.platform || navigator.platform,
    android: /android/i.test(navigator.userAgent),
    ios: /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    deviceType: 'desktop',
    secureContext: window.isSecureContext,
    glbUrl: assetUrl('osh.glb'),
    usdzUrl: assetUrl('osh.usdz'),
    modelViewerRegistered: false, webgl2: false, loaded: false,
    canActivateAR: false, navigatorXR: !!navigator.xr,
    immersiveAR: 'unknown', arMode: 'not-selected',
    arStatus: 'not-presenting', arTracking: 'not-tracking',
    lastARError: null, lastARAttempt: null,
    visibilityAtARAttempt: null, visibilityChangesAfterARAttempt: []
  };
  diagnostics.deviceType = diagnostics.android ? 'android' : diagnostics.ios ? 'ios' : 'desktop';
  let debug, copyDiagnostics;
  if (new URLSearchParams(location.search).get('ar-debug') === '1') {
    const debugTools = document.createElement('section');
    debugTools.className = 'osh-debug-tools';
    debug = document.createElement('pre');
    debug.className = 'osh-ar-debug';
    copyDiagnostics = document.createElement('button');
    copyDiagnostics.type = 'button';
    copyDiagnostics.className = 'ghost-btn osh-copy-diagnostics';
    copyDiagnostics.textContent = 'Copy diagnostics';
    debugTools.append(debug, copyDiagnostics);
    dialog.append(debugTools);
  }
  const renderDebug = () => {
    if (debug) {
      const text = JSON.stringify(diagnostics, null, 2);
      if (debug.textContent !== text) debug.textContent = text;
    }
  };
  const copyReport = async () => {
    const report = debug?.textContent || JSON.stringify(diagnostics, null, 2);
    try {
      await navigator.clipboard.writeText(report);
      copyDiagnostics.textContent = 'Copied';
    } catch (error) {
      diagnostics.clipboardError = error?.message || String(error);
      console.error('[Qadam AR] copy diagnostics failed', error);
      renderDebug();
      copyDiagnostics.textContent = 'Copy failed';
    }
  };
  if (copyDiagnostics) copyDiagnostics.addEventListener('click', copyReport);
  const recordVisibility = () => {
    if (!diagnostics.lastARAttempt) return;
    diagnostics.visibilityChangesAfterARAttempt.push({
      state: document.visibilityState,
      timestamp: new Date().toISOString(),
      millisecondsAfterAttempt: Date.now() - Date.parse(diagnostics.lastARAttempt)
    });
    console.info('[Qadam AR] visibility', diagnostics.visibilityChangesAfterARAttempt.at(-1));
    renderDebug();
  };
  document.addEventListener('visibilitychange', recordVisibility);
  renderDebug();
  // Diagnostic only: Scene Viewer and Quick Look do not require WebXR.
  if (navigator.xr?.isSessionSupported) {
    navigator.xr.isSessionSupported('immersive-ar').then(supported => {
      diagnostics.immersiveAR = supported;
      renderDebug();
    }).catch(error => {
      diagnostics.immersiveAR = error.message;
      renderDebug();
    });
  } else diagnostics.immersiveAR = false;
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
    clearInterval(capabilityTimer);
    document.removeEventListener('visibilitychange', recordVisibility);
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
    clearInterval(capabilityTimer);
    viewer?.remove();
    diagnostics.loaded = false;
    diagnostics.canActivateAR = false;
    diagnostics.lastARError = null;
    diagnostics.lastARAttempt = null;
    diagnostics.visibilityAtARAttempt = null;
    diagnostics.visibilityChangesAfterARAttempt = [];
    diagnostics.arStatus = 'not-presenting';
    diagnostics.arTracking = 'not-tracking';
    diagnostics.arMode = 'not-selected';
    renderDebug();
    reset.disabled = true;
    retry.hidden = true;
    status.textContent = 'Загрузка 3D-модели…';
    const fail = error => {
      if (current !== attempt || !dialog.open) return;
      attempt++;
      modelRetry++;
      clearTimeout(timer);
      clearInterval(capabilityTimer);
      diagnostics.loaded = false;
      diagnostics.canActivateAR = false;
      diagnostics.loadError = error?.message || error?.detail?.type || 'Model load timed out';
      console.error('[Qadam 3D] error', diagnostics.loadError, error);
      renderDebug();
      viewer?.remove();
      reset.disabled = true;
      status.textContent = 'Не удалось загрузить 3D. Изображение блюда доступно; попробуйте ещё раз.';
      retry.hidden = false;
    };
    timer = setTimeout(fail, 60000);
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      diagnostics.webgl2 = !!gl;
      if (!gl) throw new Error('WebGL unavailable');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      await loadViewer();
      diagnostics.modelViewerRegistered = !!customElements.get('model-viewer');
      if (!diagnostics.modelViewerRegistered) throw new Error('model-viewer was not registered');
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
        'ar-scale': 'auto', loading: 'eager', reveal: 'auto'
      };
      Object.entries(attrs).forEach(([key, value]) => viewer.setAttribute(key, value));
      const ar = document.createElement('button');
      ar.type = 'button'; ar.slot = 'ar-button'; ar.className = 'osh-ar ghost-btn';
      ar.textContent = 'Посмотреть в AR';
      ar.disabled = true;
      const arFailure = error => {
        if (current !== attempt || !dialog.open) return;
        diagnostics.lastARError = error?.message || String(error);
        console.error('[Qadam AR] activation failed', error);
        status.textContent = 'AR не удалось открыть. Вы можете продолжить просмотр модели в 3D.';
        renderDebug();
      };
      ar.addEventListener('click', event => {
        // The slot container also launches AR. Handle the click once, here,
        // so rejected activations can be reported without losing the gesture.
        event.preventDefault();
        event.stopPropagation();
        if (!viewer.loaded || !viewer.canActivateAR) {
          status.textContent = 'AR недоступен на этом устройстве. Вы можете посмотреть модель в 3D.';
          return;
        }
        diagnostics.lastARError = null;
        diagnostics.lastARAttempt = new Date().toISOString();
        diagnostics.visibilityAtARAttempt = document.visibilityState;
        diagnostics.visibilityChangesAfterARAttempt = [];
        console.info('[Qadam AR] activate', { ...diagnostics });
        try {
          // No fetch, timer or await before this call.
          viewer.activateAR().catch(arFailure);
        } catch (error) { arFailure(error); }
        renderDebug();
      });
      viewer.append(ar);
      const refreshCapabilities = () => {
        if (current !== attempt || !dialog.open) return;
        const changed = diagnostics.canActivateAR !== viewer.canActivateAR;
        diagnostics.canActivateAR = viewer.canActivateAR;
        diagnostics.glbUrl = viewer.src;
        diagnostics.usdzUrl = viewer.getAttribute('ios-src');
        diagnostics.arMode = !viewer.canActivateAR ? 'none' : diagnostics.android
          ? (diagnostics.immersiveAR === true ? 'webxr' : 'scene-viewer (expected fallback)')
          : diagnostics.ios ? 'quick-look' : 'available mode managed by model-viewer';
        ar.disabled = !diagnostics.loaded || !viewer.canActivateAR;
        if (diagnostics.loaded && !diagnostics.lastARError &&
            diagnostics.arStatus === 'not-presenting') {
          const message = viewer.canActivateAR
            ? 'Модель готова. Можно посмотреть её в AR.'
            : 'AR недоступен на этом устройстве. Вы можете посмотреть модель в 3D.';
          if (status.textContent !== message) status.textContent = message;
        }
        if (changed) console.info('[Qadam AR] capabilities', { ...diagnostics });
        renderDebug();
      };
      // The default pan-target marker can intercept a touch at the exact
      // model centre even when invisible. This viewer only needs orbit/zoom.
      const panTarget = document.createElement('span');
      panTarget.slot = 'pan-target';
      panTarget.hidden = true;
      viewer.append(panTarget);
      viewer.addEventListener('load', () => {
        if (current !== attempt) return;
        clearTimeout(timer); reset.disabled = false;
        diagnostics.loaded = true;
        diagnostics.loadError = null;
        refreshCapabilities();
        console.info('[Qadam 3D] load', { ...diagnostics });
      });
      viewer.addEventListener('error', fail);
      viewer.addEventListener('ar-status', event => {
        if (current !== attempt) return;
        diagnostics.arStatus = event.detail.status;
        console.info('[Qadam AR] ar-status', event.detail.status);
        if (event.detail.status === 'failed') arFailure(new Error('AR session failed'));
        else if (event.detail.status === 'session-started') {
          status.textContent = 'Направьте камеру на стол или другую горизонтальную поверхность.';
        }
        refreshCapabilities();
      });
      viewer.addEventListener('ar-tracking', event => {
        if (current !== attempt) return;
        diagnostics.arTracking = event.detail.status;
        console.info('[Qadam AR] ar-tracking', event.detail.status);
        renderDebug();
      });
      stage.append(viewer);
      // AR mode selection is asynchronous and has no public readiness event.
      // Keep tracking it after load and native-app return; stop on close/retry.
      capabilityTimer = setInterval(refreshCapabilities, 500);
      refreshCapabilities();
    } catch (error) { fail(error); }
  }
  retry.onclick = start;
  dialog.showModal();
  start();
}
