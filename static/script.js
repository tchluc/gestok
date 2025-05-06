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

// Charger les fournisseurs depuis l'API
async function loadSuppliers() {
  const response = await fetch('/api/fournisseurs');
  return await response.json();
}

// Remplir les listes déroulantes des produits
async function populateProductSelects() {
  const products = await loadProducts();
  console.log('Produits pour listes déroulantes :', products); // Ajout pour débogage
  const selects = document.querySelectorAll('.product-name');
  selects.forEach(select => {
    select.innerHTML = '<option value="" disabled selected>Sélectionner un produit</option>';
    products.forEach(product => {
      const option = document.createElement('option');
      option.value = product.PRODUIT_ID;
      option.textContent = `${product.LIBELLE} (${product.PRODUIT_ID})`;
      select.appendChild(option);
    });
  });
}

// Remplir les listes déroulantes des fournisseurs
async function populateSupplierSelects() {
  const suppliers = await loadSuppliers();
  console.log('Fournisseurs pour listes déroulantes :', suppliers); // Ajout pour débogage
  const selects = document.querySelectorAll('.supplier, #filter-supplier');
  selects.forEach(select => {
    const isFilter = select.id === 'filter-supplier';
    select.innerHTML = isFilter
        ? '<option value="">Tous les fournisseurs</option>'
        : '<option value="" disabled selected>Sélectionner un fournisseur</option>';
    suppliers.forEach(supplier => {
      const option = document.createElement('option');
      option.value = supplier.FOURNISSEUR_ID;
      option.textContent = supplier.NOM;
      select.appendChild(option);
    });
  });
}

// Gestion des approvisionnements
const itemsPerPage = 10;
let currentPage = 1;
let supplies = [];
let filteredSupplies = [];

// Mettre à jour les statistiques
async function updateStats() {
  const response = await fetch('/api/approvisionnements');
  supplies = await response.json();
  console.log('Approvisionnements chargés :', supplies); // Ajout pour débogage
  filteredSupplies = [...supplies];
  const totalSupplies = supplies.length;
  const totalCost = supplies.reduce((sum, supply) => {
    const qte = parseFloat(supply.QTE) || 0;
    const prix = parseFloat(supply.PRIX_ACQUIS) || 0;
    return sum + (qte * prix);
  }, 0);
  document.getElementById('total-supplies').textContent = totalSupplies;
  document.getElementById('total-cost').textContent = totalCost.toFixed(2) + ' XOF';
}

// Mettre à jour le résumé du formulaire
function updateFormSummary() {
  const entries = document.querySelectorAll('.supply-entry');
  const totalItems = entries.length;
  let totalAmount = 0;
  entries.forEach(entry => {
    const quantity = parseFloat(entry.querySelector('.quantity').value) || 0;
    const price = parseFloat(entry.querySelector('.price').value) || 0;
    totalAmount += quantity * price;
  });
  document.getElementById('total-items').textContent = totalItems;
  document.getElementById('total-amount').textContent = totalAmount.toFixed(2) + ' XOF';
}

