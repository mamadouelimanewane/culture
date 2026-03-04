# Guide de Gestion des Données — Culture Sénégal

L'application **Culture Sénégal** s'appuie entièrement sur des fichiers statiques locaux au format JSON. Ce choix architectural permet d'avoir une application extrêmement rapide et de s'affranchir d'une base de données complexe.

Ce guide explique comment la donnée est structurée et comment effectuer des mises à jour (ajout, modification, suppression d'un lieu).

---

## 📂 Fichiers de Données

Les données sont réparties en deux fichiers situés à la racine du projet :

1.  **`infrastructures_culturelles.json`** : Recense tous les lieux et équipements culturels (Musées, Cinémas, Centres culturels, etc.).
2.  **`centre_formation_arts.json`** : Recense tous les établissements proposant des formations liées aux arts et à la culture.

Les deux fichiers suivent une structure dérivée d'un export de tableur (Type Excel / Google Sheets), contenant un objet parent avec une propriété `sheets`, laquelle contient une propriété `records` (tableau d'objets globaux).

---

## 📖 Dictionnaire de Données

Chaque élément (objet) dans le tableau `records` doit respecter les champs (clés) attendus par le moteur de l'application (JavaScript). Les clés sont sensibles à la casse (en MAJUSCULES).

### 🏛 1. Infrastructures (`infrastructures_culturelles.json`)

Voici les champs critiques que l'application utilise pour afficher et filtrer une infrastructure :

-   **`DESIGNATION`** *(String)* : Nom officiel de l'infrastructure (ex: "Musée Théodore Monod"). **(Obligatoire)**
-   **`DESCRIPTIF`** *(String)* : Typologie de lieu (ex: "Musée", "Cinéma", "Galerie"). Permet le filtrage, les icônes et le code couleur. **(Obligatoire)**
-   **`REGION`** *(String)* : Nom de la région (ex: "DAKAR", "THIES"). Sert pour le filtre principal. **(Obligatoire)**
-   **`DEPARTEMENT`** *(String)* : Département administratif.
-   **`COMMUNE`** *(String)* : Commune où se situe la structure.
-   **`LOCALITES`** *(String)* : Quartier ou localité précise.
-   **`MILIEU`** *(String)* : Zone géographique. Valeurs acceptées : `"URBAIN"` ou `"RURAL"`. Sert au filtrage par milieu.
-   **`TYPE_LOCALITE`** *(String)* : Précision géographique supplémentaire.
-   **`LATITUDE`** *(Number/Float)* : Coordonnée GPS de latitude (ex: `14.69370`). Requis pour l'affichage sur la carte.
-   **`LONGITUDE`** *(Number/Float)* : Coordonnée GPS de longitude (ex: `-17.44406`). Requis pour l'affichage sur la carte.

### 🎓 2. Formations (`centre_formation_arts.json`)

Voici les champs critiques pour un centre de formation (légèrement différents des infrastructures) :

-   **`NOM_ETABLISSEMENT`** *(String)* : Nom de l'école/centre (ex: "École Nationale des Arts"). **(Obligatoire)**
-   **`BRANCHE`** *(String)* : Domaine de formation (ex: "ARTS", "AUDIOVISUEL", "INFOGRAPHIE"). Correspond au `DESCRIPTIF` des infrastructures. **(Obligatoire)**
-   **`REGION`** *(String)* : Nom de la région (ex: "SAINT LOUIS"). **(Obligatoire)**
-   **`DEPARTEMENT`** *(String)* : Département administratif.
-   **`COMMUNE`** *(String)* : Commune de l'établissement.
-   **`LOCALITE`** *(String)* : Localité ou quartier (Note : singulier contrairement à l'autre fichier).
-   **`LATITUDE`** *(Number/Float)* : Coordonnée GPS de latitude.
-   **`LONGITUDE`** *(Number/Float)* : Coordonnée GPS de longitude.

---

## 🛠 Procédure de Mise à Jour (Mise en Production)

Si vous devez ajouter une nouvelle infrastructure ou corriger une coordonnée GPS erronée, voici la méthode :

### Étape 1 : Formater l'objet JSON
Assurez-vous que les données GPS sont des nombres (sans guillemets) pour éviter les erreurs de lecture Leaflet, bien que le JS tente un `parseFloat` par précaution.

Exemple pour l'ajout d'une Galerie :
```json
{
  "REGION": "DAKAR",
  "DEPARTEMENT": "DAKAR",
  "COMMUNE": "DAKAR PLATEAU",
  "MILIEU": "URBAIN",
  "DESIGNATION": "Galerie Céramique",
  "DESCRIPTIF": "Galerie",
  "LATITUDE": 14.67123,
  "LONGITUDE": -17.43210,
  "LOCALITES": "Plateau"
}
```

### Étape 2 : Éditer le fichier
1.  Ouvrez `infrastructures_culturelles.json` avec un éditeur de texte/code moderne (VS Code, Notepad++).
2.  Cherchez le tableau `records` sous `sheets.INFRASTRUCTURES_CULTURELLES`.
3.  Ajoutez l'objet à la fin du tableau (attention aux virgules entre les objets `},{`).

### Étape 3 : Déploiement
Sauvegardez le fichier et commitez vos modifications vers votre dépôt distant (ex: GitHub).
Si vous utilisez **Vercel** ou **Netlify**, le redéploiement sera déclenché automatiquement en quelques secondes, et les nouvelles données seront instantanément disponibles pour les utilisateurs sur le Web.

---

## 🎨 Les Mots-Clés de Typologie

L'application attribue automatiquement une couleur et une icône spécifique en fonction du domaine/type. Vous devez utiliser **exactement** les termes suivants dans les champs `DESCRIPTIF` ou `BRANCHE` :

**Infrastructures :**
- `Centre culturel`
- `Centre d'animation`
- `Cinéma`
- `Foyer des femmes`
- `Foyer des jeunes`
- `Galerie`
- `Musée`
- `Salle des fêtes`
- `Village artisanal`

**Formations :**
- `ARTS`
- `AUDIOVISUEL`
- `INFOGRAPHIE`
- `PEINTURE`
- `SERIGRAPHIE`
*(Et leurs déclinaisons "ARTS - AUDIOVISUEL", etc.)*

*Note : Tout terme non reconnu tombera dans la catégorie `_default` (Icône grise standard).*
