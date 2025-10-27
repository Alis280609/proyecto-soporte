// === VARIABLES PRINCIPALES ===
const listaEl = document.getElementById('lista');
const filtroEl = document.getElementById('filtro');
const ordenEl = document.getElementById('orden');

// Panel detalle
const detallePanel  = document.getElementById('detalle');
const detalleTitulo = document.getElementById('detalle-titulo');
const detalleAutor  = document.getElementById('detalle-autor');
const detalleDesc   = document.getElementById('detalle-desc');
const detallePrecio = document.getElementById('detalle-precio');
const detalleTags   = document.getElementById('detalle-tags');
const detalleImg    = document.getElementById('detalle-img');
const closeDetalle  = document.getElementById('close-detalle');

// Carrito
const listaCarrito = document.getElementById("listaCarrito");
const totalSpan    = document.getElementById("total");
const btnVaciar    = document.getElementById("btnVaciar");

// Filtro por categoría (desde el árbol)
const btnClearCat  = document.getElementById('btnClearCat');

let items = [];   // libros aplanados
let rawData = null;

// Placeholder data-URI para portadas faltantes (evita imagen rota)
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='320'>" +
  "<rect width='100%' height='100%' fill='%23eeeeee'/>" +
  "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' " +
  "font-family='Arial' font-size='16' fill='%23999999'>Sin%20portada</text>" +
  "</svg>";

// Estado de filtro por categoría
let filtroCat = null;
let filtroSub = null;

// === CARGAR DATOS ===
async function cargar() {
  try {
    // Modo sin servidor: usamos window.CATALOGO cargado desde data/datos.js
    if (location.protocol === 'file:' && window.CATALOGO) {
      rawData = window.CATALOGO;
    } else {
      // Si algún día lo sirves con server, esto seguirá funcionando:
      const res = await fetch('data/datos.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} al cargar datos.json`);
      rawData = await res.json();
    }

    // Aplanar categorías/subcategorías/items
    items = rawData.categorias.flatMap(cat =>
      cat.subcategorias.flatMap(sub =>
        sub.items.map(it => ({ ...it, categoria: cat.nombre, subcategoria: sub.nombre }))
      )
    );

    render();
    if (typeof initTree === 'function') initTree(rawData);

  } catch (err) {
    console.error('Error cargando JSON:', err);
    listaEl.innerHTML = `<li class="muted">Error cargando catálogo: ${err.message}</li>`;
  }
}

// === RENDER LISTA ===
function render() {
  const q = (filtroEl.value || '').trim().toLowerCase();

  // Orden
  const sorted = [...items].sort((a, b) => {
    switch (ordenEl.value) {
      case 'az':           return a.titulo.localeCompare(b.titulo);
      case 'za':           return b.titulo.localeCompare(a.titulo);
      case 'precio-asc':   return a.precio - b.precio;
      case 'precio-desc':  return b.precio - a.precio;
      default:             return 0;
    }
  });

  // Filtro por texto + categoría
  const filtrados = sorted.filter(it => {
    const byText = !q || it.titulo.toLowerCase().includes(q) ||
      (it.autor && it.autor.toLowerCase().includes(q)) ||
      (it.etiquetas && it.etiquetas.join(' ').toLowerCase().includes(q));

    const byCat  = !filtroCat || it.categoria === filtroCat;
    const bySub  = !filtroSub || it.subcategoria === filtroSub;

    return byText && byCat && bySub;
  });

  listaEl.innerHTML = '';

  filtrados.forEach(it => {
    const li = document.createElement('li');
    li.className = 'card fade-in';
    li.tabIndex = 0;
    li.setAttribute('data-id', it.id);

    const img = document.createElement('img');
    img.className = 'item-cover';
    img.alt = `${it.titulo} — portada`;
    img.src = it.img || PLACEHOLDER;
    img.onerror = () => (img.src = PLACEHOLDER);

    const meta = document.createElement('div');
    meta.className = 'item-meta';

    const t = document.createElement('p');
    t.className = 'item-title';
    t.textContent = it.titulo;

    const a = document.createElement('p');
    a.className = 'item-author muted';
    a.textContent = it.autor ? `por ${it.autor}` : '';

    const p = document.createElement('p');
    p.className = 'item-price';
    p.textContent = `₡${it.precio}`;

    const btnAdd = document.createElement('button');
    btnAdd.textContent = 'Agregar al carrito';
    btnAdd.className = 'btn-agregar';
    btnAdd.addEventListener('click', (e) => {
      e.stopPropagation();
      agregarAlCarrito(it);
    });

    meta.append(t, a);
    li.append(img, meta, p, btnAdd);

    li.addEventListener('click', () => openDetalle(it));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetalle(it);
      }
    });

    listaEl.appendChild(li);
  });

  if (filtrados.length === 0) {
    listaEl.innerHTML = `<li class="muted">No se encontraron libros que coincidan.</li>`;
  }
}

