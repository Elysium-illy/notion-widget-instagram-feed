// public/script.js

// --- CONFIGURATION À MODIFIER ---
// 1. Remplacez par l'URL de votre projet Vercel (obtenue après le déploiement initial de la partie 3.1).
// Exemple : 'https://mon-super-widget.vercel.app'
const VERCEL_PROJECT_URL = 'https://notion-widget-instagram-feed.vercel.app/';

// 2. Remplacez par l'ID de votre base de données Notion (obtenue dans la partie 1.3.1).
// Exemple : 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'
const NOTION_DATABASE_ID = '20ecf6e5f180817ca95cdf6fd7d5930a';

// --- FIN DE LA CONFIGURATION ---


const API_ENDPOINT = `${VERCEL_PROJECT_URL}/api/get-images`;
const appDiv = document.getElementById('app');

async function fetchAndDisplayPosts() {
    try {
        appDiv.innerHTML = '<div class="loading">Chargement des images...</div>';

        const response = await fetch(`<span class="math-inline">\{API\_ENDPOINT\}?databaseId\=</span>{NOTION_DATABASE_ID}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Erreur du serveur (${response.status}): ${errorData.error || errorData.message}`);
        }

        const data = await response.json();
        let posts = data.posts; // Le backend nous envoie les posts déjà triés du plus récent au plus ancien

        if (!posts || posts.length === 0) {
            appDiv.innerHTML = '<div class="loading">Aucun post trouvé dans cette base de données Notion.</div>';
            return;
        }

        // Pour obtenir l'ordre "du bas vers le haut, les plus récents à gauche" comme Instagram:
        // Nous avons récupéré les posts du plus récent au plus ancien.
        // La grille CSS va remplir de gauche à droite, puis de haut en bas.
        // Pour avoir les plus récents en bas à gauche, et remonter :
        // Nous allons inverser l'ordre des posts pour les afficher du plus ANCIEN au plus RÉCENT.
        // Ainsi, le plus ancien sera en haut à gauche, et le plus récent en bas à droite.
        // Visuellement, cela donnera un remplissage du haut vers le bas.
        // Si vous souhaitez vraiment que la ligne du bas contienne les 3 plus récents (du plus récent au plus ancien de gauche à droite),
        // avec les lignes précédentes contenant des posts plus anciens, c'est une logique de tri plus complexe pour un novice.
        // Pour l'instant, on fait simple : affichage chronologique standard.
        // Les posts seront affichés du plus récent au plus ancien (car le backend trie comme ça),
        // donc le plus récent sera en haut à gauche et ça descendra.
        // Si vous voulez le contraire, on doit juste inverser `posts`.

        // Pour l'ordre "plus récent en bas à gauche" (comme sur Instagram):
        // On récupère du plus récent au plus ancien (fait par le backend).
        // Pour que le plus récent soit en bas à gauche dans une grille qui remplit de gauche à droite / haut en bas,
        // il faut que l'élément le plus ancien soit le premier à être affiché.
        // Donc, on inverse le tableau ici pour que le plus ancien soit en [0].
        posts.reverse(); // Maintenant, 'posts' va du plus ANCIEN au plus RÉCENT.

        const grid = document.createElement('div');
        grid.className = 'image-grid';

        posts.forEach(post => {
            const postItem = document.createElement('div');
            postItem.className = 'post-item';

            const img = document.createElement('img');
            img.src = post.imageUrl;
            img.alt = `Post du ${post.date}`; // Texte alternatif

            const dateOverlay = document.createElement('div');
            dateOverlay.className = 'post-date-overlay';
            dateOverlay.textContent = post.date; // La date est déjà formatée par le backend

            // Gérer le clic pour ouvrir la page Notion
            postItem.onclick = () => {
                const notionPageUrl = `https://notion.so/${post.id.replace(/-/g, '')}`; // Construit l'URL Notion (sans les tirets dans l'ID)
                window.open(notionPageUrl, '_blank'); // Ouvre dans un nouvel onglet
            };

            postItem.appendChild(img);
            postItem.appendChild(dateOverlay);
            grid.appendChild(postItem);
        });

        appDiv.innerHTML = ''; // Nettoie le message de chargement
        appDiv.appendChild(grid);

    } catch (error) {
        console.error('Erreur lors du chargement des images :', error);
        appDiv.innerHTML = `<div class="error-message">Une erreur est survenue : ${error.message}<br>Vérifiez la console (F12) pour plus de détails.</div>`;
    }
}

// Appelle la fonction pour charger et afficher les images au démarrage du widget
fetchAndDisplayPosts();