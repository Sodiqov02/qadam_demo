import { mountModelViewer } from '../viewer.js';

const pageUrl = name => new URL(`../assets/${name}`, import.meta.url).href;

mountModelViewer({
  stage: document.getElementById('model-stage'),
  status: document.getElementById('model-status'),
  reset: document.getElementById('reset-view'),
  retry: document.getElementById('retry-model'),
  debugHost: document.getElementById('debug-host'),
  title: 'Demo Fruits',
  alt: '3D-модель фруктовой композиции',
  glbUrl: pageUrl('fruits-clean-v2.glb'),
  arModes: 'webxr scene-viewer'
});
