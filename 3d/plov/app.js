import { mountModelViewer } from '../viewer.js?v=20261115-ar3';

const pageUrl = name => new URL(`../assets/${name}`, import.meta.url).href;

mountModelViewer({
  stage: document.getElementById('model-stage'),
  arHost: document.getElementById('ar-actions'),
  status: document.getElementById('model-status'),
  reset: document.getElementById('reset-view'),
  retry: document.getElementById('retry-model'),
  debugHost: document.getElementById('debug-host'),
  title: 'Плов',
  alt: 'Фотограмметрическая 3D-модель тарелки плова',
  glbUrl: pageUrl('osh.glb'),
  usdzUrl: pageUrl('osh.usdz')
});
