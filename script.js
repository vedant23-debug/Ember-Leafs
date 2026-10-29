// Sample catalog. Prices are integer paise. Replace with API data when the backend exists.
const PRODUCTS = [
  {id:"dj",name:"Darjeeling First Flush",cat:"tea",type:"Black tea",origin:"Darjeeling, India",notes:["muscatel","floral"],v:[{id:"dj-50",l:"50 g",p:48000},{id:"dj-100",l:"100 g",p:89000}]},
  {id:"sen",name:"Sencha",cat:"tea",type:"Green tea",origin:"Shizuoka, Japan",notes:["grassy","sweet"],v:[{id:"sen-50",l:"50 g",p:42000},{id:"sen-100",l:"100 g",p:78000}]},
  {id:"sn",name:"Silver Needle",cat:"tea",type:"White tea",origin:"Fujian, China",notes:["honey","hay"],v:[{id:"sn-50",l:"50 g",p:95000},{id:"sn-100",l:"100 g",p:180000}]},
  {id:"to",name:"Tieguanyin",cat:"tea",type:"Oolong tea",origin:"Anxi, China",notes:["orchid","creamy"],v:[{id:"to-50",l:"50 g",p:62000},{id:"to-100",l:"100 g",p:115000}]},
  {id:"cm",name:"Chamomile & Mint",cat:"tea",type:"Herbal infusion",origin:"Blend",notes:["calming","cooling"],v:[{id:"cm-50",l:"50 g",p:30000},{id:"cm-100",l:"100 g",p:55000}]},
  {id:"yi",name:"Yirgacheffe",cat:"coffee",type:"Light roast, single origin",origin:"Ethiopia",notes:["jasmine","lemon"],v:[{id:"yi-250",l:"250 g",p:78000},{id:"yi-1k",l:"1 kg",p:279000}]},
  {id:"ms",name:"Mysore Estate",cat:"coffee",type:"Medium roast, single origin",origin:"Karnataka, India",notes:["cocoa","nutty"],v:[{id:"ms-250",l:"250 g",p:56000},{id:"ms-1k",l:"1 kg",p:199000}]},
  {id:"hb",name:"House Dark Blend",cat:"coffee",type:"Dark roast, blend",origin:"Blend",notes:["molasses","smoke"],v:[{id:"hb-250",l:"250 g",p:48000},{id:"hb-1k",l:"1 kg",p:169000}]}
];
const VARIANTS = {};
PRODUCTS.forEach(p => p.v.forEach(v => VARIANTS[v.id] = {...v, name:p.name}));

const $ = s => document.querySelector(s);
const money = p => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(p/100);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

let filter = "all", cart = {};
try { cart = JSON.parse(localStorage.getItem("el-cart") || "{}"); } catch { cart = {}; }
Object.keys(cart).forEach(k => { if (!VARIANTS[k]) delete cart[k]; });

/* ---------- Catalog ---------- */
function renderGrid() {
  const q = $("#q").value.trim().toLowerCase(), sort = $("#sort").value;
  let list = PRODUCTS.filter(p => (filter === "all" || p.cat === filter) &&
    (!q || [p.name,p.type,p.origin,...p.notes].join(" ").toLowerCase().includes(q)));
  const low = p => p.v[0].p;
  list.sort((a,b) => sort === "low" ? low(a)-low(b) : sort === "high" ? low(b)-low(a) : a.name.localeCompare(b.name));
  $("#result-count").textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
  $("#grid").innerHTML = list.length ? list.map(p => `
    <article class="card">
      <div class="swatch ${p.cat}">${esc(p.type)}</div>
      <h3>${esc(p.name)}</h3>
      <p class="meta">${esc(p.origin)} · ${esc(p.notes.join(", "))}</p>
      <p class="price" data-price="${p.id}">${money(p.v[0].p)}</p>
      <div class="buy">
        <select aria-label="Size for ${esc(p.name)}" data-pid="${p.id}">${p.v.map(v => `<option value="${v.id}">${esc(v.l)}</option>`).join("")}</select>
        <button data-add="${p.id}">Add to cart</button>
      </div>
    </article>`).join("") : `<p class="empty">No products match. Try a different search or clear the category filter.</p>`;
}
$("#grid").addEventListener("change", e => {
  const s = e.target.closest("select[data-pid]"); if (!s) return;
  $(`[data-price="${s.dataset.pid}"]`).textContent = money(VARIANTS[s.value].p);
});
$("#grid").addEventListener("click", e => {
  const b = e.target.closest("[data-add]"); if (!b) return;
  const id = $(`select[data-pid="${b.dataset.add}"]`).value;
  cart[id] = (cart[id] || 0) + 1; saveCart(); openCart();
});
function setFilter(f) {
  filter = f;
  document.querySelectorAll(".chips button").forEach(b => b.setAttribute("aria-pressed", b.dataset.filter === f));
  renderGrid();
}
document.querySelectorAll(".chips button").forEach(b => b.onclick = () => setFilter(b.dataset.filter));
document.querySelectorAll("[data-cat]").forEach(a => a.addEventListener("click", () => setFilter(a.dataset.cat)));
$("#q").oninput = renderGrid; $("#sort").onchange = renderGrid;