// Afficher la liste des approvisionnements
async function renderSupplies(page = 1) {
  const supplyList = document.getElementById('supply-list');
  supplyList.innerHTML = '';
  const products = await loadProducts();
  const suppliers = await loadSuppliers();
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedSupplies = filteredSupplies.slice(start, end);

  paginatedSupplies.forEach((supply, index) => {
    const product = products.find(p => p.PRODUIT_ID === supply.PRODUIT_ID);
    const supplier = suppliers.find(s => s.FOURNISSEUR_ID === supply.FOURNISSEUR_ID);
    const prixAcquis = parseFloat(supply.PRIX_ACQUIS) || 0;
    const qte = parseFloat(supply.QTE) || 0;
    const total = qte * prixAcquis;
    const row = document.createElement('tr');
    row.classList.add('fade-in');
    row.innerHTML = `
      <td>${supply.REF || '-'}</td>
      <td>${product ? product.LIBELLE : supply.PRODUIT_ID}</td>
      <td>${supply.QTE !== undefined ? qte : 'undefined'}</td>
      <td>${!isNaN(prixAcquis) ? prixAcquis.toFixed(2) : '0.00'}</td>
      <td>${!isNaN(total) ? total.toFixed(2) : '0.00'}</td>
      <td>${supplier ? supplier.NOM : supply.FOURNISSEUR_ID}</td>
      <td>${supply.NOTES || '-'}</td>
      <td>${new Date(supply.DATE_APPROV).toLocaleDateString('fr-FR')}</td>
      <td>
        <button class="action-btn details-btn" data-index="${start + index}">
          <i class="fas fa-info-circle"></i>
        </button>
        <button class="action-btn delete-btn" data-approv-id="${supply.APPROV_ID}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    supplyList.appendChild(row);
  });

  // Mise à jour de la pagination
  const totalPages = Math.ceil(filteredSupplies.length / itemsPerPage);
  document.getElementById('page-info').textContent = `Page ${page} sur ${totalPages}`;
  document.getElementById('prev-page').disabled = page === 1;
  document.getElementById('next-page').disabled = page === totalPages;

  // Ajouter les écouteurs pour les boutons d'action
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', () => showDetails(btn.dataset.index));
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.approvId));
  });
}

// Ajouter un nouvel ensemble de champs
async function addSupplyEntry() {
  const entriesContainer = document.getElementById('supply-entries');
  const newEntry = document.createElement('div');
  newEntry.className = 'supply-entry';
  newEntry.innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label>Produit</label>
        <select class="product-name" required>
          <option value="" disabled selected>Sélectionner un produit</option>
        </select>
      </div>
      <div class="form-group">
        <label>Quantité</label>
        <input type="number" class="quantity" placeholder="Quantité" required min="1">
      </div>
      <div class="form-group">
        <label>Prix</label>
        <input type="number" class="price" placeholder="Prix unitaire (XOF)" required min="0.01" step="0.01">
      </div>
      <div class="form-group">
        <label>Fournisseur</label>
        <select class="supplier" required>
          <option value="" disabled selected>Sélectionner un fournisseur</option>
        </select>
      </div>
      <div class="form-actions">
        <button type="button" class="delete-entry-btn">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="form-row wide">
      <div class="form-group wide">
        <label>Notes</label>
        <textarea class="entry-notes" placeholder="Notes sur cet article (optionnel)"></textarea>
      </div>
    </div>
  `;
  entriesContainer.appendChild(newEntry);

  // Animation fade-in
  newEntry.classList.add('fade-in');

  // Remplir les listes déroulantes
  await populateProductSelects();
  await populateSupplierSelects();

  // Ajouter les écouteurs pour mise à jour du résumé
  newEntry.querySelectorAll('.quantity, .price').forEach(input => {
    input.addEventListener('input', updateFormSummary);
  });

  // Ajouter l'écouteur pour le bouton supprimer
  newEntry.querySelector('.delete-entry-btn').addEventListener('click', function() {
    if (document.querySelectorAll('.supply-entry').length > 1) {
      newEntry.remove();
      updateFormSummary();
    } else {
      alert('Vous devez conserver au moins un ensemble de champs.');
    }
  });

  updateFormSummary();
}

// Réinitialiser le formulaire
async function resetForm() {
  const entriesContainer = document.getElementById('supply-entries');
  entriesContainer.innerHTML = `
    <div class="supply-entry">
      <div class="form-row">
        <div class="form-group">
          <label>Produit</label>
          <select class="product-name" required>
            <option value="" disabled selected>Sélectionner un produit</option>
          </select>
        </div>
        <div class="form-group">
          <label>Quantité</label>
          <input type="number" class="quantity" placeholder="Quantité" required min="1">
        </div>
        <div class="form-group">
          <label>Prix</label>
          <input type="number" class="price" placeholder="Prix unitaire (XOF)" required min="0.01" step="0.01">
        </div>
        <div class="form-group">
          <label>Fournisseur</label>
          <select class="supplier" required>
            <option value="" disabled selected>Sélectionner un fournisseur</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="delete-entry-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="form-row wide">
        <div class="form-group wide">
          <label>Notes</label>
          <textarea class="entry-notes" placeholder="Notes sur cet article (optionnel)"></textarea>
        </div>
      </div>
    </div>
  `;
  document.getElementById('supply-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('supply-ref').value = '';
  await populateProductSelects();
  await populateSupplierSelects();
  entriesContainer.querySelector('.delete-entry-btn').addEventListener('click', function() {
    alert('Vous devez conserver au moins un ensemble de champs.');
  });
  entriesContainer.querySelectorAll('.quantity, .price').forEach(input => {
    input.addEventListener('input', updateFormSummary);
  });
  updateFormSummary();
}

// Enregistrer les approvisionnements
document.getElementById('save-btn').addEventListener('click', async function() {
  const entries = document.querySelectorAll('.supply-entry');
  const supplyDate = document.getElementById('supply-date').value;
  const supplyRef = document.getElementById('supply-ref').value;
  let valid = true;
  const newSupplies = [];

  if (!supplyDate) {
    valid = false;
    alert('Veuillez spécifier une date d\'approvisionnement.');
    return;
  }

  entries.forEach(entry => {
    const produitId = entry.querySelector('.product-name').value;
    const qte = entry.querySelector('.quantity').value;
    const prixAcquis = entry.querySelector('.price').value;
    const fournisseurId = entry.querySelector('.supplier').value;
    const notes = entry.querySelector('.entry-notes').value;

    const isFilled = produitId || qte || prixAcquis || fournisseurId;
    if (isFilled) {
      if (!produitId || !qte || !prixAcquis || !fournisseurId) {
        valid = false;
        alert('Veuillez remplir tous les champs obligatoires pour chaque approvisionnement.');
        return;
      }
      if (isNaN(parseFloat(qte)) || isNaN(parseFloat(prixAcquis))) {
        valid = false;
        alert('La quantité et le prix doivent être des nombres valides.');
        return;
      }
      newSupplies.push({
        produit_id: produitId,
        qte: parseInt(qte),
        prix_acquis: parseFloat(prixAcquis),
        fournisseur_id: fournisseurId,
        notes,
        ref: supplyRef
      });
    }
  });

  if (valid && newSupplies.length > 0) {
    for (const supply of newSupplies) {
      const response = await fetch('/api/approvisionnements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supply)
      });
      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur: ${error.error || 'Échec de l\'enregistrement'}`);
        return;
      }
    }
    await renderSupplies();
    await updateStats();
    await resetForm();
    alert('Approvisionnements enregistrés !');
  } else if (!newSupplies.length) {
    alert('Aucun approvisionnement à enregistrer.');
  }
});

// Annuler et réinitialiser le formulaire
document.getElementById('cancel-btn').addEventListener('click', async function() {
  await resetForm();
});

// Ajouter un nouvel ensemble via le bouton +
document.getElementById('add-entry-btn').addEventListener('click', async function() {
  await addSupplyEntry();
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

// Filtres et recherche
async function applyFilters() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const dateFrom = document.getElementById('date-from').value;
  const dateTo = document.getElementById('date-to').value;
  const supplierId = document.getElementById('filter-supplier').value;

  const products = await loadProducts();
  const suppliers = await loadSuppliers();
  filteredSupplies = supplies.filter(supply => {
    const product = products.find(p => p.PRODUIT_ID === supply.PRODUIT_ID);
    const productName = product ? product.LIBELLE.toLowerCase() : (supply.PRODUIT_ID || '').toLowerCase();
    const ref = supply.REF ? supply.REF.toLowerCase() : '';
    const supplier = suppliers.find(s => s.FOURNISSEUR_ID === supply.FOURNISSEUR_ID);

    const matchesSearch = productName.includes(search) || ref.includes(search);
    const matchesSupplier = !supplierId || supply.FOURNISSEUR_ID === supplierId;
    const matchesDate = (!dateFrom || supply.DATE_APPROV >= dateFrom) && (!dateTo || supply.DATE_APPROV <= dateTo);

    return matchesSearch && matchesSupplier && matchesDate;
  });

  currentPage = 1;
  await renderSupplies(currentPage);
}

document.getElementById('search-btn').addEventListener('click', applyFilters);
document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('apply-filters').addEventListener('click', applyFilters);
document.getElementById('reset-filters').addEventListener('click', async function() {
  document.getElementById('search-input').value = '';
  document.getElementById('date-from').value = '';
  document.getElementById('date-to').value = '';
  document.getElementById('filter-supplier').value = '';
  filteredSupplies = [...supplies];
  currentPage = 1;
  await renderSupplies(currentPage);
});

// Pagination
document.getElementById('prev-page').addEventListener('click', async function() {
  if (currentPage > 1) {
    currentPage--;
    await renderSupplies(currentPage);
  }
});

document.getElementById('next-page').addEventListener('click', async function() {
  const totalPages = Math.ceil(filteredSupplies.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    await renderSupplies(currentPage);
  }
});

// Modale de suppression
function openDeleteModal(approvId) {
  const modal = document.getElementById('delete-modal');
  modal.classList.add('show');
  document.getElementById('confirm-delete').onclick = async function() {
    const response = await fetch(`/api/approvisionnements/${approvId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json();
      alert(`Erreur: ${error.error || 'Échec de la suppression'}`);
      return;
    }
    await renderSupplies(currentPage);
    await updateStats();
    modal.classList.remove('show');
  };
  document.getElementById('cancel-delete').onclick = function() {
    modal.classList.remove('show');
  };
}

// Modale de détails
async function showDetails(index) {
  const supply = filteredSupplies[index];
  const products = await loadProducts();
  const suppliers = await loadSuppliers();
  const product = products.find(p => p.PRODUIT_ID === supply.PRODUIT_ID);
  const supplier = suppliers.find(s => s.FOURNISSEUR_ID === supply.FOURNISSEUR_ID);
  const modal = document.getElementById('details-modal');
  const details = document.getElementById('supply-details');
  details.innerHTML = `
    <p><strong>Référence:</strong> ${supply.REF || '-'}</p>
    <p><strong>Produit:</strong> ${product ? product.LIBELLE : supply.PRODUIT_ID}</p>
    <p><strong>Quantité:</strong> ${supply.QTE !== undefined ? parseFloat(supply.QTE) || 0 : 'undefined'}</p>
    <p><strong>Prix unitaire:</strong> ${!isNaN(parseFloat(supply.PRIX_ACQUIS)) ? parseFloat(supply.PRIX_ACQUIS).toFixed(2) : '0.00'} XOF</p>
    <p><strong>Total:</strong> ${!isNaN(parseFloat(supply.QTE) * parseFloat(supply.PRIX_ACQUIS)) ? (parseFloat(supply.QTE) * parseFloat(supply.PRIX_ACQUIS)).toFixed(2) : '0.00'} XOF</p>
    <p><strong>Fournisseur:</strong> ${supplier ? supplier.NOM : supply.FOURNISSEUR_ID}</p>
    <p><strong>Notes:</strong> ${supply.NOTES || '-'}</p>
    <p><strong>Date:</strong> ${new Date(supply.DATE_APPROV).toLocaleDateString('fr-FR')}</p>
  `;
  modal.classList.add('show');
  document.querySelector('.close-modal').onclick = function() {
    modal.classList.remove('show');
  };
}

// Exportations (simulées)
document.getElementById('export-csv').addEventListener('click', function() {
  alert('Exportation CSV simulée. Ajoutez une bibliothèque comme PapaParse pour une exportation réelle.');
});

document.getElementById('export-pdf').addEventListener('click', function() {
  alert('Exportation PDF simulée. Ajoutez une bibliothèque comme jsPDF pour une exportation réelle.');
});

// Initialiser
async function init() {
  document.getElementById('supply-date').value = new Date().toISOString().split('T')[0];
  await resetForm();
  await renderSupplies();
  await updateStats();
}

init();