// === PANEL DETALLE ===
function openDetalle(it) {
  detalleTitulo.textContent = it.titulo;
  detalleAutor.textContent  = it.autor ? `Autor: ${it.autor}` : '';
  detalleDesc.textContent   = it.descripcion || '';
  detallePrecio.textContent = `Precio: ₡${it.precio}`;
  detalleTags.innerHTML     = (it.etiquetas || []).map(t => `<span class="tag">${t}</span>`).join(' ');
  detalleImg.src            = it.img || PLACEHOLDER;
  detalleImg.alt            = `Portada de ${it.titulo}`;
  detallePanel.hidden       = false;
  detallePanel.focus();

  // Resaltar seleccionado
  document.querySelectorAll('#lista li').forEach(li =>
    li.classList.toggle('selected', li.getAttribute('data-id') == it.id)
  );
}

closeDetalle.addEventListener('click', () => {
  detallePanel.hidden = true;
  document.querySelectorAll('#lista li').forEach(li => li.classList.remove('selected'));
});

// === BUSCADOR / ORDEN ===
filtroEl.addEventListener('input', debounce(render, 200));
ordenEl.addEventListener('change', render);

// Debounce util
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

// === CARRITO ===
let carritoItems = [];
let total = 0;

function agregarAlCarrito(item) {
  carritoItems.push(item);
  total += item.precio;
  actualizarCarrito();
  mostrarNotificacion(`Libro agregado: ${item.titulo}`);
}

function actualizarCarrito() {
  listaCarrito.innerHTML = '';
  carritoItems.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = `${item.titulo} - ₡${item.precio}`;

    const btnDel = document.createElement('button');
    btnDel.textContent = '✕';
    btnDel.className = 'btn-icon';
    btnDel.addEventListener('click', () => eliminarDelCarrito(index));

    li.appendChild(btnDel);
    listaCarrito.appendChild(li);
  });
  totalSpan.textContent = total.toFixed(2);
}

function eliminarDelCarrito(index) {
  total -= carritoItems[index].precio;
  carritoItems.splice(index, 1);
  actualizarCarrito();
}

btnVaciar.addEventListener('click', () => {
  carritoItems = [];
  total = 0;
  actualizarCarrito();
});

// Toast
function mostrarNotificacion(texto) {
  const notif = document.createElement('div');
  notif.className = 'toast';
  notif.textContent = texto;
  document.body.appendChild(notif);
  void notif.offsetWidth; // reflow
  notif.classList.add('visible');
  setTimeout(() => {
    notif.classList.remove('visible');
    setTimeout(() => notif.remove(), 400);
  }, 1800);
}

// === FILTRO DE CATEGORÍA (expuesto para tree.js) ===
function setCategoryFilter(cat = null, sub = null) {
  filtroCat = cat;
  filtroSub = sub;
  render();
}
window.setCategoryFilter = setCategoryFilter;

btnClearCat.addEventListener('click', () => {
  filtroCat = null; filtroSub = null;
  render();
});

// === INIT ===
document.addEventListener('DOMContentLoaded', cargar);