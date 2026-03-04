# 🌍 Culture Sénégal — Plateforme de Cartographie Culturelle

**Culture Sénégal** est une application web interactive dédiée à la préservation et à la valorisation du patrimoine culturel sénégalais. Elle permet de localiser les infrastructures culturelles et les centres de formation artistique à travers tout le pays.

---

## 🚀 Aperçu du Projet
Cette plateforme centralise les données sur les lieux de culture (musées, cinémas, galeries, théâtres) et les opportunités de formation pour les jeunes talents. Elle offre une interface intuitive basée sur une carte interactive et des outils de recherche avancés.

- **Données réelles** : Plus de 1 200 points d'intérêt recensés.
- **Interactivité** : Cartographie dynamique avec Leaflet.js.
- **Mobilité** : Design responsive adapté aux smartphones.
- **Administration** : Backoffice complet pour la gestion des données.

---

## 📖 Sommaire
1. [Installation et Lancement](#-installation-et-lancement)
2. [Fonctionnalités Clés](#-fonctionnalités-clés)
3. [Structure du Projet](#-structure-du-projet)
4. [Stack Technique](#-stack-technique)
5. [Guide Administrateur](#-guide-administrateur)
6. [Maintenance et Déploiement](#-maintenance-et-déploiement)

---

## 🛠 Installation et Lancement
L'application est construite en HTML/JS pur ("Vanilla"), ce qui facilite son déploiement.

1.  Clonez le dépôt.
2.  Ouvrez `index.html` avec un serveur local (ex: Live Server sur VS Code).
3.  Pour l'administration, accédez à `admin/index.html`.

---

## ✨ Fonctionnalités Clés

### 👤 Vue Publique
*   **Recherche Multi-critères** : Recherche par nom, commune, région ou type de structure.
*   **Modes d'affichage** : Basculez entre une vue en grille de cartes ou une vue carte plein écran.
*   **Itinéraires** : Intégration directe avec Google Maps pour générer des itinéraires vers les lieux.
*   **Filtres dynamiques** : Filtrage par milieu (Urbain/Rural) et types spécifiques.

### 🔐 Administration (Backoffice)
*   **Gestion des Accès** : Système d'authentification pour les administrateurs et responsables de région.
*   **Validation des Soumissions** : Flux de travail pour approuver les nouvelles infrastructures proposées par les utilisateurs.
*   **Tableau de Bord** : Statistiques en temps réel sur la répartition géographique et typologique.

---

## 📂 Structure du Projet
```text
/
├── admin/               # Gestion administrative
│   ├── css/             # Styles backoffice
│   ├── js/              # Logique admin (admin.js)
│   └── index.html       # Dashboard & Login
├── css/                 # Styles du site public
├── js/                  # App logic (app.js)
├── index.html           # Entrée principale
├── infrastructures_culturelles.json # Base de données (Infrastructures)
└── centre_formation_arts.json       # Base de données (Formations)
```

---

## 💻 Stack Technique
- **Frontend** : HTML5, CSS3, JavaScript (ES6+).
- **Cartographie** : [Leaflet.js](https://leafletjs.com/) (OpenStreetMap).
- **Optimisation** : [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) pour la performance d'affichage.
- **Design** : CSS personnalisé avec une palette de couleurs inspirée des couleurs nationales (Vert #1a6b3e).

---

## 🚀 Maintenance et Déploiement

### Déploiement
Le projet est optimisé pour un déploiement sur **Vercel** ou tout hébergeur statique.

### Mise à jour des données
Les données sont stockées dans des fichiers `.json` à la racine. Pour ajouter un lieu :
1.  Mettez à jour le fichier `infrastructures_culturelles.json`.
2.  Respectez la structure des champs (`DESIGNATION`, `REGION`, `LATITUDE`, `LONGITUDE`, etc.).
3.  Le déploiement automatique rechargera les nouvelles données.

---

*Ce projet vise à rendre la culture accessible à tous les Sénégalais grâce au numérique.*
