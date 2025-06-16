// api/get-images.js

const { Client } = require('@notionhq/client');

// Initialise le client Notion avec la clé API.
// La clé sera lue depuis les variables d'environnement de Vercel.
const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async (req, res) => {
  // **Gestion CORS : Très important pour permettre à votre frontend d'accéder au backend.**
  // Permet l'accès depuis n'importe quelle origine (*), ou vous pouvez spécifier votre domaine GitHub Pages.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Pour les requêtes OPTION (pré-vol pour CORS), on renvoie juste un succès.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // L'ID de la base de données Notion sera passé en paramètre depuis le frontend.
  const databaseId = req.query.databaseId;

  if (!databaseId) {
    return res.status(400).json({ error: 'L\'ID de la base de données Notion est requis.' });
  }

  try {
    // Interroge la base de données Notion
    const response = await notion.databases.query({
      database_id: databaseId,
      // Trie les posts par 'Date de publication' par ordre décroissant (du plus récent au plus ancien)
      sorts: [
        {
          property: 'Date de publication', // NOM EXACT DE LA PROPRIÉTÉ DE DATE
          direction: 'descending', // 'descending' pour les plus récents en premier
        },
      ],
      // Filtre pour ne récupérer que les pages qui ont des médias dans la propriété 'Visuels'
      filter: {
        property: 'Visuels', // NOM EXACT DE LA PROPRIÉTÉ DES FICHIERS & MÉDIAS
        files: {
          is_not_empty: true, // S'assure qu'il y a des fichiers attachés
        },
      },
    });

    const posts = [];
    for (const page of response.results) {
      // Récupération de l'URL de l'image (de la propriété 'Visuels')
      const visuelsProperty = page.properties['Visuels']; // NOM EXACT DE LA PROPRIÉTÉ DES FICHIERS & MÉDIAS
      let imageUrl = null;
      if (visuelsProperty && visuelsProperty.files && visuelsProperty.files.length > 0) {
        const file = visuelsProperty.files[0]; // Prend la première image si plusieurs sont attachées
        if (file.type === 'file' && file.file.url) {
          imageUrl = file.file.url;
        } else if (file.type === 'external' && file.external.url) {
          imageUrl = file.external.url;
        }
      }

      // Récupération de la date de publication
      const dateProperty = page.properties['Date de publication']; // NOM EXACT DE LA PROPRIÉTÉ DE DATE
      let date = null;
      if (dateProperty && dateProperty.date && dateProperty.date.start) {
        // Formate la date au format DD/MM/YYYY
        const rawDate = new Date(dateProperty.date.start);
        const day = String(rawDate.getDate()).padStart(2, '0');
        const month = String(rawDate.getMonth() + 1).padStart(2, '0'); // Mois est basé sur 0
        const year = rawDate.getFullYear();
        date = `<span class="math-inline">\{day\}/</span>{month}/${year}`;
      }

      // Si une image et une date sont trouvées, on ajoute le post
      if (imageUrl && date) {
        posts.push({
          id: page.id, // L'ID de la page Notion pour le lien au clic
          imageUrl: imageUrl,
          date: date,
        });
      }
    }

    // Renvoie les données des posts (URL de l'image, date, ID de page) au frontend.
    res.status(200).json({ posts });
  } catch (error) {
    console.error('Erreur lors de la récupération des posts depuis Notion :', error);
    res.status(500).json({ error: 'Erreur interne du serveur lors de la récupération des données.' });
  }
};