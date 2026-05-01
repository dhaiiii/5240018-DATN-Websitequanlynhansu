const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const parsed = JSON.parse(data);
        const token = parsed.access_token;
        console.log("Token:", token);

        const statsOptions = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/requests/stats',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const reqStats = http.request(statsOptions, (resStats) => {
            let statsData = '';
            resStats.on('data', chunk => statsData += chunk);
            resStats.on('end', () => {
                require('fs').writeFileSync('test-stats-output.json', statsData);
                console.log("Stats Response written to file.");
            });
        });
        reqStats.end();
    });
});

req.write(JSON.stringify({ email: 'dohonghai252003@gmail.com', password: 'Hai@252003' }));
req.end();
