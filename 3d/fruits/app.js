import { mountModelViewer } from '../viewer.js?v=20261115-ar2';

const pageUrl = name => new URL(`../assets/${name}`, import.meta.url).href;

mountModelViewer({
  stage: document.getElementById('model-stage'),
  status: document.getElementById('model-status'),
  reset: document.getElementById('reset-view'),
  retry: document.getElementById('retry-model'),
  debugHost: document.getElementById('debug-host'),
  title: 'Фруктовая тарелка',
  alt: '3D-модель фруктовой композиции',
  glbUrl: pageUrl('fruits-real-v1.glb'),
  arModes: 'webxr scene-viewer',
  cameraOrbit: '25deg 45deg auto',
  exposure: 0.95,
  shadowIntensity: 0.35,
  shadowSoftness: 1
});
