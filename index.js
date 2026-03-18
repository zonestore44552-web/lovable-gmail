// index.js
const fs = require('fs');
const { google } = require('googleapis');
const { simpleParser } = require('mailparser');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = 'token.json'; // Token será salvo aqui após autenticação

// Carrega credenciais do JSON que você baixou
const CREDENTIALS_PATH = '/client_secret_56098923577-012r6urkodsponnaar778nmsj4ioca5d.apps.googleusercontent.com.json/client-secret-gmail';
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));

const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Verifica se já temos token
if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
    listInfinitePayEmails();
} else {
    getNewToken(oAuth2Client);
}

// Pega novo token
function getNewToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Abra este link no navegador para autorizar o app:\n', authUrl);
    console.log('Depois cole o código aqui:');

    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Código: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Erro ao criar token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
            console.log('Token salvo com sucesso!');
            listInfinitePayEmails();
        });
    });
}

// Lista e-mails do InfinitePay
async function listInfinitePayEmails() {
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    try {
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'from:nao-responda@infinitepay.io',
            maxResults: 10,
        });

        const messages = res.data.messages || [];
        if (messages.length === 0) {
            console.log('Nenhum pagamento novo encontrado.');
            return;
        }

        for (const msg of messages) {
            const m = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'raw' });
            const raw = Buffer.from(m.data.raw, 'base64').toString('utf8');
            const parsed = await simpleParser(raw);

            // Filtra apenas do InfinitePay
            if (parsed.from.value[0].address === 'nao-responda@infinitepay.io') {
                const body = parsed.text;
                const clienteMatch = body.match(/Cliente:\s*(.+)/);
                const valorMatch = body.match(/Valor:\s*R\$ (.+)/);
                const planoMatch = body.match(/Nome do plano:\s*(.+)/);
                const dataMatch = body.match(/Pagamento aprovado em:\s*(.+)/);

                if (clienteMatch && valorMatch && planoMatch && dataMatch) {
                    const paymentInfo = {
                        cliente: clienteMatch[1].trim(),
                        valor: valorMatch[1].trim(),
                        plano: planoMatch[1].trim(),
                        data: dataMatch[1].trim()
                    };
                    console.log('Pagamento detectado:', paymentInfo);

                    // Aqui você pode salvar em arquivo JSON pro Lovable ler
                    fs.writeFileSync('pagamentos_lovable.json', JSON.stringify(paymentInfo, null, 2));
                }
            }
        }
    } catch (error) {
        console.error('Erro ao acessar Gmail:', error);
    }
}
const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Rodando');
});

app.listen(8080, () => {
    console.log('Servidor rodando na porta 8080');
});
