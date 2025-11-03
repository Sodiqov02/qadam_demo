import os
import json
from datetime import datetime
from typing import Optional, Dict, List
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Updater,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    Filters,
    CallbackContext,
    ConversationHandler
)

# Загружаем переменные окружения
load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
ADMIN_ID = int(os.getenv("ADMIN_ID", "0").strip())

# Состояния для ConversationHandler
MENU, QUANTITY, PHONE, ADDRESS, CONFIRM = range(5)

# Меню с ценами
MENU_ITEMS = {
    'pepperoni': {'name': 'Pepperoni', 'price': 65000},
    'cheeseburger': {'name': 'Cheeseburger', 'price': 45000},
    'shawarma': {'name': 'Shawarma', 'price': 38000},
    'cola': {'name': 'Cola 1L', 'price': 12000},
}

# Хранение текущего заказа пользователя
user_orders = {}

def get_user_id(update: Update) -> Optional[int]:
    """Безопасное получение ID пользователя"""
    if update.effective_user:
        return update.effective_user.id
    return None

def get_message(update: Update):
    """Безопасное получение объекта сообщения"""
    return update.message or (update.callback_query.message if update.callback_query else None)

def get_callback_query(update: Update):
    """Безопасное получение объекта callback query"""
    return update.callback_query

def start(update: Update, context: CallbackContext) -> int:
    if not update.effective_user:
        return ConversationHandler.END
    
    user_id = update.effective_user.id
    message = get_message(update)
    
    if not message:
        return ConversationHandler.END
    
    # Очищаем предыдущий заказ пользователя
    if user_id in user_orders:
        del user_orders[user_id]
    
    # Если это админ, показываем админ-команды
    if user_id == ADMIN_ID:
        message.reply_text(
            "Привет! Вы админ. Доступные команды:\n"
            "/orders - посмотреть активные заказы"
        )
        return ConversationHandler.END
    
    # Для обычных пользователей показываем меню
    keyboard = []
    for item_id, item in MENU_ITEMS.items():
        keyboard.append([InlineKeyboardButton(
            f"{item['name']} - {item['price']} so'm",
            callback_data=f"menu_{item_id}"
        )])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    message.reply_text(
        "Добро пожаловать! Выберите блюдо из меню:",
        reply_markup=reply_markup
    )
    return MENU

def menu_choice(update: Update, context: CallbackContext) -> int:
    query = get_callback_query(update)
    if not query or not update.effective_user:
        return ConversationHandler.END
    
    query.answer()
    
    user_id = update.effective_user.id
    if not query.data:
        return ConversationHandler.END
        
    try:
        item_id = query.data.split('_')[1]
        if item_id not in MENU_ITEMS:
            return ConversationHandler.END
    except (IndexError, KeyError):
        return ConversationHandler.END
    
    if user_id not in user_orders:
        user_orders[user_id] = {'items': []}
    
    user_orders[user_id]['current_item'] = MENU_ITEMS[item_id].copy()
    user_orders[user_id]['current_item']['id'] = item_id
    
    query.edit_message_text(
        f"Выбрано: {MENU_ITEMS[item_id]['name']}\n"
        f"Цена: {MENU_ITEMS[item_id]['price']} so'm\n\n"
        "Введите количество (например, 2):"
    )
    return QUANTITY

