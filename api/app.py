from flask import Flask, request, jsonify, render_template
from database import DatabaseConnection, Categorie, Produit, Fournisseur, Approvisionnement
import uuid
from datetime import datetime

app = Flask(__name__)
db = DatabaseConnection()

app = Flask(__name__, template_folder="../templates", static_folder="../static")
db = DatabaseConnection()

# Route pour la page d'approvisionnements
@app.route('/')
@app.route('/approvisionnements')
def approvisionnements_page():
    return render_template('approvisionnements.html')

# Route pour la page des produits
@app.route('/produits')
def produits_page():
    return render_template('produits.html')

# Route pour la page des fournisseurs
@app.route('/fournisseurs')
def fournisseurs_page():
    return render_template('fournisseurs.html')

# API: Récupérer tous les approvisionnements
@app.route('/api/approvisionnements', methods=['GET'])
def get_approvisionnements():
    conn = db.get_connection()
    appro_table = Approvisionnement("", "", 0, 0.0, "", "", "").db_table
    approvisionnements = appro_table.select_all(conn)
    conn.close()
    return jsonify(approvisionnements)

# API: Ajouter un approvisionnement
@app.route('/api/approvisionnements', methods=['POST'])
def add_approvisionnement():
    data = request.get_json()
    if not all(key in data for key in ['qte', 'prix_acquis', 'produit_id', 'fournisseur_id']):
        return jsonify({'error': 'Champs obligatoires manquants'}), 400
    approvisionnement = Approvisionnement(
        approv_id=str(uuid.uuid4()),
        date_approv=datetime.now().isoformat(),
        qte=int(data.get('qte')),
        prix_acquis=float(data.get('prix_acquis')),
        produit_id=data.get('produit_id'),
        fournisseur_id=data.get('fournisseur_id'),
        ref=data.get('ref', ''),
        notes=data.get('notes', '')
    )
    conn = db.get_connection()
    produit_table = Produit("", "", 0, 0.0).db_table
    fournisseur_table = Fournisseur("", "", "", "").db_table
    produit = produit_table.select_one(conn, 'PRODUIT_ID', approvisionnement.produit_id)
    fournisseur = fournisseur_table.select_one(conn, 'FOURNISSEUR_ID', approvisionnement.fournisseur_id)
    if not produit or not fournisseur:
        conn.close()
        return jsonify({'error': 'Produit ou fournisseur introuvable'}), 404
    approvisionnement.db_table.insert_one(conn, approvisionnement.format_dict())
    produit['QTE_STOCK'] += approvisionnement.qte
    produit_table.update_one(conn, 'PRODUIT_ID', approvisionnement.produit_id, {
        'QTE_STOCK': produit['QTE_STOCK']
    })
    conn.close()
    return jsonify({'message': 'Approvisionnement ajouté avec succès'}), 201

# API: Supprimer un approvisionnement
@app.route('/api/approvisionnements/<approv_id>', methods=['DELETE'])
def delete_approvisionnement(approv_id):
    conn = db.get_connection()
    appro_table = Approvisionnement("", "", 0, 0.0, "", "", "").db_table
    appro = appro_table.select_one(conn, 'APPROV_ID', approv_id)
    if not appro:
        conn.close()
        return jsonify({'error': 'Approvisionnement introuvable'}), 404
    appro_table.delete_one(conn, 'APPROV_ID', approv_id)
    produit_table = Produit("", "", 0, 0.0).db_table
    produit = produit_table.select_one(conn, 'PRODUIT_ID', appro['PRODUIT_ID'])
    if produit:
        produit['QTE_STOCK'] = max(0, produit['QTE_STOCK'] - appro['QTE'])
        produit_table.update_one(conn, 'PRODUIT_ID', appro['PRODUIT_ID'], {
            'QTE_STOCK': produit['QTE_STOCK']
        })
    conn.close()
    return jsonify({'message': 'Approvisionnement supprimé avec succès'}), 200

# API: Récupérer tous les produits
@app.route('/api/produits', methods=['GET'])
def get_produits():
    conn = db.get_connection()
    produit_table = Produit("", "", 0, 0.0).db_table
    produits = produit_table.select_all(conn)
    conn.close()
    return jsonify(produits)

# API: Ajouter un produit
@app.route('/api/produits', methods=['POST'])
def add_produit():
    data = request.get_json()
    if not all(key in data for key in ['libelle', 'qte_stock', 'prix_unitaire']):
        return jsonify({'error': 'Champs obligatoires manquants'}), 400
    produit = Produit(
        produit_id=str(uuid.uuid4()),
        libelle=data.get('libelle'),
        qte_stock=int(data.get('qte_stock')),
        prix_unitaire=float(data.get('prix_unitaire'))
    )
    conn = db.get_connection()
    produit.db_table.insert_one(conn, produit.format_dict())
    conn.close()
    return jsonify({'message': 'Produit ajouté avec succès'}), 201

# API: Récupérer tous les fournisseurs
@app.route('/api/fournisseurs', methods=['GET'])
def get_fournisseurs():
    conn = db.get_connection()
    fournisseur_table = Fournisseur("", "", "", "").db_table
    fournisseurs = fournisseur_table.select_all(conn)
    conn.close()
    return jsonify(fournisseurs)

# API: Ajouter un fournisseur
@app.route('/api/fournisseurs', methods=['POST'])
def add_fournisseur():
    data = request.get_json()
    if not all(key in data for key in ['nom', 'numero', 'email']):
        return jsonify({'error': 'Champs obligatoires manquants'}), 400
    fournisseur = Fournisseur(
        fournisseur_id=str(uuid.uuid4()),
        nom=data.get('nom'),
        numero=data.get('numero'),
        email=data.get('email')
    )
    conn = db.get_connection()
    fournisseur.db_table.insert_one(conn, fournisseur.format_dict())
    conn.close()
    return jsonify({'message': 'Fournisseur ajouté avec succès'}), 201

if __name__ == '__main__':
    db.initialize()
    app.run(debug=True)
