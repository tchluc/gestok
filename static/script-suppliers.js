// Gestion des onglets
function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
}

// Charger les fournisseurs depuis l'API
async function loadSuppliers() {
  const response = await fetch('/api/fournisseurs');
  return await response.json();
}

// Afficher la liste des fournisseurs
async function renderSuppliers() {
  const supplierList = document.getElementById('supplier-list');
  supplierList.innerHTML = '';
  const suppliers = await loadSuppliers();
  console.log('Données fournisseurs :', suppliers); // Ajout pour débogage

  suppliers.forEach(supplier => {
    const row = document.createElement('tr');
    row.classList.add('fade-in');
    row.innerHTML = `
      <td>${supplier.NOM || 'undefined'}</td>
      <td>${supplier.NUMERO || 'undefined'}</td>
      <td>${supplier.EMAIL || 'undefined'}</td>
      <td>
        <button class="action-btn details-btn" data-id="${supplier.FOURNISSEUR_ID}">
          <i class="fas fa-info-circle"></i>
        </button>
      </td>
    `;
    supplierList.appendChild(row);
  });

  // Ajouter les écouteurs pour les boutons de détails
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', () => showDetails(btn.dataset.id));
  });
}

// Réinitialiser le formulaire
function resetForm() {
  document.getElementById('supplier-form').reset();
}

// Enregistrer un fournisseur
document.getElementById('save-supplier-btn').addEventListener('click', async function() {
  const nom = document.getElementById('supplier-name').value;
  const numero = document.getElementById('supplier-number').value;
  const email = document.getElementById('supplier-email').value;

  if (!nom || !numero || !email) {
    alert('Veuillez remplir tous les champs obligatoires.');
    return;
  }

  const supplier = {
    nom,
    numero,
    email
  };

  const response = await fetch('/api/fournisseurs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(supplier)
  });

  if (!response.ok) {
    const error = await response.json();
    alert(`Erreur: ${error.error || 'Échec de l\'enregistrement'}`);
    return;
  }

  await renderSuppliers();
  resetForm();
  alert('Fournisseur enregistré !');
});

// Annuler et réinitialiser le formulaire
document.getElementById('cancel-supplier-btn').addEventListener('click', function() {
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
  const suppliers = await loadSuppliers();
  const filteredSuppliers = suppliers.filter(supplier => supplier.NOM.toLowerCase().includes(search));

  const supplierList = document.getElementById('supplier-list');
  supplierList.innerHTML = '';
  filteredSuppliers.forEach(supplier => {
    const row = document.createElement('tr');
    row.classList.add('fade-in');
    row.innerHTML = `
      <td>${supplier.NOM || 'undefined'}</td>
      <td>${supplier.NUMERO || 'undefined'}</td>
      <td>${supplier.EMAIL || 'undefined'}</td>
      <td>
        <button class="action-btn details-btn" data-id="${supplier.FOURNISSEUR_ID}">
          <i class="fas fa-info-circle"></i>
        </button>
      </td>
    `;
    supplierList.appendChild(row);
  });

  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', () => showDetails(btn.dataset.id));
  });
}

document.getElementById('search-btn').addEventListener('click', applyFilters);
document.getElementById('search-input').addEventListener('input', applyFilters);

// Afficher les détails
async function showDetails(fournisseurId) {
  const suppliers = await loadSuppliers();
  const supplier = suppliers.find(s => s.FOURNISSEUR_ID === fournisseurId);
  const modal = document.getElementById('details-modal');
  const details = document.getElementById('supplier-details');
  details.innerHTML = `
    <p><strong>Nom:</strong> ${supplier.NOM}</p>
    <p><strong>Numéro:</strong> ${supplier.NUMERO}</p>
    <p><strong>Email:</strong> ${supplier.EMAIL}</p>
  `;
  modal.classList.add('show');
  document.querySelector('.close-modal').onclick = function() {
    modal.classList.remove('show');
  };
}

// Initialiser
async function init() {
  await renderSuppliers();
  resetForm();
}

init();