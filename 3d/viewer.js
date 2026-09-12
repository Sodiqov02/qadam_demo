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

export function mountModelViewer({ stage, status, reset, retry, debugHost, title, alt, glbUrl, usdzUrl }) {
  if (!stage || !status || !reset || !retry) throw new Error('Missing model viewer mount element');

  let viewer, loadTimer, capabilityTimer, attempt = 0;
  const diagnostics = {
    title,
    userAgent: navigator.userAgent,
    platform: navigator.userAgentData?.platform || navigator.platform,
    android: /android/i.test(navigator.userAgent),
    ios: /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    deviceType: 'desktop',
    secureContext: window.isSecureContext,
    glbUrl,
    usdzUrl,
    modelViewerRegistered: false,
    webgl2: false,
    loaded: false,
    canActivateAR: false,
    navigatorXR: !!navigator.xr,
    immersiveAR: 'unknown',
    arMode: 'not-selected',
    arStatus: 'not-presenting',
    arTracking: 'not-tracking',
    lastARError: null,
    lastARAttempt: null,
    visibilityAtARAttempt: null,
    visibilityChangesAfterARAttempt: []
  };
  diagnostics.deviceType = diagnostics.android ? 'android' : diagnostics.ios ? 'ios' : 'desktop';

  let debug, copyDiagnostics;
  if (debugHost && new URLSearchParams(location.search).get('ar-debug') === '1') {
    const tools = document.createElement('section');
    tools.className = 'debug-tools';
    debug = document.createElement('pre');
    debug.className = 'ar-debug';
    copyDiagnostics = document.createElement('button');
    copyDiagnostics.type = 'button';
    copyDiagnostics.className = 'secondary-button copy-diagnostics';
    copyDiagnostics.textContent = 'Copy diagnostics';
    tools.append(debug, copyDiagnostics);
    debugHost.append(tools);
  }

  const renderDebug = () => {
    if (!debug) return;
    const text = JSON.stringify(diagnostics, null, 2);
    if (debug.textContent !== text) debug.textContent = text;
  };
  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(debug.textContent);
      copyDiagnostics.textContent = 'Copied';
    } catch (error) {
      diagnostics.clipboardError = error?.message || String(error);
      console.error('[Qadam AR] copy diagnostics failed', error);
      copyDiagnostics.textContent = 'Copy failed';
      renderDebug();
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
  window.addEventListener('pagehide', () => clearInterval(capabilityTimer), { once: true });
  renderDebug();

  // Diagnostic only. Scene Viewer and Quick Look do not depend on navigator.xr.
  if (navigator.xr?.isSessionSupported) {
    navigator.xr.isSessionSupported('immersive-ar').then(supported => {
      diagnostics.immersiveAR = supported;
      renderDebug();
    }).catch(error => {
      diagnostics.immersiveAR = error?.message || String(error);
      renderDebug();
    });
  } else diagnostics.immersiveAR = false;

  reset.addEventListener('click', () => {
    if (!viewer) return;
    viewer.cameraOrbit = '25deg 45deg auto';
    viewer.cameraTarget = 'auto auto auto';
    viewer.fieldOfView = '30deg';
    viewer.jumpCameraToGoal();
  });

  async function start() {
    const current = ++attempt;
    clearTimeout(loadTimer);
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
    delete diagnostics.loadError;
    renderDebug();
    reset.disabled = true;
    retry.hidden = true;
    status.textContent = 'Загрузка 3D-модели…';

    const fail = error => {
      if (current !== attempt) return;
      attempt++;
      modelRetry++;
      clearTimeout(loadTimer);
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
    loadTimer = setTimeout(fail, 60000);

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      diagnostics.webgl2 = !!gl;
      if (!gl) throw new Error('WebGL unavailable');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      await loadViewer();
      diagnostics.modelViewerRegistered = !!customElements.get('model-viewer');
      if (!diagnostics.modelViewerRegistered) throw new Error('model-viewer was not registered');
      if (current !== attempt) return;

      viewer = document.createElement('model-viewer');
      const modelUrl = new URL(glbUrl);
      if (modelRetry) modelUrl.searchParams.set('retry', String(modelRetry));
      const attrs = {
        src: modelUrl.href,
        'ios-src': usdzUrl,
        alt,
        'camera-controls': '',
        'disable-pan': '',
        'camera-orbit': '25deg 45deg auto',
        'min-camera-orbit': 'auto 0deg 60%',
        'max-camera-orbit': 'auto 90deg 200%',
        'touch-action': 'none',
        'shadow-intensity': '0.5',
        exposure: '0.85',
        'environment-image': 'neutral',
        'interaction-prompt': 'auto',
        ar: '',
        'ar-modes': 'webxr scene-viewer quick-look',
        'ar-placement': 'floor',
        'ar-scale': 'auto',
        loading: 'eager',
        reveal: 'auto'
      };
      Object.entries(attrs).forEach(([key, value]) => viewer.setAttribute(key, value));

      const ar = document.createElement('button');
      ar.type = 'button';
      ar.slot = 'ar-button';
      ar.className = 'primary-button model-ar-button';
      ar.textContent = 'Посмотреть на своём столе';
      ar.disabled = true;

      const arFailure = error => {
        if (current !== attempt) return;
        diagnostics.lastARError = error?.message || String(error);
        console.error('[Qadam AR] activation failed', error);
        status.textContent = 'AR не удалось открыть. Вы можете продолжить просмотр модели в 3D.';
        renderDebug();
      };
      ar.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (!viewer.loaded || !viewer.canActivateAR) {
          status.textContent = 'AR недоступен на этом устройстве. Модель остаётся доступна в 3D.';
          return;
        }
        diagnostics.lastARError = null;
        diagnostics.lastARAttempt = new Date().toISOString();
        diagnostics.visibilityAtARAttempt = document.visibilityState;
        diagnostics.visibilityChangesAfterARAttempt = [];
        console.info('[Qadam AR] activate', { ...diagnostics });
        try {
          // Keep this call synchronous with the user gesture for Scene Viewer and Quick Look.
          viewer.activateAR().catch(arFailure);
        } catch (error) {
          arFailure(error);
        }
        renderDebug();
      });
      viewer.append(ar);

      const panTarget = document.createElement('span');
      panTarget.slot = 'pan-target';
      panTarget.hidden = true;
      viewer.append(panTarget);

      const refreshCapabilities = () => {
        if (current !== attempt) return;
        const changed = diagnostics.canActivateAR !== viewer.canActivateAR;
        diagnostics.canActivateAR = viewer.canActivateAR;
        diagnostics.glbUrl = viewer.src;
        diagnostics.usdzUrl = viewer.getAttribute('ios-src');
        diagnostics.arMode = !viewer.canActivateAR ? 'none' : diagnostics.android
          ? (diagnostics.immersiveAR === true ? 'webxr' : 'scene-viewer (expected fallback)')
          : diagnostics.ios ? 'quick-look' : 'available mode managed by model-viewer';
        ar.disabled = !diagnostics.loaded || !viewer.canActivateAR;
        if (diagnostics.loaded && !diagnostics.lastARError && diagnostics.arStatus === 'not-presenting') {
          const message = viewer.canActivateAR
            ? 'Модель готова. Можно посмотреть её на своём столе.'
            : 'Модель готова. AR доступен на совместимых смартфонах.';
          if (status.textContent !== message) status.textContent = message;
        }
        if (changed) console.info('[Qadam AR] capabilities', { ...diagnostics });
        renderDebug();
      };

      viewer.addEventListener('load', () => {
        if (current !== attempt) return;
        clearTimeout(loadTimer);
        reset.disabled = false;
        diagnostics.loaded = true;
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
      capabilityTimer = setInterval(refreshCapabilities, 500);
      refreshCapabilities();
    } catch (error) {
      fail(error);
    }
  }

  retry.addEventListener('click', start);
  start();
}
