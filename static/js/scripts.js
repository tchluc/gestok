$(document).ready(function() {
    // Charger les approvisionnements
    function loadApprovisionnements() {
        $.get('/api/approvisionnements', function(data) {
            const tbody = $('#approvTable tbody');
            tbody.empty();
            data.forEach(approv => {
                tbody.append(`
                    <tr>
                        <td>${approv.APPROV_ID}</td>
                        <td>${approv.DATE_APPROV}</td>
                        <td>${approv.QTE}</td>
                        <td>${approv.PRIX_ACQIS}</td>
                    </tr>
                `);
            });
        });
    }

    // Charger les produits
    function loadProduits() {
        $.get('/api/produits', function(data) {
            const tbody = $('#produitsTable tbody');
            tbody.empty();
            data.forEach(produit => {
                tbody.append(`
                    <tr>
                        <td>${produit.PRODUIT_ID}</td>
                        <td>${produit.LIBELLE}</td>
                        <td>${produit.QTE_STOCK}</td>
                        <td>${produit.PRIX_UNITAIRE}</td>
                    </tr>
                `);
            });

            // Remplir le select des produits dans le formulaire d'approvisionnement
            const select = $('select[name="produit"]');
            select.empty().append('<option value="">Sélectionner un produit</option>');
            data.forEach(produit => {
                select.append(`<option value="${produit.PRODUIT_ID}">${produit.LIBELLE}</option>`);
            });
        });
    }

    // Charger les fournisseurs
    function loadFournisseurs() {
        $.get('/api/fournisseurs', function(data) {
            const tbody = $('#fournisseursTable tbody');
            tbody.empty();
            data.forEach(fournisseur => {
                tbody.append(`
                    <tr>
                        <td>${fournisseur.FOURNISSEUR_ID}</td>
                        <td>${fournisseur.NOM}</td>
                        <td>${fournisseur.NUMERO}</td>
                        <td>${fournisseur.EMAIL}</td>
                    </tr>
                `);
            });
        });
    }

    // Ajouter un nouveau produit dans le formulaire
    window.addProduit = function() {
        const produitItem = `
            <div class="produit-item mb-3">
                <div class="form-group">
                    <label for="produit">Produit</label>
                    <select class="form-control" name="produit" required>
                        <option value="">Sélectionner un produit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="qte">Quantité</label>
                    <input type="number" class="form-control" name="qte" required>
                </div>
                <div class="form-group">
                    <label for="prix_acquis">Prix d'acquisition</label>
                    <input type="number" step="0.01" class="form-control" name="prix_acquis" required>
                </div>
                <button type="button" class="btn btn-danger" onclick="$(this).parent().remove()">Supprimer</button>
            </div>
        `;
        $('#produitsList').append(produitItem);
        loadProduits(); // Recharger les options du select
    };

    // Soumettre le formulaire d'approvisionnement
    $('#approvForm').submit(function(e) {
        e.preventDefault();
        const produits = [];
        $('.produit-item').each(function() {
            const produit = {
                produit_id: $(this).find('select[name="produit"]').val(),
                qte: $(this).find('input[name="qte"]').val(),
                prix_acquis: $(this).find('input[name="prix_acquis"]').val()
            };
            produits.push(produit);
        });

        // Envoyer chaque produit comme un approvisionnement
        produits.forEach(produit => {
            $.ajax({
                url: '/api/approvisionnements',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(produit),
                success: function() {
                    loadApprovisionnements();
                    $('#approvForm')[0].reset();
                    $('.produit-item:gt(0)').remove(); // Garder le premier item
                }
            });
        });
    });

    // Charger les données initiales selon la page
    if ($('#approvTable').length) loadApprovisionnements();
    if ($('#produitsTable').length) loadProduits();
    if ($('#fournisseursTable').length) loadFournisseurs();
});