(() => {
  const words = {
    'Плов': ['Palov', 'Pilaf'],
    'Фруктовая тарелка': ['Mevali likopcha', 'Fruit platter'],
    '← Все модели': ['← Barcha taomlar', '← All dishes'],
    'Демонстрационный каталог': ['3D menyu', '3D menu'],
    'Qadam 3D / AR Demo': ['Taomlarni 3D ko‘rinishda ko‘ring', 'Explore dishes in 3D'],
    'Посмотрите, как блюда могут выглядеть в цифровом меню и прямо на столе гостя.': ['Taomlarni har tomondan ko‘ring yoki stolingizga AR orqali joylashtiring.', 'Explore each dish or place it on your table in AR.'],
    'Доступно в 3D и AR': ['3D va AR', '3D and AR'],
    'Доступно в 3D и Android AR': ['3D va AR', '3D and AR'],
    'Посмотреть': ['Ko‘rish', 'View'],
    'Посмотреть блюдо в 3D и на своём столе': ['Taomni 3D ko‘rinishda va stolingizda ko‘ring', 'View the dish in 3D and on your table'],
    'Посмотреть композицию в 3D и на своём столе': ['Mevali likopchani 3D ko‘rinishda ko‘ring', 'Explore the fruit platter in 3D'],
    'Поверните блюдо пальцем, приблизьте детали или примерьте его на своём столе.': ['Barmog‘ingiz bilan aylantiring, yaqinlashtiring yoki stolingizda ko‘ring.', 'Rotate with your finger, zoom in or view it on your table.'],
    'Поверните композицию пальцем, приблизьте детали или примерьте её на своём столе.': ['Barmog‘ingiz bilan aylantiring, yaqinlashtiring yoki stolingizda ko‘ring.', 'Rotate with your finger, zoom in or view it on your table.'],
    'Загрузка 3D-модели…': ['3D model yuklanmoqda…', 'Loading 3D model…'],
    'AR доступен на совместимых смартфонах': ['AR mos smartfonlarda ishlaydi', 'AR is available on compatible phones'],
    'Модель готова. Можно посмотреть её на своём столе.': ['Model tayyor. Stolingizda ko‘rishingiz mumkin.', 'Ready. View it on your table.'],
    'Модель готова. AR доступен на совместимых смартфонах.': ['Model tayyor. AR mos smartfonlarda ishlaydi.', 'Ready. AR is available on compatible phones.'],
    'AR доступен на совместимых Android-смартфонах. На iPhone — просмотр в 3D.': ['Android smartfonlarda AR. iPhone’da — 3D ko‘rinish.', 'AR on compatible Android phones. On iPhone: 3D view.'],
    'Сбросить вид': ['Ko‘rinishni tiklash', 'Reset view'],
    'Повторить': ['Qayta urinish', 'Retry'],
    'Посмотреть на своём столе': ['Stolimda ko‘rish', 'View on my table'],
    'Qadam · цифровое меню для ресторанов': ['QadamUp · restoranlar uchun raqamli menyu', 'QadamUp · digital restaurant menus'],
    'Не удалось загрузить 3D. Изображение блюда доступно; попробуйте ещё раз.': ['3D yuklanmadi. Qayta urinib ko‘ring.', 'Could not load 3D. Please retry.'],
    'AR не удалось открыть. Вы можете продолжить просмотр модели в 3D.': ['AR ochilmadi. 3D ko‘rinishdan foydalanishingiz mumkin.', 'Could not open AR. You can still explore in 3D.'],
    'AR недоступен на этом устройстве. Модель остаётся доступна в 3D.': ['Bu qurilmada AR ishlamaydi. 3D ko‘rinish mavjud.', 'AR is unavailable on this device. 3D is available.'],
    'Направьте камеру на стол или другую горизонтальную поверхность.': ['Kamerani stolga yoki tekis yuzaga qarating.', 'Point the camera at a table or flat surface.']
  };
  let lang; try { lang = localStorage.getItem('qadamLang'); } catch (_) {}
  if (!['uz','ru','en'].includes(lang)) lang='uz';
  document.documentElement.lang=lang;
  const originals=new WeakMap();
  function translate() {
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while ((node=walker.nextNode())) {
      if (['SCRIPT','STYLE','SELECT','OPTION'].includes(node.parentElement?.tagName)) continue;
      let key=node.textContent.trim();
      if (words[key]) originals.set(node,key);
      else { const previous=originals.get(node); if(previous && [previous,...words[previous]].includes(key)) key=previous; else continue; }
      const value=lang==='ru'?key:words[key][lang==='uz'?0:1];
      if(node.textContent.trim()!==value) node.textContent=value;
    }
    const title=location.pathname.includes('/plov/')?'Плов':location.pathname.includes('/fruits/')?'Фруктовая тарелка':null;
    if(title) document.title=(lang==='ru'?title:words[title][lang==='uz'?0:1])+' · QadamUp 3D / AR';
  }
  const select=document.createElement('select'); select.setAttribute('aria-label','Language');select.className='locale-select';
  for(const code of ['uz','ru','en']){ const option=document.createElement('option');option.value=code;option.textContent=code.toUpperCase();select.append(option); }
  select.value=lang; document.querySelector('.model-nav,.site-header')?.append(select);
  select.addEventListener('change',()=>{lang=select.value;document.documentElement.lang=lang;try{localStorage.setItem('qadamLang',lang);}catch(_){}translate();});
  translate();new MutationObserver(translate).observe(document.body,{childList:true,subtree:true,characterData:true});
})();
