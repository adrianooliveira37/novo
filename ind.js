const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('whatsapp-web.js');
const QRCode = require('qrcode-svg');
const app = express();
const client = new Client();

app.use(bodyParser.json());

let base64QR = ''; // Variável global para armazenar a base64 do QR Code

function generateAndSetQR() {
    client.on('qr', async (qr) => {
        try {
            base64QR = await generateBase64QR(qr);
            console.log('QR Code base64:', base64QR);
        } catch (error) {
            console.error('Erro ao gerar QR Code base64:', error.message);
        }
    });
}

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

// Gera e define o QR Code inicial
generateAndSetQR();

// Atualiza o QR Code a cada 2 minutos
setInterval(() => {
    generateAndSetQR();
}, 2 * 60 * 1000); // 2 minutos em milissegundos

app.get('/', (req, res) => {
    // Rota para enviar a página HTML com o código QR
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>QR Code Viewer</title>
        </head>
        <body>
            <h1>QR Code Viewer</h1>
            <img id="qrCodeImage" alt="QR Code" src="data:image/svg+xml;base64,${base64QR}">
            <form action="/enviar-mensagem" method="post">
                <label for="numero">Número:</label>
                <input type="text" id="numero" name="numero" required>
                <label for="mensagem">Mensagem:</label>
                <textarea id="mensagem" name="mensagem" required></textarea>
                <button type="submit">Enviar Mensagem</button>
            </form>
        </body>
        </html>
    `;
    res.send(htmlContent);
});

app.post('/enviar-mensagem', async (req, res) => {
    try {
        const { numero, mensagem } = req.body;

        if (!numero || !mensagem) {
            throw new Error('Número ou mensagem ausente na solicitação.');
        }

        const contato = await client.getContactById(numero + '@c.us');
        
        if (!contato) {
            throw new Error('Contato não encontrado.');
        }

        await client.sendMessage(contato.id._serialized, mensagem);

        res.status(200).json({ status: 'success', message: 'Mensagem enviada com sucesso.' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ status: 'error', message: 'Erro ao enviar a mensagem.' });
    }
});

async function generateBase64QR(qrData) {
    const qrcode = new QRCode({
        content: qrData,
        padding: 0,
        width: 200,
        height: 200,
        color: '#000000',
        background: '#ffffff',
        ecl: 'M',
    });

    return Buffer.from(qrcode.svg()).toString('base64');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});
