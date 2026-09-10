const button = document.getElementById('view-osh');
const message = document.getElementById('viewer-message');
button.addEventListener('click', async () => {
  button.disabled = true;
  message.hidden = true;
  try {
    const { openOshViewer } = await import('./viewer.js');
    openOshViewer(button);
  } catch (_) {
    message.textContent = 'Не удалось открыть 3D. Проверьте соединение и нажмите «Посмотреть» ещё раз.';
    message.hidden = false;
  } finally {
    button.disabled = false;
  }
});
