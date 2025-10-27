// Renderiza árbol simple de categorías y subcategorías
function initTree(data) {
  const treeEl = document.getElementById('tree');
  if (!treeEl) return;

  treeEl.innerHTML = '';

  data.categorias.forEach(cat => {
    const liCat = document.createElement('li');
    liCat.className = 'tree-node';

    const btnCat = document.createElement('button');
    btnCat.type = 'button';
    btnCat.className = 'tree-cat';
    btnCat.textContent = cat.nombre;

    const ulSub = document.createElement('ul');
    ulSub.className = 'tree-sub';

    cat.subcategorias.forEach(sub => {
      const liSub = document.createElement('li');
      const btnSub = document.createElement('button');
      btnSub.type = 'button';
      btnSub.className = 'tree-sub-btn';
      btnSub.textContent = sub.nombre;

      btnSub.addEventListener('click', () => {
        // Aplica filtro por subcategoría
        if (window.setCategoryFilter) window.setCategoryFilter(cat.nombre, sub.nombre);
      });

      liSub.appendChild(btnSub);
      ulSub.appendChild(liSub);
    });

    btnCat.addEventListener('click', () => {
      // Toggle y filtro por categoría completa
      liCat.classList.toggle('open');
      if (window.setCategoryFilter) window.setCategoryFilter(cat.nombre, null);
    });

    liCat.append(btnCat, ulSub);
    treeEl.appendChild(liCat);
  });
}