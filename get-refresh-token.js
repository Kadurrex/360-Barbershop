const { google } = require('googleapis');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

console.log('📂 Current directory:', process.cwd());

try {
    // Load client secrets from a local file.
    console.log('🔍 Looking for credentials.json...');
    const credentialsPath = path.join(process.cwd(), 'credentials.json');
    console.log('📄 Credentials path:', credentialsPath);
    
    if (!fs.existsSync(credentialsPath)) {
        throw new Error(`credentials.json not found at ${credentialsPath}`);
    }
    
    const credentials = require(credentialsPath).web;
    console.log('✅ Credentials loaded successfully');

    const oAuth2Client = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uris[0]
    );

    // Generate the url that will be used for authorization
    const authorizeUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
        prompt: 'consent'
    });

    console.log('\n⚡ Starting OAuth2 flow...');
    console.log('1️⃣ Please open this URL in your browser:', authorizeUrl);

    // Create a temporary server to handle the OAuth2 callback
    const server = http.createServer(async (req, res) => {
        try {
            console.log('📥 Received request:', req.url);
            const parsedUrl = url.parse(req.url, true);
            
            if (parsedUrl.pathname === '/oauth2callback') {
                const code = parsedUrl.query.code;
                if (!code) {
                    throw new Error('No code provided in callback');
                }

                console.log('2️⃣ Code received, getting tokens...');
                const { tokens } = await oAuth2Client.getToken(code);
                console.log('3️⃣ Tokens received!');

                // Save the tokens to token.json
                const tokenPath = path.join(process.cwd(), 'token.json');
                fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
                console.log('4️⃣ Tokens saved to:', tokenPath);

                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end('<h1>Authentication successful!</h1><p>You can close this window.</p>');
                
                server.close(() => {
                    console.log('✅ Server closed. Process complete!');
                    process.exit(0);
                });
            } else {
                console.log('❌ Invalid path:', parsedUrl.pathname);
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not found');
            }
        } catch (error) {
            console.error('❌ Error in request handler:', error);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('An error occurred: ' + error.message);
            server.close(() => process.exit(1));
        }
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error('❌ Port 3000 is already in use. Please make sure no other servers are running.');
        } else {
            console.error('❌ Server error:', error);
        }
        process.exit(1);
    });

    server.listen(3000, () => {
        console.log('🚀 Temporary server is running on http://localhost:3000\n');
    });

} catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
}