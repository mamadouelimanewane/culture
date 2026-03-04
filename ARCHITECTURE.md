# Architecture Technique — Culture Sénégal

Ce document détaille l'architecture interne du projet **Culture Sénégal**, les concepts clés utilisés, et la logique derrière les composants principaux.

---

## 1. Vue d'ensemble du système

Le projet est conçu comme une **Single Page Application (SPA) légère**, construite entièrement sans frameworks modernes lourds (pas de React, Vue, ou Angular). Il s'appuie sur des technologies web standards : HTML5, CSS3, et JavaScript (ES6+).

L'avantage de cette approche est :
- **Performance** : Temps de chargement ultra-rapides.
- **Portabilité** : Pas d'étape de build ou de compilation (Node.js/NPM ne sont pas requis pour faire tourner le site).
- **Hébergement statique simple** : Peut être hébergé sur Vercel, GitHub Pages, Netlify ou n'importe quel serveur standard (Apache/Nginx).

---

## 2. Chargement et Gestion des Données

Toutes les données de l'application proviennent de deux fichiers de données statiques fournis au format JSON.

### Flux de données (`js/app.js`)
L'application utilise l'API `fetch` asynchrone pour charger les deux bases de données simultanément lors du chargement de la page :

```javascript
// Exemple de fonction de chargement
async function loadData() {
  const [infraRes, formRes] = await Promise.all([
    fetch('./infrastructures_culturelles.json'),
    fetch('./centre_formation_arts.json')
  ]);
  // Stockage global dans un objet 'state' unique
}
```

### L'objet Global d'États (`state`)
L'ensemble de l'état de l'application est géré dans une variable constante `state` :
- `state.data` : Les données d'origine non filtrées.
- `state.filtered` : Les données actuellement filtrées par la barre latérale.
- `state.filters` : Un objet stockant les filtres actifs (recherche, région, type, milieu).
- `state.maps` & `state.clusters` : Références aux instances Leaflet.

---

## 3. Cartographie (Leaflet.js)

La cartographie est au cœur de l'application. Nous utilisons **Leaflet.js**, qui est couplé au plugin **Leaflet.markercluster** pour gérer les grandes quantités de points géographiques.

### Deux instances de carte
Le projet intègre deux cartes distinctes afin de gérer les vues :
1.  **Panel Map** (`state.maps.panel`) : S'affiche au sein du conteneur principal à la place de la grille. Elle est synchronisée avec la pagination et la grille.
2.  **Full Map** (`state.maps.full`) : Une carte en plein écran, complètement séparée, qui charge l'intégralité des clusters indépendamment des filtres de la barre latérale.

### Markers personnalisés (SVG)
Pour des raisons de performance et de style, les marqueurs ne sont pas des images, mais des `L.divIcon` générant des SVG dynamiques en fonction du code couleur des types d'infrastructures.

---

## 4. Système de Filtrage

La logique de filtrage est centralisée dans la fonction `applyFiltersAndRender()`.
Ce système écoute les inputs depuis :
- La barre latérale (Sidebar sur Desktop)
- Le tiroir (Drawer sur Mobile)

Le processus suit un "pipe" (tuyau) de filtrage :
1.  **Recherche textuelle** : Compare l'entrée au nom, commune, localité et région.
2.  **Filtre Région** : Asservissement strict.
3.  **Filtre Type** : Catégories d'établissements.
4.  **Filtre Milieu** : Spécifique aux infrastructures (Urbain/Rural).

À chaque filtrage, l'état `state.page` est remis à `1` et les vues (Grille et Carte) sont rafraîchies `renderCards() / renderPanelMap()`.

---

## 5. Espace Administration (`admin/`)

Le dossier `admin` contient la logique relative aux fonctionnalités de backoffice, séparées de l'interface publique.

- **`index.html`** : Contient à la fois l'écran de Login et l'interface applicative cachée (Dashboard).
- **`js/admin.js`** : Maintient sa propre gestion d'état et gère :
  - **L'authentification** (simulée côté client pour le moment, via les rôles "admin" ou "responsable").
  - **Les formulaires de soumission** pour que les propriétaires de centres puissent revendiquer leur fiche.
  - **Le flux de validation** pour examiner les demandes (Approuver / Rejeter).

### Évolution future vers un Backend
Actuellement, pour déployer un système de comptes robuste, ce module nécessitera l'intégration d'un backend (ex: Firebase, Supabase, Node.js + Express) pour protéger les points de terminaison (endpoints) de validation.

---

## 6. CSS et Charte Graphique

- Basé majoritairement sur le **CSS Grid** et le **Flexbox** pour le positionnement.
- Utilise des **Variables CSS (`:root`)** pour centraliser les couleurs thématiques, dont la couleur principale vert forêt `#1a6b3e`.
- L'interface suit un mode responsive avec des **Media Queries** (`@media`) brisant le modèle à `992px` (Sidebar devient Drawer Mobile).
