// Gestion des onglets
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
}

// Charger les produits depuis l'API
async function loadProducts() {
  const response = await fetch('/api/produits');
  return await response.json();
}

// Afficher la liste des produits
async function renderProducts() {
  const productList = document.getElementById('product-list');
  productList.innerHTML = '';
  const products = await loadProducts();
  console.log('Données produits :', products); // Ajout pour débogage
  products.forEach(product => {
    const row = document.createElement('tr');
    row.classList.add('fade-in');
    row.innerHTML = `
      <td>${product.LIBELLE || 'undefined'}</td>
      <td>${product.QTE_STOCK !== undefined ? product.QTE_STOCK : 'undefined'}</td>
      <td>${!isNaN(product.PRIX_UNITAIRE) ? parseFloat(product.PRIX_UNITAIRE).toFixed(2) : 'NaN'}</td>
      <td>
        <button class="action-btn details-btn" data-id="${product.PRODUIT_ID}">
          <i class="fas fa-info-circle"></i>
        </button>
      </td>
    `;
    productList.appendChild(row);
  });

  // Ajouter les écouteurs pour les boutons de détails
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', () => showDetails(btn.dataset.id));
  });
}

// Réinitialiser le formulaire
function resetForm() {
  document.getElementById('product-form').reset();
}

// Enregistrer un produit
document.getElementById('save-product-btn').addEventListener('click', async function() {
  const libelle = document.getElementById('product-name').value;
  const qteStock = document.getElementById('product-stock').value;
  const prixUnitaire = document.getElementById('product-price').value;

  if (!libelle || !qteStock || !prixUnitaire) {
    alert('Veuillez remplir tous les champs obligatoires.');
    return;
  }

  const product = {
    libelle: libelle,
    qte_stock: parseInt(qteStock),
    prix_unitaire: parseFloat(prixUnitaire)
  };

  const response = await fetch('/api/produits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    const error = await response.json();
    alert(`Erreur: ${error.error || 'Échec de l\'enregistrement'}`);
    return;
  }

  await renderProducts();
  resetForm();
  alert('Produit enregistré !');
});

// Annuler et réinitialiser le formulaire
document.getElementById('cancel-product-btn').addEventListener('click', function() {
  resetForm();
});

// Gestion des onglets
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => showTab(tab.dataset.tab));
});

// Toggle sidebar
document.getElementById('toggle-sidebar').addEventListener('click', function() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('active');
  } else {
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
  }
});

// Recherche
async function applyFilters() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const products = await loadProducts();
  const filteredProducts = products.filter(product => product.LIBELLE.toLowerCase().includes(search));

  const productList = document.getElementById('product-list');
  productList.innerHTML = '';
  filteredProducts.forEach(product => {
    const row = document.createElement('tr');
    row.classList.add('fade-in');
    row.innerHTML = `
      <td>${product.LIBELLE || 'undefined'}</td>
      <td>${product.QTE_STOCK !== undefined ? product.QTE_STOCK : 'undefined'}</td>
      <td>${!isNaN(product.PRIX_UNITAIRE) ? parseFloat(product.PRIX_UNITAIRE).toFixed(2) : 'NaN'}</td>
      <td>
        <button class="action-btn details-btn" data-id="${product.PRODUIT_ID}">
          <i class="fas fa-info-circle"></i>
        </button>
      </td>
    `;
    productList.appendChild(row);
  });

  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', () => showDetails(btn.dataset.id));
  });
}

document.getElementById('search-btn').addEventListener('click', applyFilters);
document.getElementById('search-input').addEventListener('input', applyFilters);

// Afficher les détails (simulé)
function showDetails(produitId) {
  alert(`Affichage des détails pour le produit ${produitId} (à implémenter avec une modale).`);
}

// Initialiser
async function init() {
  await renderProducts();
  resetForm();
}

init();