// Qadam demo cart & order
const cartKey = 'qadam_cart_v1';
let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function saveCart(){ localStorage.setItem(cartKey, JSON.stringify(cart)); }
function format(n){ return n.toLocaleString('uz-UZ'); }

function renderCart(){
  const list = $('#cart-items');
  const total = $('#cart-total');
  list.innerHTML = '';
  let sum = 0;
  cart.forEach((it, idx) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <div><strong>${it.name}</strong><br/><small>${format(it.price)} so'm</small></div>
      <div class="qty">
        <button data-idx="${idx}" data-act="dec">−</button>
        <span>${it.qty}</span>
        <button data-idx="${idx}" data-act="inc">+</button>
      </div>
      <div><strong>${format(it.price * it.qty)}</strong> so'm</div>
      <div><button data-idx="${idx}" data-act="del" class="btn btn-ghost">O'chirish</button></div>
    `;
    list.appendChild(li);
    sum += it.price * it.qty;
  });
  total.textContent = format(sum);
}

function addToCart(name, price){
  console.log('Добавление в корзину:', name, price);
  const ex = cart.find(x => x.name === name);
  if(ex) {
    console.log('Товар уже в корзине, увеличиваем количество');
    ex.qty += 1;
  } else {
    console.log('Новый товар, добавляем в корзину');
    cart.push({name, price: Number(price), qty: 1});
  }
  console.log('Текущая корзина:', cart);
  saveCart();
  console.log('Корзина сохранена в localStorage');
  renderCart();
  console.log('Корзина отрендерена');
}

function onCartClick(e){
  const btn = e.target.closest('button');
  if(!btn) return;
  const idx = Number(btn.dataset.idx);
  const act = btn.dataset.act;
  if(act === 'inc') cart[idx].qty += 1;
  if(act === 'dec') cart[idx].qty = Math.max(1, cart[idx].qty - 1);
  if(act === 'del') cart.splice(idx,1);
  saveCart(); renderCart();
}

function openModal(){ $('#order-modal').classList.remove('hidden'); }
function closeModal(){ $('#order-modal').classList.add('hidden'); }

function attach(){
  $$('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.name, btn.dataset.price));
  });
  $('#cart-items').addEventListener('click', onCartClick);
  $('#checkout-btn').addEventListener('click', () => {
    if(cart.length === 0){ alert('Savatcha bo\'sh 😅'); return; }
    openModal();
  });
  $('#close-modal').addEventListener('click', closeModal);
  $('#order-form').addEventListener('submit', submitOrder);
  renderCart();
}

async function submitOrder(ev){
  ev.preventDefault();
  const payload = {
    name: $('#name').value.trim(),
    phone: $('#phone').value.trim(),
    address: $('#address').value.trim(),
    note: $('#note').value.trim(),
    items: cart.map(x => ({name:x.name, price:x.price, quantity:x.qty})),
    total: cart.reduce((s,x)=>s+x.price*x.qty,0)
  };
  if(!payload.name || !payload.phone || !payload.address){
    alert('Iltimos, barcha maydonlarni to\'ldiring.'); return;
  }
  try{
    const res = await fetch('/api/order', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('Server xatosi');
    const data = await res.json();
    alert(data.message || 'Buyurtma yuborildi!');
    cart = []; saveCart(); renderCart(); closeModal();
  }catch(err){
    console.error(err);
    alert('Buyurtma yuborilmadi. Keyinroq urinib ko\'ring.');
  }
}

document.addEventListener('DOMContentLoaded', attach);