/* ---------- Cart ---------- */
function saveCart() { try { localStorage.setItem("el-cart", JSON.stringify(cart)); } catch {} renderCart(); }
function renderCart() {
  const ids = Object.keys(cart);
  $("#count").textContent = ids.reduce((n,i) => n + cart[i], 0);
  $("#cart-items").innerHTML = ids.length ? ids.map(id => { const v = VARIANTS[id]; return `
    <div class="line"><div><strong>${esc(v.name)}</strong><br><span class="muted">${esc(v.l)} · ${money(v.p)}</span></div>
    <div class="qty"><button data-dec="${id}" aria-label="Decrease quantity">−</button><span>${cart[id]}</span><button data-inc="${id}" aria-label="Increase quantity">+</button></div></div>`; }).join("")
    : `<p class="muted">Your cart is empty. Add a tea or coffee from the shop.</p>`;
  $("#subtotal").textContent = money(ids.reduce((s,i) => s + VARIANTS[i].p * cart[i], 0));
  $("#checkout").disabled = !ids.length;
}
$("#cart-items").addEventListener("click", e => {
  const inc = e.target.dataset.inc, dec = e.target.dataset.dec;
  if (inc) cart[inc]++;
  if (dec && --cart[dec] <= 0) delete cart[dec];
  if (inc || dec) saveCart();
});
function openCart() { $("#cart").classList.add("open"); $("#cart").setAttribute("aria-hidden","false"); $("#scrim").hidden = false; $("#close-cart").focus(); }
function closeCart() { $("#cart").classList.remove("open"); $("#cart").setAttribute("aria-hidden","true"); $("#scrim").hidden = true; $("#open-cart").focus(); }
$("#open-cart").onclick = openCart; $("#close-cart").onclick = closeCart; $("#scrim").onclick = closeCart;
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#cart").classList.contains("open")) closeCart(); });
// Checkout is intentionally not simulated: totals, payment and orders must come from the server.
$("#checkout").onclick = () => { $("#cart-msg").textContent = "Checkout isn't connected yet. No order has been placed and no payment was taken."; };

/* ---------- Subscription (summary only; no billing) ---------- */
$("#sub-product").innerHTML = Object.values(VARIANTS).map(v => `<option value="${v.id}">${esc(v.name)}, ${esc(v.l)}</option>`).join("");
function subSummary() {
  const v = VARIANTS[$("#sub-product").value];
  $("#sub-summary").textContent = `${money(v.p)} ${$("#sub-freq").value.toLowerCase()}, plus shipping and tax at checkout.`;
}
["sub-product","sub-freq"].forEach(id => $("#"+id).addEventListener("change", subSummary));
$("#sub-consent").onchange = e => $("#sub-go").disabled = !e.target.checked;
$("#sub-form").onsubmit = e => { e.preventDefault(); $("#sub-msg").textContent = "Subscriptions need a connected billing provider. Nothing has been started or charged."; };
subSummary();

/* ---------- Newsletter ---------- */
$("#news").onsubmit = e => { e.preventDefault(); $("#news-msg").textContent = "Newsletter signup isn't connected yet, so your address was not saved."; };

renderGrid(); renderCart();