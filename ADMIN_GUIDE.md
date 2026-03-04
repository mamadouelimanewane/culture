# Guide de l'Espace d'Administration — Culture Sénégal

L'espace d'administration (Backoffice) permet de gérer les données dynamiques de la plateforme, de valider les propositions des utilisateurs et de gérer les droits d'accès.

Il est accessible via l'URL : `/admin/index.html`.

---

## 🔐 1. Authentification et Comptes Démo

L'application intègre un système d'authentification simulé côté client pour démonstration.

### Comptes par défaut
Pour faciliter les tests sans base de données tierce, des comptes démo sont pré-configurés au lancement :

**Profil Administrateur (Accès total)**
- **Email** : `admin@culture.sn`
- **Mot de passe** : `admin123`

**Profil Responsable (Accès restreint)**
- **Email** : `fatou@culture.sn`
- **Mot de passe** : `resp123`

*Astuce : Vous pouvez utiliser les boutons "Comptes démo" sur la page de connexion pour pré-remplir les champs.*

---

## 👥 2. Gestion des Rôles

Le système est conçu autour de deux profils utilisateurs distincts :

### L'Administrateur
C'est le profil curateur de la plateforme.
- **Tableau de bord** : Statistiques globales (soumissions en attente, acceptées, rejetées) et activité par région.
- **Validations** : Peut approuver, rejeter ou modifier les soumissions (nouveaux lieux, mises à jour, événements) faites par les responsables de lieux.
- **Utilisateurs** : Peut voir la liste des responsables de lieux et gérer (accepter/refuser) les nouvelles demandes de création de comptes.

### Le Responsable (ex: Directeur de musée)
C'est le profil affilié à une ou plusieurs infrastructures.
- **Tableau de bord** : Vue simplifiée centrée sur ses propres actions.
- **Soumissions** : Peut proposer des mises à jour des fiches lieux existantes, créer de nouvelles fiches ou annoncer des événements.
- **Historique** : Accès à l'état de ses propres soumissions (en attente, approuvées, rejetées).

---

## 💾 3. Architecture Technique (LocalStorage)

L'administration **ne modifie pas directement** les fichiers JSON initiaux (`infrastructures_culturelles.json`), car le JavaScript exécuté dans le navigateur n'a pas les droits d'écriture sur le serveur (pour des raisons évidentes de sécurité).

### La base de données locale (DB simulée)
La logique du backoffice (située dans `admin/js/admin.js`) utilise une couche d'abstraction appelée `DB`. Cette classe s'appuie sur le `localStorage` de votre navigateur Web.
Toutes les données créées, validées ou modifiées dans le backoffice seront stockées localement sous les clés commençant par `cultureAdmin_` (ex: `cultureAdmin_users`, `cultureAdmin_submissions`).

**Bénéfices :**
- Permet une démonstration complète et persistante des fonctionnalités (CRUD) sans nécessiter de serveur backend complexe (PHP/Node.js).
- Garde l'application 100% statique et hébergeable gratuitement.

### Flux de validation cible (Futur Backend)
Pour que les données ajoutées depuis l'administration soient répercutées publiquement pour tous les internautes, le système devra à terme être connecté à une base de données cloud (ex: Firebase, Supabase, Strapi).
Le code actuel est conçu pour que la transition (remplacer les appels `DB.get` et `DB.set` par des `fetch` vers une API) soit triviale.

---

## 📝 4. Processus d'Inscription (Demande d'accès)

Un lien "Demander l'accès (nouveau propriétaire)" est visible sur la page de connexion.

1.  **L'utilisateur** (ex: un directeur de galerie) remplit ses informations et choisit s'il gère un lieu existant (de la base de données) ou un nouveau lieu.
2.  **L'administrateur** reçoit une notification et la demande apparaît dans son onglet "À valider".
3.  S'il **approuve** la demande, un compte "Responsable" est automatiquement généré pour ce nouvel utilisateur.
