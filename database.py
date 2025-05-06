import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional
import uuid

class DBTable:
    def __init__(self, table_name: str):
        self.table_name = table_name

    def select_all(self, conn: sqlite3.Connection) -> List[Dict[str, Any]]:
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {self.table_name}")
        columns = [description[0] for description in cursor.description]
        results = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return results

    def select_one(self, conn: sqlite3.Connection, id_field: str, id_value: Any) -> Optional[Dict[str, Any]]:
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {self.table_name} WHERE {id_field} = ?", (id_value,))
        columns = [description[0] for description in cursor.description]
        row = cursor.fetchone()
        cursor.close()
        return dict(zip(columns, row)) if row else None

    def insert_one(self, conn: sqlite3.Connection, data: Dict[str, Any]) -> None:
        columns = ', '.join(data.keys())
        placeholders = ', '.join('?' * len(data))
        query = f"INSERT INTO {self.table_name} ({columns}) VALUES ({placeholders})"
        cursor = conn.cursor()
        cursor.execute(query, list(data.values()))
        conn.commit()
        cursor.close()

    def insert_many(self, conn: sqlite3.Connection, data_list: List[Dict[str, Any]]) -> None:
        if not data_list:
            return
        columns = ', '.join(data_list[0].keys())
        placeholders = ', '.join('?' * len(data_list[0]))
        query = f"INSERT INTO {self.table_name} ({columns}) VALUES ({placeholders})"
        cursor = conn.cursor()
        cursor.executemany(query, [list(data.values()) for data in data_list])
        conn.commit()
        cursor.close()

    def update_one(self, conn: sqlite3.Connection, id_field: str, id_value: Any, data: Dict[str, Any]) -> None:
        set_clause = ', '.join(f"{k} = ?" for k in data.keys())
        query = f"UPDATE {self.table_name} SET {set_clause} WHERE {id_field} = ?"
        cursor = conn.cursor()
        cursor.execute(query, list(data.values()) + [id_value])
        conn.commit()
        cursor.close()

    def delete_one(self, conn: sqlite3.Connection, id_field: str, id_value: Any) -> None:
        query = f"DELETE FROM {self.table_name} WHERE {id_field} = ?"
        cursor = conn.cursor()
        cursor.execute(query, (id_value,))
        conn.commit()
        cursor.close()

class DatabaseConnection:
    def __init__(self, db_name: str = "gest_stock.db"):
        self.db_name = db_name

    def get_connection(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_name)

    def create_database(self) -> None:
        conn = self.get_connection()
        conn.close()

    def create_tables(self) -> None:
        conn = self.get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS CATEGORIES (
                CATEGORIE_ID TEXT PRIMARY KEY,
                LIBELLE TEXT NOT NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS PRODUITS (
                PRODUIT_ID TEXT PRIMARY KEY,
                LIBELLE TEXT NOT NULL,
                QTE_STOCK INTEGER NOT NULL,
                PRIX_UNITAIRE REAL NOT NULL
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS FOURNISSEURS (
                FOURNISSEUR_ID TEXT PRIMARY KEY,
                NOM TEXT NOT NULL,
                NUMERO TEXT,
                EMAIL TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS APPROVISIONNEMENTS (
                APPROV_ID TEXT PRIMARY KEY,
                DATE_APPROV TEXT NOT NULL,
                QTE INTEGER NOT NULL,
                PRIX_ACQIS REAL NOT NULL,
                PRODUIT_ID TEXT NOT NULL,
                FOURNISSEUR_ID TEXT NOT NULL,
                REF TEXT,
                NOTES TEXT,
                FOREIGN KEY (PRODUIT_ID) REFERENCES PRODUITS(PRODUIT_ID),
                FOREIGN KEY (FOURNISSEUR_ID) REFERENCES FOURNISSEURS(FOURNISSEUR_ID)
            )
        """)

        conn.commit()
        cursor.close()
        conn.close()

    def initialize(self) -> None:
        self.create_database()
        self.create_tables()

class Categorie:
    def __init__(self, categorie_id: str, libelle: str):
        self.db_table = DBTable("CATEGORIES")
        self.categorie_id = categorie_id
        self.libelle = libelle

    def format_dict(self) -> Dict[str, Any]:
        return {
            "CATEGORIE_ID": self.categorie_id,
            "LIBELLE": self.libelle
        }

class Produit:
    def __init__(self, produit_id: str, libelle: str, qte_stock: int, prix_unitaire: float):
        self.db_table = DBTable("PRODUITS")
        self.produit_id = produit_id
        self.libelle = libelle
        self.qte_stock = qte_stock
        self.prix_unitaire = prix_unitaire

    def format_dict(self) -> Dict[str, Any]:
        return {
            "PRODUIT_ID": self.produit_id,
            "LIBELLE": self.libelle,
            "QTE_STOCK": self.qte_stock,
            "PRIX_UNITAIRE": self.prix_unitaire
        }

class Fournisseur:
    def __init__(self, fournisseur_id: str, nom: str, numero: str, email: str):
        self.db_table = DBTable("FOURNISSEURS")
        self.fournisseur_id = fournisseur_id
        self.nom = nom
        self.numero = numero
        self.email = email

    def format_dict(self) -> Dict[str, Any]:
        return {
            "FOURNISSEUR_ID": self.fournisseur_id,
            "NOM": self.nom,
            "NUMERO": self.numero,
            "EMAIL": self.email
        }

class Approvisionnement:
    def __init__(self, approv_id: str, date_approv: str, qte: int, prix_acquis: float, produit_id: str, fournisseur_id: str, ref: str = "", notes: str = ""):
        self.db_table = DBTable("APPROVISIONNEMENTS")
        self.approv_id = approv_id
        self.date_approv = date_approv
        self.qte = qte
        self.prix_acquis = prix_acquis
        self.produit_id = produit_id
        self.fournisseur_id = fournisseur_id
        self.ref = ref
        self.notes = notes

    def format_dict(self) -> Dict[str, Any]:
        return {
            "APPROV_ID": self.approv_id,
            "DATE_APPROV": self.date_approv,
            "QTE": self.qte,
            "PRIX_ACQIS": self.prix_acquis,
            "PRODUIT_ID": self.produit_id,
            "FOURNISSEUR_ID": self.fournisseur_id,
            "REF": self.ref,
            "NOTES": self.notes
        }