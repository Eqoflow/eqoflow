// Minimal diagnostic version to identify the issue
Deno.serve(async (req) => {
    try {
        // Step 1: Basic response test
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        
        // Return a simple diagnostic page
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>GitHub Callback Diagnostic</title>
            </head>
            <body>
                <h1>Function is Running!</h1>
                <p><strong>Code:</strong> ${code}</p>
                <p><strong>State (Email):</strong> ${state}</p>
                <p><strong>Environment Check:</strong></p>
                <ul>
                    <li>GITHUB_CLIENT_ID: ${Deno.env.get('GITHUB_CLIENT_ID') ? 'Found' : 'Missing'}</li>
                    <li>GITHUB_CLIENT_SECRET: ${Deno.env.get('GITHUB_CLIENT_SECRET') ? 'Found' : 'Missing'}</li>
                    <li>BASE44_SERVICE_ROLE_KEY: ${Deno.env.get('BASE44_SERVICE_ROLE_KEY') ? 'Found' : 'Missing'}</li>
                    <li>BASE44_APP_ID: ${Deno.env.get('BASE44_APP_ID') ? 'Found' : 'Missing'}</li>
                </ul>
                <p>If you can see this page, the function is working. The blank screen was caused by something else.</p>
                <script>
                    // Try to close the popup after 5 seconds
                    setTimeout(() => {
                        if (window.opener) {
                            window.close();
                        }
                    }, 5000);
                </script>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' },
        });

    } catch (error) {
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head><title>Error Diagnostic</title></head>
            <body>
                <h1>Function Error</h1>
                <p><strong>Error:</strong> ${error.message}</p>
                <p><strong>Stack:</strong> ${error.stack}</p>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' },
        });
    }
});