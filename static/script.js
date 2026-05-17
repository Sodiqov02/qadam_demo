(function () {
  const menuEl = document.getElementById("menu");
  const menuFilters = document.getElementById("menu-filters");
  const cartList = document.getElementById("cart-list");
  const cartEmpty = document.getElementById("cart-empty");
  const cartCount = document.getElementById("cart-count");
  const cartTotal = document.getElementById("cart-total");
  const cartToast = document.getElementById("cart-toast");
  const cartPane = document.querySelector(".cart-pane");
  const cartScroll = document.querySelector(".cart-scroll");
  const cartForm = document.querySelector(".cart-form");
  const clearBtn = document.getElementById("clear-cart");
  const mobileCartToggle = document.getElementById("mobile-cart-toggle");
  const headerCartToggle = document.getElementById("header-cart-toggle");
  const mobileCartBadge = document.getElementById("mobile-cart-badge");
  const headerCartBadge = document.getElementById("header-cart-badge");
  const mobileCartClose = document.getElementById("mobile-cart-close");
  const mobileCartBackdrop = document.getElementById("mobile-cart-backdrop");
  const scrollToFormFab = document.getElementById("scroll-to-form-fab");
  const orderForm = document.getElementById("order-form");
  const submitBtn = document.getElementById("submit-order");
  const statusEl = document.getElementById("order-status");
  const noteToggle = document.getElementById("note-toggle");
  const orderNoteField = document.getElementById("order-note-field");
  const heroTitle = document.getElementById("hero-title");
  const heroDesc = document.getElementById("hero-desc");
  const heroMedia = document.getElementById("hero-media");
  const heroCta = document.getElementById("hero-cta");
  const ordersLink = document.getElementById("orders-link");
  const adminLink = document.getElementById("admin-link");
  const headerTelegramLink = document.getElementById("header-telegram-link");
  const botLink = document.getElementById("bot-link");
  const botQr = document.getElementById("bot-qr");
  const botMeta = document.getElementById("bot-meta");
  const siteTitle = document.getElementById("site-title");
  const footerTitle = document.getElementById("footer-title");
  const footerDescription = document.getElementById("footer-description");
  const footerTelegramLink = document.getElementById("footer-telegram-link");
  const footerPhone = document.getElementById("footer-phone");
  const footerAddress = document.getElementById("footer-address");
  const footerHours = document.getElementById("footer-hours");
  const cartTriggers = document.querySelectorAll(".cart-trigger");
  const langButtons = document.querySelectorAll("[data-lang]");
  let lastCartTrigger = null;

  if (!menuEl || !orderForm || !statusEl) {
    return;
  }

  const menuDataUrl = "./data/menu.json";
  const translations = {
    uz: {
      brandEyebrow: "Qadam storefront",
      ordersLink: "Buyurtmalarim",
      adminLink: "Boshqaruv",
      cart: "Savat",
      heroEyebrow: "RESTORAN VITRINASI",
      heroTitle: "Qadam Demo",
      heroDesc: "Restoranlar uchun to‘g‘ridan-to‘g‘ri buyurtmalar, ko‘p tilli mehmonlar va qulay checkout uchun yaratilgan nafis online buyurtma tajribasi.",
      viewMenu: "Tanlangan menyuni ko‘rish",
      openCart: "Savatni ochish",
      highlightFast: "To‘g‘ridan-to‘g‘ri buyurtma",
      highlightFresh: "Ko‘p tilli",
      highlightDelivery: "Telegramga tayyor",
      promoPill: "Jonli buyurtma oqimi",
      promoTitle: "Yangi buyurtma",
      promoCopy: "Vitrinadan ish jarayoniga uzatiladigan buyurtmaning ixcham ko‘rinishi.",
      orderPreviewTitle: "Yangi buyurtma",
      orderPreviewTotal: "Jami: 74 000 so'm",
      orderPreviewFoot: "Telegram botga yuboriladi",
      telegramVia: "Telegram orqali",
      botMeta: "Haqiqiy versiyada buyurtmalar Telegram bot va admin panelga yuboriladi.",
      trustDirectTitle: "To‘g‘ridan-to‘g‘ri buyurtma",
      trustDirectText: "Mijozlar buyurtmani restoran vitrinasi orqali ortiqcha vositachilarsiz beradi.",
      trustLangTitle: "E’tibor bilan tayyorlangan oqim",
      trustLangText: "Taom tanlashdan buyurtmani yakunlashgacha bo‘lgan jarayon toza va ishonchli ko‘rinadi.",
      trustAdminTitle: "Ish jarayoniga tayyor",
      trustAdminText: "Buyurtmalarni Telegram bot va admin panelga uzatish oqimi uchun tayyorlangan.",
      menuEyebrow: "Bugungi tanlov",
      menuTitle: "Tanlangan menyu",
      menuDescription: "Restoran taomlari tezkor online buyurtma uchun tayyorlangan.",
      menuCopy: "Kategoriyani tanlang va yoqqan taomlarni buyurtmaga qo‘shing.",
      footerEyebrow: "Buyurtmalar va kontaktlar",
      footerDescription: "Restoran uchun statik demo vitrina. Production versiyada buyurtmalar Telegram bot va admin panelga yuborilishi mumkin.",
      unavailable: "Mavjud emas",
      footerTelegramFlow: "Demo buyurtma oqimi",
      phone: "Telefon",
      footerPhone: "Demo kontakt",
      address: "Manzil",
      footerAddress: "Demo restoran manzili",
      hours: "Ish vaqti",
      footerHours: "Har kuni 10:00 - 22:00",
      cartSubtitle: "Buyurtmani shu yerda yakunlang",
      itemCount: "{count} ta mahsulot",
      clearCart: "Tozalash",
      close: "Yopish",
      emptyCart: "Savat hozircha bo'sh. Yoqtirgan taomingizni qo'shing.",
      total: "Umumiy summa",
      name: "Ism",
      namePlaceholder: "Ismingiz",
      phonePlaceholder: "+998",
      addressPlaceholder: "Yetkazib berish manzili",
      comment: "Izoh (ixtiyoriy)",
      commentPlaceholder: "Masalan: soussiz, achchiq emas, yetkazish vaqti...",
      addNote: "+ Izoh qo‘shish",
      submitOrder: "Yuborish",
      sending: "Yuborilmoqda...",
      add: "Buyurtmaga qo‘shish",
      added: "Qo'shildi",
      addedToCart: "{name} savatga qo'shildi",
      piece: "dona",
      decreaseQty: "{name} sonini kamaytirish",
      increaseQty: "{name} sonini oshirish",
      removeItem: "{name} ni olib tashlash",
      all: "Barcha",
      emptyCategory: "Bu bo'limda hozircha taom yo'q.",
      naturalBadge: "100% tabiy",
      recommendationBadge: "Kun tavsiyasi",
      discountBadge: "Aksiya -{percent}%",
      oldPrice: "Avval: {price}",
      emptyCartStatus: "Savat bo'sh. Avval menyudan qo'shing.",
      successStatus: "Demo buyurtma qabul qilindi. Haqiqiy versiyada buyurtma Telegram bot va admin panelga yuboriladi.",
      toastSuccess: "Demo buyurtma qabul qilindi",
      menuLoadError: "Menu yuklab bo'lmadi",
      error: "Xatolik",
      demoMode: "Demo rejim",
      categories: {
        "Burgerlar": "Burgerlar",
        "Lavash": "Lavash",
        "Pizza": "Pizza",
        "Salatlar": "Salatlar",
        "Snacklar": "Snacklar",
        "Ichimliklar": "Ichimliklar",
        "Menyu": "Menyu",
      },
      items: {
        "burger-classic": {
          name: "Classic Burger",
          description: "Mol go'shti kotleti, cheddar pishlog'i, yangi sabzavot va maxsus sous.",
        },
        "cheese-burger": {
          name: "Cheese Burger",
          description: "Ikki qavat cheddar, yumshoq bulochka, tuzlangan bodring va burger sousi.",
        },
        "lavash-chicken": {
          name: "Chicken Lavash",
          description: "Tovuq filesi, sabzavotlar, fri kartoshka va oq sous bilan o'ralgan lavash.",
        },
        "beef-lavash": {
          name: "Beef Lavash",
          description: "Mol go'shti, yangi ko'katlar, pomidor va achchiq sousli katta lavash.",
        },
        "pepperoni-pizza": {
          name: "Pepperoni Pizza",
          description: "Mozzarella, pepperoni kolbasasi va pomidor sousli issiq pizza.",
        },
        "margherita-pizza": {
          name: "Margherita Pizza",
          description: "Mozzarella, pomidor, rayhon va zaytun moyi bilan klassik pizza.",
        },
        "caesar-salad": {
          name: "Caesar Salad",
          description: "Tovuq filesi, romaine salati, parmesan, kruton va caesar sousi.",
        },
        fries: {
          name: "Fri Kartoshka",
          description: "Qarsildoq fri kartoshka, ketchup va maxsus ziravorlar bilan.",
        },
        cola: {
          name: "Firma kolasi",
          description: "Sovutilgan firma kola ichimligi.",
        },
      },
    },
    ru: {
      brandEyebrow: "Витрина Qadam",
      ordersLink: "Мои заказы",
      adminLink: "Управление",
      cart: "Корзина",
      heroEyebrow: "ВИТРИНА РЕСТОРАНА",
      heroTitle: "Qadam Demo",
      heroDesc: "Изысканный онлайн-заказ для ресторанов — для прямых заказов, гостей на разных языках и плавного оформления.",
      viewMenu: "Смотреть авторское меню",
      openCart: "Открыть корзину",
      highlightFast: "Прямые заказы",
      highlightFresh: "Мультиязычно",
      highlightDelivery: "Telegram-ready",
      promoPill: "Живой поток заказа",
      promoTitle: "Новый заказ",
      promoCopy: "Компактный предпросмотр передачи заказа от витрины к операциям.",
      orderPreviewTitle: "Новый заказ",
      orderPreviewTotal: "Итого: 74 000 so'm",
      orderPreviewFoot: "Отправка в Telegram-бот",
      telegramVia: "Через Telegram",
      botMeta: "В реальной версии заказы отправляются в Telegram-бот и админ-панель.",
      trustDirectTitle: "Прямые заказы",
      trustDirectText: "Гости оформляют заказ на фирменной странице ресторана без лишних посредников.",
      trustLangTitle: "С заботой о подаче",
      trustLangText: "Путь от выбора блюда до оформления заказа выглядит чисто, понятно и надёжно.",
      trustAdminTitle: "Готово к работе",
      trustAdminText: "Логика рассчитана на передачу заказов в Telegram-бот и админ-панель.",
      menuEyebrow: "Сегодняшний выбор",
      menuTitle: "Авторское меню",
      menuDescription: "Блюда ресторана, оформленные для быстрого онлайн-заказа.",
      menuCopy: "Выберите категорию и добавьте любимые позиции к заказу.",
      footerEyebrow: "Заказы и контакты",
      footerDescription: "Статическая демо-витрина ресторана. В production-версии заказы могут отправляться в Telegram-бот и админ-панель.",
      unavailable: "Недоступно",
      footerTelegramFlow: "Демо-поток заказов",
      phone: "Телефон",
      footerPhone: "Демо-контакт",
      address: "Адрес",
      footerAddress: "Демо-адрес ресторана",
      hours: "Время работы",
      footerHours: "Каждый день 10:00 - 22:00",
      cartSubtitle: "Завершите заказ здесь",
      itemCount: "{count} товаров",
      clearCart: "Очистить",
      close: "Закрыть",
      emptyCart: "Корзина пока пуста. Добавьте любимое блюдо.",
      total: "Итого",
      name: "Имя",
      namePlaceholder: "Ваше имя",
      phonePlaceholder: "+998",
      addressPlaceholder: "Адрес доставки",
      comment: "Комментарий (необязательно)",
      commentPlaceholder: "Например: без соуса, не остро, удобное время доставки...",
      addNote: "+ Добавить комментарий",
      submitOrder: "Отправить",
      sending: "Отправляется...",
      add: "Добавить к заказу",
      added: "Добавлено",
      addedToCart: "{name} добавлен в корзину",
      piece: "шт.",
      decreaseQty: "Уменьшить количество: {name}",
      increaseQty: "Увеличить количество: {name}",
      removeItem: "Удалить {name}",
      all: "Все",
      emptyCategory: "В этом разделе пока нет блюд.",
      naturalBadge: "100% натурально",
      recommendationBadge: "Рекомендация дня",
      discountBadge: "Акция -{percent}%",
      oldPrice: "Было: {price}",
      emptyCartStatus: "Корзина пуста. Сначала добавьте блюдо из меню.",
      successStatus: "Демо-заказ принят. В реальной версии заказ отправляется в Telegram-бот и админ-панель.",
      toastSuccess: "Демо-заказ принят",
      menuLoadError: "Не удалось загрузить меню",
      error: "Ошибка",
      demoMode: "Демо-режим",
      categories: {
        "Burgerlar": "Бургеры",
        "Lavash": "Лаваш",
        "Pizza": "Пицца",
        "Salatlar": "Салаты",
        "Snacklar": "Снэки",
        "Ichimliklar": "Напитки",
        "Menyu": "Меню",
      },
      items: {
        "burger-classic": {
          name: "Классический бургер",
          description: "Котлета из говядины, сыр чеддер, свежие овощи и фирменный соус.",
        },
        "cheese-burger": {
          name: "Чизбургер",
          description: "Двойной чеддер, мягкая булочка, маринованные огурцы и бургер-соус.",
        },
        "lavash-chicken": {
          name: "Куриный лаваш",
          description: "Куриное филе, овощи, картофель фри и белый соус в лаваше.",
        },
        "beef-lavash": {
          name: "Говяжий лаваш",
          description: "Говядина, свежая зелень, помидоры и острый соус в большом лаваше.",
        },
        "pepperoni-pizza": {
          name: "Пицца Пепперони",
          description: "Горячая пицца с моцареллой, колбасой пепперони и томатным соусом.",
        },
        "margherita-pizza": {
          name: "Пицца Маргарита",
          description: "Классическая пицца с моцареллой, помидорами, базиликом и оливковым маслом.",
        },
        "caesar-salad": {
          name: "Салат Цезарь",
          description: "Куриное филе, салат ромэн, пармезан, крутоны и соус цезарь.",
        },
        fries: {
          name: "Картофель фри",
          description: "Хрустящий картофель фри с кетчупом и фирменными специями.",
        },
        cola: {
          name: "Фирменная кола",
          description: "Охлаждённый фирменный напиток в стиле колы.",
        },
      },
    },
    en: {
      brandEyebrow: "Qadam storefront",
      ordersLink: "My orders",
      adminLink: "Admin",
      cart: "Cart",
      heroEyebrow: "RESTAURANT STOREFRONT",
      heroTitle: "Qadam Demo",
      heroDesc: "A refined online ordering experience for restaurants — crafted for direct orders, multilingual guests and smooth checkout.",
      viewMenu: "View signature menu",
      openCart: "Open cart",
      highlightFast: "Direct orders",
      highlightFresh: "Multilingual",
      highlightDelivery: "Telegram-ready",
      promoPill: "Live order flow",
      promoTitle: "New order",
      promoCopy: "A compact preview of the handoff from storefront to operations.",
      orderPreviewTitle: "New order",
      orderPreviewTotal: "Total: 74 000 so'm",
      orderPreviewFoot: "Sent to Telegram bot",
      telegramVia: "Via Telegram",
      botMeta: "The real version sends orders to a Telegram bot and admin panel.",
      trustDirectTitle: "Direct orders",
      trustDirectText: "Guests order from your own branded storefront, without marketplace distractions.",
      trustLangTitle: "Prepared with care",
      trustLangText: "The flow is designed to make every dish feel selected, confirmed and handled properly.",
      trustAdminTitle: "Ready for operations",
      trustAdminText: "Built around a Telegram/admin-ready handoff for real restaurant workflows.",
      menuEyebrow: "Today’s selection",
      menuTitle: "Signature menu",
      menuDescription: "Curated dishes prepared for direct online ordering.",
      menuCopy: "Choose by category and add your favorites to the order.",
      footerEyebrow: "Orders and contacts",
      footerDescription: "Static restaurant storefront demo. In production, orders can be sent to a Telegram bot and admin panel.",
      unavailable: "Unavailable",
      footerTelegramFlow: "Demo order flow",
      phone: "Phone",
      footerPhone: "Demo contact",
      address: "Address",
      footerAddress: "Demo restaurant address",
      hours: "Hours",
      footerHours: "Every day 10:00 - 22:00",
      cartSubtitle: "Finish your order here",
      itemCount: "{count} items",
      clearCart: "Clear",
      close: "Close",
      emptyCart: "Your cart is empty. Add a favorite dish.",
      total: "Total",
      name: "Name",
      namePlaceholder: "Your name",
      phonePlaceholder: "+998",
      addressPlaceholder: "Delivery address",
      comment: "Note (optional)",
      commentPlaceholder: "Example: no sauce, not spicy, preferred delivery time...",
      addNote: "+ Add a note",
      submitOrder: "Send order",
      sending: "Sending...",
      add: "Add to order",
      added: "Added",
      addedToCart: "{name} added to cart",
      piece: "pc",
      decreaseQty: "Decrease quantity for {name}",
      increaseQty: "Increase quantity for {name}",
      removeItem: "Remove {name}",
      all: "All",
      emptyCategory: "There are no dishes in this section yet.",
      naturalBadge: "100% natural",
      recommendationBadge: "Today's pick",
      discountBadge: "Promo -{percent}%",
      oldPrice: "Was: {price}",
      emptyCartStatus: "Cart is empty. Add something from the menu first.",
      successStatus: "Demo order accepted. In the real version, this order is sent to Telegram bot and admin panel.",
      toastSuccess: "Demo order accepted",
      menuLoadError: "Menu could not be loaded",
      error: "Error",
      demoMode: "Demo mode",
      categories: {
        "Burgerlar": "Burgers",
        "Lavash": "Lavash",
        "Pizza": "Pizza",
        "Salatlar": "Salads",
        "Snacklar": "Snacks",
        "Ichimliklar": "Drinks",
        "Menyu": "Menu",
      },
      items: {
        "burger-classic": {
          name: "Classic Burger",
          description: "Beef patty, cheddar cheese, fresh vegetables, and signature sauce.",
        },
        "cheese-burger": {
          name: "Cheese Burger",
          description: "Double cheddar, soft bun, pickles, and burger sauce.",
        },
        "lavash-chicken": {
          name: "Chicken Lavash",
          description: "Chicken fillet, vegetables, fries, and white sauce wrapped in lavash.",
        },
        "beef-lavash": {
          name: "Beef Lavash",
          description: "Beef, fresh herbs, tomatoes, and spicy sauce in a large lavash.",
        },
        "pepperoni-pizza": {
          name: "Pepperoni Pizza",
          description: "Hot pizza with mozzarella, pepperoni sausage, and tomato sauce.",
        },
        "margherita-pizza": {
          name: "Margherita Pizza",
          description: "Classic pizza with mozzarella, tomatoes, basil, and olive oil.",
        },
        "caesar-salad": {
          name: "Caesar Salad",
          description: "Chicken fillet, romaine lettuce, parmesan, croutons, and caesar sauce.",
        },
        fries: {
          name: "Fries",
          description: "Crispy fries with ketchup and signature spices.",
        },
        cola: {
          name: "Signature Cola",
          description: "House cola-style drink, chilled and served fresh.",
        },
      },
    },
  };
  const cart = new Map();

  let promotions = [];
  let discountPercent = 0;
  let menuCategories = [];
  let activeCategoryId = "all";
  let toastTimer = 0;
  let currentLang = localStorage.getItem("qadamLang") || "uz";
  if (!translations[currentLang]) {
    currentLang = "uz";
  }

  function t(key, replacements) {
    const dict = translations[currentLang] || translations.uz;
    let value = dict[key] || translations.uz[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach((name) => {
        value = value.replace(`{${name}}`, replacements[name]);
      });
    }
    return value;
  }

  function localizedCategory(title) {
    const dict = translations[currentLang] || translations.uz;
    return (dict.categories && dict.categories[title]) || title;
  }

  function localizedItem(item) {
    const dict = translations[currentLang] || translations.uz;
    return (dict.items && dict.items[item.id]) || item;
  }

  function applyLanguage(lang) {
    currentLang = translations[lang] ? lang : "uz";
    localStorage.setItem("qadamLang", currentLang);
    document.documentElement.lang = currentLang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    langButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.lang === currentLang);
      button.setAttribute("aria-pressed", button.dataset.lang === currentLang ? "true" : "false");
    });
    updateCartToggles(Array.from(cart.values()).reduce((sum, entry) => sum + entry.qty, 0));
    if (cartCount) {
      cartCount.textContent = t("itemCount", { count: Array.from(cart.values()).reduce((sum, entry) => sum + entry.qty, 0) });
    }
    if (menuCategories.length) {
      renderMenuFilters(menuCategories);
      renderMenu(menuCategories);
    }
    renderCart();
  }

  function isRenderableImageUrl(value) {
    if (!value || typeof value !== "string") {
      return false;
    }
    if (value.startsWith("./assets/") || value.startsWith("../assets/")) {
      return true;
    }
    if (value.startsWith("/assets/")) {
      return true;
    }
    try {
      const parsed = new URL(value, window.location.href);
      return parsed.origin === window.location.origin && parsed.pathname.includes("/assets/");
    } catch (_) {
      return false;
    }
  }

  function categoryId(categoryName) {
    return String(categoryName || "Menyu")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "menu";
  }

  function normalizeMenuItems(data) {
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    if (data && Array.isArray(data.categories)) {
      return data.categories.flatMap((category) => {
        const items = Array.isArray(category.items) ? category.items : [];
        return items.map((item) => ({
          ...item,
          category: item.category || category.title || category.name || "Menyu",
        }));
      });
    }
    return [];
  }

  function buildCategories(items) {
    const categoryMap = new Map();
    items.forEach((item) => {
      const title = item.category || "Menyu";
      const id = categoryId(title);
      if (!categoryMap.has(id)) {
        categoryMap.set(id, {
          id,
          title,
          items: [],
        });
      }
      categoryMap.get(id).items.push(item);
    });
    return Array.from(categoryMap.values());
  }

  function safeText(el, text) {
    el.textContent = text ?? "";
    return el;
  }

  function formatPrice(n) {
    return `${Number(n || 0).toLocaleString("ru-RU")} so'm`;
  }

  function effectivePrice(price) {
    if (!discountPercent) {
      return Number(price || 0);
    }
    return Math.round((Number(price || 0) * (100 - discountPercent)) / 100);
  }

  function setCartOpen(isOpen) {
    const open = Boolean(isOpen);
    document.body.classList.toggle("cart-open", open);
    if (cartPane) {
      cartPane.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) {
        cartPane.removeAttribute("inert");
      } else {
        cartPane.setAttribute("inert", "");
      }
    }
    if (open) {
      window.requestAnimationFrame(function () {
        if (cartScroll) {
          cartScroll.scrollTop = 0;
        }
        updateScrollFab();
        if (mobileCartClose) {
          mobileCartClose.focus({ preventScroll: true });
        }
      });
    } else if (lastCartTrigger && typeof lastCartTrigger.focus === "function") {
      if (scrollToFormFab) {
        scrollToFormFab.classList.remove("visible");
      }
      lastCartTrigger.focus({ preventScroll: true });
    }
  }

  function setNoteOpen(isOpen) {
    if (!noteToggle || !orderNoteField) {
      return;
    }
    const open = Boolean(isOpen);
    orderNoteField.classList.toggle("is-open", open);
    noteToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function updateScrollFab() {
    if (!scrollToFormFab || !cartScroll || !cartForm) {
      return;
    }
    if (!document.body.classList.contains("cart-open") || cart.size === 0) {
      scrollToFormFab.classList.remove("visible");
      return;
    }

    const formRect = cartForm.getBoundingClientRect();
    const containerRect = cartScroll.getBoundingClientRect();

    const formVisible =
      formRect.top < containerRect.bottom - 40 &&
      formRect.bottom > containerRect.top;

    if (formVisible) {
      scrollToFormFab.classList.remove("visible");
    } else {
      scrollToFormFab.classList.add("visible");
    }
  }

  function updateCartToggles(totalQty) {
    const countLabel = totalQty ? t("itemCount", { count: totalQty }) : t("cart");
    if (mobileCartToggle) {
      mobileCartToggle.setAttribute("aria-label", countLabel);
    }
    if (headerCartToggle) {
      headerCartToggle.setAttribute("aria-label", countLabel);
    }
    if (mobileCartBadge) {
      mobileCartBadge.hidden = totalQty <= 0;
      mobileCartBadge.textContent = String(totalQty);
    }
    if (headerCartBadge) {
      headerCartBadge.hidden = totalQty <= 0;
      headerCartBadge.textContent = String(totalQty);
    }
  }

  function scrollActiveCategoryIntoView() {
    const active = document.querySelector(".menu-filter-pill.is-active");
    if (active && menuFilters) {
      const left = active.offsetLeft - (menuFilters.clientWidth - active.clientWidth) / 2;
      menuFilters.scrollTo({
        left: Math.max(0, left),
        behavior: "smooth",
      });
    }
  }

  function renderMenuFilters(categories) {
    if (!menuFilters) {
      return;
    }
    menuFilters.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.className = `menu-filter-pill${activeCategoryId === "all" ? " is-active" : ""}`;
    safeText(allButton, t("all"));
    allButton.addEventListener("click", function () {
      activeCategoryId = "all";
      renderMenuFilters(menuCategories);
      renderMenu(menuCategories);
    });
    menuFilters.appendChild(allButton);

    categories.forEach((category) => {
      const filterBtn = document.createElement("button");
      filterBtn.type = "button";
      filterBtn.className = `menu-filter-pill${activeCategoryId === String(category.id) ? " is-active" : ""}`;
      safeText(filterBtn, localizedCategory(category.title || ""));
      filterBtn.addEventListener("click", function () {
        activeCategoryId = String(category.id);
        renderMenuFilters(menuCategories);
        renderMenu(menuCategories);
      });
      menuFilters.appendChild(filterBtn);
    });

    window.requestAnimationFrame(scrollActiveCategoryIntoView);
  }

  function setStatus(message, type) {
    statusEl.textContent = message || "";
    statusEl.classList.remove("is-success", "is-error");
    if (type) {
      statusEl.classList.add(type);
    }
  }

  function setSubmitState(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("is-loading", isLoading);
    submitBtn.textContent = isLoading ? t("sending") : t("submitOrder");
  }

  function showCartToast(message) {
    if (!cartToast) {
      return;
    }
    cartToast.textContent = message;
    cartToast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      cartToast.classList.remove("is-visible");
    }, 1800);
  }

  function animateAddButton(button) {
    if (!button) {
      return;
    }
    const original = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = original;
    const lockedWidth = button.offsetWidth;
    if (lockedWidth) {
      button.style.width = `${lockedWidth}px`;
    }
    button.textContent = t("added");
    button.disabled = true;
    button.classList.add("is-added");
    window.setTimeout(function () {
      button.textContent = original;
      button.disabled = false;
      button.classList.remove("is-added");
      button.style.width = "";
    }, 480);
  }

  function renderMenuSkeleton(count) {
    menuEl.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "menu-section-grid is-skeleton-grid";
    for (let i = 0; i < count; i += 1) {
      const card = document.createElement("div");
      card.className = "menu-card menu-card-skeleton";

      const image = document.createElement("div");
      image.className = "menu-item-image skeleton";
      card.appendChild(image);

      const body = document.createElement("div");
      body.className = "menu-card-body";

      const chip = document.createElement("div");
      chip.className = "skeleton-chip skeleton";
      body.appendChild(chip);

      const title = document.createElement("div");
      title.className = "skeleton-line title skeleton";
      body.appendChild(title);

      const line = document.createElement("div");
      line.className = "skeleton-line body skeleton";
      body.appendChild(line);

      const shortLine = document.createElement("div");
      shortLine.className = "skeleton-line body short skeleton";
      body.appendChild(shortLine);

      card.appendChild(body);
      grid.appendChild(card);
    }
    menuEl.appendChild(grid);
  }

  function clearDemoState() {
    promotions = [];
    discountPercent = 0;
    menuCategories = [];
    activeCategoryId = "all";
    cart.clear();
    menuEl.innerHTML = "";
    if (menuFilters) {
      menuFilters.innerHTML = "";
    }
    setStatus("");
    setSubmitState(false);
    setCartOpen(false);
    if (orderForm) {
      orderForm.reset();
    }
    setNoteOpen(false);
    if (siteTitle) {
      siteTitle.textContent = t("menuTitle");
    }
    if (footerTitle) {
      footerTitle.textContent = "Qadam";
    }
    if (footerDescription) {
      footerDescription.textContent = t("footerDescription");
    }
    if (headerTelegramLink) {
      headerTelegramLink.style.display = "";
      headerTelegramLink.href = "#";
    }
    if (botLink) {
      botLink.textContent = "@bot";
      botLink.href = "#";
    }
    if (footerTelegramLink) {
      footerTelegramLink.dataset.i18n = "unavailable";
      footerTelegramLink.textContent = t("unavailable");
      footerTelegramLink.href = "#";
    }
    renderCart();
  }

  function addToCart(item, triggerButton) {
    const displayItem = localizedItem(item);
    const current = cart.get(item.id) || { item, qty: 0 };
    current.qty += 1;
    cart.set(item.id, current);
    animateAddButton(triggerButton);
    showCartToast(t("addedToCart", { name: displayItem.name || t("menuTitle") }));
    renderCart();
  }

  function updateQty(id, delta) {
    const current = cart.get(id);
    if (!current) {
      return;
    }
    current.qty += delta;
    if (current.qty <= 0) {
      cart.delete(id);
    } else {
      cart.set(id, current);
    }
    renderCart();
  }

  function clearCart() {
    cart.clear();
    renderCart();
  }

  function removeFromCart(id) {
    cart.delete(id);
    renderCart();
  }

  function renderCart() {
    cartList.innerHTML = "";
    const items = Array.from(cart.values());
    const totalQty = items.reduce((sum, entry) => sum + entry.qty, 0);
    if (cartCount) {
      cartCount.textContent = t("itemCount", { count: totalQty });
    }
    updateCartToggles(totalQty);
    clearBtn.disabled = !items.length;
    if (!items.length) {
      cartEmpty.style.display = "block";
      cartTotal.textContent = formatPrice(0);
      if (scrollToFormFab) {
        scrollToFormFab.classList.remove("visible");
      }
      return;
    }
    cartEmpty.style.display = "none";
    let total = 0;
    items.forEach(({ item, qty }) => {
      const displayItem = localizedItem(item);
      const li = document.createElement("li");
      li.className = "cart-item";
      const lineTotal = effectivePrice(item.price) * qty;
      total += lineTotal;

      const main = document.createElement("div");
      main.className = "cart-item-main";

      const info = document.createElement("div");
      const name = document.createElement("p");
      name.className = "cart-item-name";
      safeText(name, displayItem.name);
      info.appendChild(name);

      const sub = document.createElement("p");
      sub.className = "cart-item-sub";
      safeText(sub, `${formatPrice(effectivePrice(item.price))} / ${t("piece")}`);
      info.appendChild(sub);

      main.appendChild(info);
      li.appendChild(main);

      const qtyControl = document.createElement("div");
      qtyControl.className = "cart-qty";

      const minusBtn = document.createElement("button");
      minusBtn.type = "button";
      minusBtn.className = "cart-qty-btn";
      minusBtn.setAttribute("aria-label", t("decreaseQty", { name: displayItem.name }));
      safeText(minusBtn, "-");
      minusBtn.addEventListener("click", function () {
        updateQty(item.id, -1);
      });

      const qtyValue = document.createElement("span");
      qtyValue.className = "cart-qty-value";
      safeText(qtyValue, String(qty));

      const plusBtn = document.createElement("button");
      plusBtn.type = "button";
      plusBtn.className = "cart-qty-btn";
      plusBtn.setAttribute("aria-label", t("increaseQty", { name: displayItem.name }));
      safeText(plusBtn, "+");
      plusBtn.addEventListener("click", function () {
        updateQty(item.id, 1);
      });

      qtyControl.appendChild(minusBtn);
      qtyControl.appendChild(qtyValue);
      qtyControl.appendChild(plusBtn);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "cart-remove-btn";
      removeBtn.setAttribute("aria-label", t("removeItem", { name: displayItem.name }));
      removeBtn.textContent = "x";
      removeBtn.addEventListener("click", function () {
        removeFromCart(item.id);
      });

      const side = document.createElement("div");
      side.className = "cart-item-side";

      const topLine = document.createElement("div");
      topLine.className = "cart-item-topline";

      const price = document.createElement("span");
      price.className = "cart-item-price";
      safeText(price, formatPrice(lineTotal));

      topLine.appendChild(price);
      topLine.appendChild(removeBtn);

      const actions = document.createElement("div");
      actions.className = "cart-item-actions";
      actions.appendChild(qtyControl);
      side.appendChild(topLine);
      side.appendChild(actions);
      li.appendChild(side);
      cartList.appendChild(li);
    });
    cartTotal.textContent = formatPrice(total);
    window.requestAnimationFrame(updateScrollFab);
  }

  function renderMenu(categories) {
    menuEl.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "menu-section-grid";
    let renderedSections = 0;
    const visibleCategories = categories.filter((cat) => {
      if (activeCategoryId === "all") {
        return true;
      }
      return String(cat.id) === activeCategoryId;
    });

    visibleCategories.forEach((cat) => {
      const items = Array.isArray(cat.items) ? cat.items : [];
      if (!items.length) {
        return;
      }

      items.forEach((item) => {
        const displayItem = localizedItem(item);
        const card = document.createElement("div");
        card.className = "menu-card";

        if (cat.title && cat.title.toLowerCase().includes("maxs")) {
          const badge = document.createElement("div");
          badge.className = "badge-green";
          safeText(badge, t("naturalBadge"));
          card.appendChild(badge);
        }

        const itemPromo = promotions.find(
          (p) => p.type === "item_of_the_day" && String(p.product_id) === String(item.id)
        );
        if (itemPromo) {
          const badge = document.createElement("div");
          badge.className = "badge-promo";
          safeText(badge, t("recommendationBadge"));
          card.appendChild(badge);
        }

        if (discountPercent) {
          const badge = document.createElement("div");
          badge.className = "badge-promo-alt";
          safeText(badge, t("discountBadge", { percent: discountPercent }));
          card.appendChild(badge);
        }

        const imageWrap = document.createElement("div");
        imageWrap.className = "menu-item-image";
        const imageUrl = item.image || item.image_url;
        if (isRenderableImageUrl(imageUrl)) {
          const img = document.createElement("img");
          img.src = imageUrl;
          img.alt = displayItem.name || "";
          img.loading = "lazy";
          img.className = "menu-image-loading";
          img.addEventListener("load", function () {
            img.classList.remove("menu-image-loading");
          });
          img.addEventListener("error", function () {
            imageWrap.innerHTML = "";
            const fallback = document.createElement("div");
            fallback.className = "img-placeholder";
            safeText(fallback, displayItem.name || "");
            imageWrap.appendChild(fallback);
          });
          imageWrap.appendChild(img);
        } else {
          const img = document.createElement("div");
          img.className = "img-placeholder";
          safeText(img, displayItem.name || "");
          imageWrap.appendChild(img);
        }
        card.appendChild(imageWrap);

        const body = document.createElement("div");
        body.className = "menu-card-body";

        const title = document.createElement("h4");
        title.className = "menu-item-title";
        safeText(title, displayItem.name);
        body.appendChild(title);

        if (displayItem.description) {
          const desc = document.createElement("p");
          desc.className = "menu-card-desc";
          safeText(desc, displayItem.description || "");
          body.appendChild(desc);
        }

        card.appendChild(body);

        const priceRow = document.createElement("div");
        priceRow.className = "price-row";
        const price = document.createElement("div");
        price.className = "price menu-item-price";
        safeText(price, formatPrice(effectivePrice(item.price)));
        if (discountPercent) {
          const note = document.createElement("div");
          note.className = "promo-note";
          safeText(note, t("oldPrice", { price: formatPrice(item.price) }));
          price.appendChild(note);
        }
        const btn = document.createElement("button");
        btn.className = "add-btn";
        btn.type = "button";
        safeText(btn, t("add"));
        btn.addEventListener("click", function () {
          addToCart(item, btn);
        });
        priceRow.appendChild(price);
        priceRow.appendChild(btn);
        card.appendChild(priceRow);
        grid.appendChild(card);
      });
      renderedSections += 1;
    });

    if (!renderedSections) {
      menuEl.innerHTML = `<div class="empty-state compact">${t("emptyCategory")}</div>`;
      return;
    }
    menuEl.appendChild(grid);
  }

  async function loadDemoProfile() {
    heroTitle.textContent = t("heroTitle");
    heroDesc.textContent = t("heroDesc");
    heroMedia.classList.add("hero-fallback");
    heroMedia.style.backgroundImage = "";
    if (siteTitle) {
      siteTitle.textContent = t("heroTitle");
    }
    if (footerTitle) {
      footerTitle.textContent = t("heroTitle");
    }
    if (footerDescription) {
      footerDescription.textContent = t("footerDescription");
    }

    if (ordersLink) {
      ordersLink.style.display = "none";
    }
    if (adminLink) {
      adminLink.style.display = "none";
    }
    if (headerTelegramLink) {
      headerTelegramLink.style.display = "none";
    }
    if (botLink) {
      botLink.textContent = t("demoMode");
      botLink.removeAttribute("href");
    }
    if (footerTelegramLink) {
      footerTelegramLink.dataset.i18n = "footerTelegramFlow";
      footerTelegramLink.textContent = t("footerTelegramFlow");
      footerTelegramLink.removeAttribute("href");
    }
    if (botQr) {
      botQr.removeAttribute("src");
    }
    if (botMeta) {
      botMeta.textContent = t("botMeta");
    }
    if (footerPhone) {
      footerPhone.textContent = t("footerPhone");
    }

    if (footerAddress) {
      footerAddress.textContent = t("footerAddress");
    }
    if (footerHours) {
      footerHours.textContent = t("footerHours");
    }
  }

  async function loadPromotions() {
    promotions = [];
    discountPercent = 0;
  }

  async function loadMenu() {
    renderMenuSkeleton(9);
    const res = await fetch(menuDataUrl, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(t("menuLoadError"));
    }
    const data = await res.json();
    menuCategories = buildCategories(normalizeMenuItems(data));
    if (activeCategoryId !== "all" && !menuCategories.some((cat) => String(cat.id) === activeCategoryId)) {
      activeCategoryId = "all";
    }
    renderMenuFilters(menuCategories);
    renderMenu(menuCategories);
  }

  async function submitOrder(evt) {
    evt.preventDefault();
    setStatus("");
    if (!cart.size) {
      setStatus(t("emptyCartStatus"), "is-error");
      return;
    }
    setSubmitState(true);
    try {
      const form = new FormData(orderForm);
      const demoOrder = {
        items: Array.from(cart.values()).map(({ item, qty }) => ({ item_id: item.id, qty })),
        customer: {
          name: (form.get("name") || "").trim(),
          phone: (form.get("phone") || "").trim(),
          address: (form.get("address") || "").trim(),
          comment: (form.get("comment") || "-").trim() || "-",
        },
        source: "site",
      };
      window.setTimeout(function () {
        console.info("Qadam demo order", demoOrder);
      }, 0);
      setStatus(t("successStatus"), "is-success");
      showCartToast(t("toastSuccess"));
      clearCart();
      orderForm.reset();
      setNoteOpen(false);
    } catch (err) {
      setStatus((err && err.message) || t("error"), "is-error");
    } finally {
      setSubmitState(false);
    }
  }

  async function boot() {
    clearDemoState();
    renderMenuSkeleton(9);
    try {
      await loadDemoProfile();
      await loadPromotions();
      await loadMenu();
      applyLanguage(currentLang);
    } catch (err) {
      const message = (err && err.message) || t("error");
      applyLanguage(currentLang);
      setStatus(message, "is-error");
      menuEl.innerHTML = `<p class="muted">${message}</p>`;
    }
  }

  clearBtn.addEventListener("click", clearCart);
  orderForm.addEventListener("submit", submitOrder);
  langButtons.forEach((button) => {
    button.addEventListener("click", function () {
      applyLanguage(button.dataset.lang);
    });
  });
  cartTriggers.forEach((trigger) => {
    trigger.addEventListener("click", function () {
      lastCartTrigger = trigger;
      setCartOpen(true);
    });
  });
  if (mobileCartClose) {
    mobileCartClose.addEventListener("click", function () {
      setCartOpen(false);
    });
  }
  if (mobileCartBackdrop) {
    mobileCartBackdrop.addEventListener("click", function () {
      setCartOpen(false);
    });
  }
  if (scrollToFormFab) {
    scrollToFormFab.addEventListener("click", function () {
      if (!cartForm) {
        return;
      }
      cartForm.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }
  if (noteToggle) {
    noteToggle.addEventListener("click", function () {
      setNoteOpen(noteToggle.getAttribute("aria-expanded") !== "true");
    });
  }
  if (cartScroll) {
    cartScroll.addEventListener("scroll", updateScrollFab);
  }
  window.addEventListener("resize", updateScrollFab);
  heroCta.addEventListener("click", function () {
    const discovery = document.querySelector(".menu-discovery");
    if (discovery) {
      discovery.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      setCartOpen(false);
    }
  });

  if (cartPane) {
    cartPane.setAttribute("inert", "");
  }

  boot();
})();
