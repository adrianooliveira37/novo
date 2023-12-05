const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('whatsapp-web.js');
const QRCode = require('qrcode-svg');
const app = express();
const client = new Client();

app.use(bodyParser.json());

let base64QR = ''; // Variável global para armazenar a base64 do QR Code
let qrUpdateCount = 0; // Contador de atualizações do QR Code

client.on('qr', async (qr) => {
    try {
        base64QR = await generateBase64QR(qr);
        qrUpdateCount += 1; // Incrementa o contador de atualizações
        console.log('QR Code base64:', base64QR);
    } catch (error) {
        console.error('Erro ao gerar QR Code base64:', error.message);
    }
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

// Função para gerar o HTML com o contador
// ...

function generateHtmlWithCounter() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>QR Code Viewer</title>
            <script>
                // Função para recarregar a página a cada 2 minutos
                function reloadPage() {
                    setTimeout(function() {
                        location.reload();
                    }, 2 * 60 * 1000); // 2 minutos em milissegundos
                }

                // Inicia a função de recarregamento
                reloadPage();
            </script>
        </head>
        <body>
            <h1>QR Code Viewer</h1>
            <p>Atualizações do QR Code: ${qrUpdateCount}</p>
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
}

// ...


app.get('/', (req, res) => {
    res.send(generateHtmlWithCounter());
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

const PORT = process.env.PORT || 3000; // Use a porta 80 como padrão
app.listen(PORT, () => {
    console.log(`Servidor iniciado na porta ${PORT}`);
});

// Atualiza o QR Code e o HTML a cada 2 minutos
setInterval(() => {
    client.emit('qr', ''); // Dispara o evento 'qr' para gerar um novo QR Code
    app.get('/', (req, res) => {
        res.send(generateHtmlWithCounter());
    });
}, 2 * 60 * 1000); // 2 minutos em milissegundos