def quantity_input(update: Update, context: CallbackContext) -> int:
    if not update.message or not update.message.text or not update.effective_user:
        return ConversationHandler.END
    
    try:
        quantity = int(update.message.text)
        if quantity <= 0:
            raise ValueError
    except ValueError:
        update.message.reply_text("Пожалуйста, введите корректное количество (целое положительное число):")
        return QUANTITY
    
    user_id = update.effective_user.id
    if user_id not in user_orders:
        update.message.reply_text("Произошла ошибка. Пожалуйста, начните заказ заново с команды /start")
        return ConversationHandler.END
    
    current_item = user_orders[user_id]['current_item']
    current_item['quantity'] = quantity
    user_orders[user_id]['items'].append(current_item)
    
    # Спрашиваем, хочет ли пользователь что-то еще
    keyboard = [
        [InlineKeyboardButton("Заказать что-то ещё", callback_data="more")],
        [InlineKeyboardButton("Перейти к оформлению", callback_data="checkout")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    update.message.reply_text(
        f"Добавлено в корзину: {current_item['name']} x{quantity}\n"
        "Что дальше?",
        reply_markup=reply_markup
    )
    return MENU

def handle_cart_choice(update: Update, context: CallbackContext) -> int:
    query = get_callback_query(update)
    if not query or not update.effective_user:
        return ConversationHandler.END
        
    query.answer()
    
    if query.data == "more":
        # Показываем меню снова
        keyboard = []
        for item_id, item in MENU_ITEMS.items():
            keyboard.append([InlineKeyboardButton(
                f"{item['name']} - {item['price']} so'm",
                callback_data=f"menu_{item_id}"
            )])
        reply_markup = InlineKeyboardMarkup(keyboard)
        query.edit_message_text(
            "Выберите блюдо из меню:",
            reply_markup=reply_markup
        )
        return MENU
    else:  # checkout
        # Показываем содержимое корзины и запрашиваем номер телефона
        user_id = update.effective_user.id
        if user_id not in user_orders:
            query.edit_message_text(
                "Произошла ошибка. Пожалуйста, начните заказ заново с команды /start"
            )
            return ConversationHandler.END
            
        order = user_orders[user_id]
        total = sum(item['price'] * item['quantity'] for item in order['items'])
        
        order_text = "Ваш заказ:\n\n"
        for item in order['items']:
            order_text += f"{item['name']} x{item['quantity']} = {item['price'] * item['quantity']} so'm\n"
        order_text += f"\nИтого: {total} so'm\n\nВведите ваш номер телефона:"
        
        query.edit_message_text(order_text)
        return PHONE

async def phone_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    if not update.message or not update.message.text or not update.effective_user:
        return ConversationHandler.END
        
    user_id = update.effective_user.id
    if user_id not in user_orders:
        await update.message.reply_text("Произошла ошибка. Пожалуйста, начните заказ заново с команды /start")
        return ConversationHandler.END
        
    user_orders[user_id]['phone'] = update.message.text
    
    await update.message.reply_text("Введите адрес доставки:")
    return ADDRESS

async def address_input(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    if not update.message or not update.message.text or not update.effective_user:
        return ConversationHandler.END
        
    user_id = update.effective_user.id
    if user_id not in user_orders:
        await update.message.reply_text("Произошла ошибка. Пожалуйста, начните заказ заново с команды /start")
        return ConversationHandler.END
        
    user_orders[user_id]['address'] = update.message.text
    
    # Показываем итоговый заказ для подтверждения
    order = user_orders[user_id]
    total = sum(item['price'] * item['quantity'] for item in order['items'])
    
    confirm_text = "Подтвердите ваш заказ:\n\n"
    for item in order['items']:
        confirm_text += f"{item['name']} x{item['quantity']} = {item['price'] * item['quantity']} so'm\n"
    confirm_text += f"\nИтого: {total} so'm\n"
    confirm_text += f"Телефон: {order['phone']}\n"
    confirm_text += f"Адрес: {order['address']}\n"
    
    keyboard = [
        [InlineKeyboardButton("✅ Подтвердить", callback_data="confirm")],
        [InlineKeyboardButton("❌ Отменить", callback_data="cancel")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(confirm_text, reply_markup=reply_markup)
    return CONFIRM

async def confirm_order(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = get_callback_query(update)
    if not query or not update.effective_user:
        return ConversationHandler.END
        
    await query.answer()
    
    if query.data == "cancel":
        await query.edit_message_text("Заказ отменен. Используйте /start для нового заказа.")
        return ConversationHandler.END
    
    user_id = update.effective_user.id
    if user_id not in user_orders:
        await query.edit_message_text("Произошла ошибка. Пожалуйста, начните заказ заново с команды /start")
        return ConversationHandler.END
        
    order = user_orders[user_id]
    user = update.effective_user
    
    # Формируем сообщение для админа
    admin_text = (
        "🟢 *Новый заказ через бота*\n"
        f"👤 {user.first_name or 'Клиент'}\n"
        f"📞 {order['phone']}\n"
        f"📍 {order['address']}\n\n"
        "🛒 *Заказ:*\n"
    )
    
    total = 0
    for item in order['items']:
        item_total = item['price'] * item['quantity']
        total += item_total
        admin_text += f"- {item['name']} x{item['quantity']} — {item['price']} so'm\n"
    
    admin_text += f"\n💰 *Итого:* {total} so'm\n"
    admin_text += f"⏱ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    # Кнопки управления для админа
    keyboard = [
        [
            InlineKeyboardButton("✅ Выполнено", callback_data=f"admin_done_{user_id}"),
            InlineKeyboardButton("🚚 Доставлено", callback_data=f"admin_delivered_{user_id}")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    try:
        # Отправляем уведомление админу
        await context.bot.send_message(
            chat_id=ADMIN_ID,
            text=admin_text,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
        
        # Подтверждаем заказ пользователю
        await query.edit_message_text(
            "✅ Ваш заказ принят!\n\n"
            "Мы свяжемся с вами для подтверждения.\n"
            "Используйте /start для нового заказа."
        )
        
        # Очищаем данные заказа
        del user_orders[user_id]
        return ConversationHandler.END
    except Exception as e:
        print(f"Ошибка при отправке уведомлений: {e}")
        await query.edit_message_text(
            "Произошла ошибка при оформлении заказа.\n"
            "Пожалуйста, попробуйте позже или свяжитесь с администратором."
        )
        return ConversationHandler.END
        return ConversationHandler.END

async def admin_order_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = get_callback_query(update)
    if not query or not update.effective_user:
        return
        
    await query.answer()
    
    if update.effective_user.id != ADMIN_ID:
        return
    
    if not query.data:
        return
        
    try:
        action, status, user_id = query.data.split('_')
        if not query.message or not query.message.text:
            return
            
        original_text = query.message.text
        
        if status == "done":
            new_status = "✅ Заказ выполнен"
        else:  # delivered
            new_status = "🚚 Заказ доставлен"
        
        # Обновляем сообщение админа, убирая кнопки
        await query.edit_message_text(
            f"{original_text}\n\n{new_status}",
            parse_mode='Markdown'
        )
        
        # Уведомляем пользователя о статусе заказа
        try:
            await context.bot.send_message(
                chat_id=int(user_id),
                text=f"{new_status}!"
            )
        except Exception as e:
            print(f"Ошибка при отправке уведомления пользователю: {e}")
    except Exception as e:
        print(f"Ошибка при обновлении статуса заказа: {e}")

def main():
    print("Инициализация бота...")
    print(f"BOT_TOKEN: {'Установлен' if BOT_TOKEN else 'Не установлен'}")
    print(f"ADMIN_ID: {'Установлен' if ADMIN_ID else 'Не установлен'}")
    
    updater = Updater(token=BOT_TOKEN)
    dispatcher = updater.dispatcher
    print("Updater создан успешно")
    
    # Создаем ConversationHandler
    conv_handler = ConversationHandler(
        entry_points=[CommandHandler('start', start)],
        states={
            MENU: [
                CallbackQueryHandler(menu_choice, pattern='^menu_'),
                CallbackQueryHandler(handle_cart_choice, pattern='^(more|checkout)$')
            ],
            QUANTITY: [MessageHandler(Filters.text & ~Filters.command, quantity_input)],
            PHONE: [MessageHandler(Filters.text & ~Filters.command, phone_input)],
            ADDRESS: [MessageHandler(Filters.text & ~Filters.command, address_input)],
            CONFIRM: [CallbackQueryHandler(confirm_order, pattern='^(confirm|cancel)$')]
        },
        fallbacks=[CommandHandler('start', start)]
    )
    print("ConversationHandler создан успешно")
    
    dispatcher.add_handler(conv_handler)
    dispatcher.add_handler(CallbackQueryHandler(admin_order_status, pattern='^admin_'))
    print("Обработчики добавлены успешно")
    
    print("✅ Qadam bot is running...")
    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    print("Starting bot...")
    main()
    print("Bot stopped.")