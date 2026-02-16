export async function sendSMS(to: string, message: string) {
    const username = process.env.AT_USERNAME || 'sandbox';
    const apiKey = process.env.AT_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ AfricasTalking API key missing. SMS simulation mode.');
        console.log(`[SMS to ${to}]: ${message}`);
        return { success: true, simulated: true };
    }

    try {
        // AfricasTalking API uses form-urlencoded
        const details = {
            username: username,
            to: to,
            message: message,
        };

        const formBody = Object.entries(details)
            .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(value))
            .join('&');

        const response = await fetch('https://api.africastalking.com/version1/messaging', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'apiKey': apiKey
            },
            body: formBody
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ SMS Gateway Error (${response.status}):`, errorText);

            if (response.status === 401) {
                return {
                    success: false,
                    error: 'Unauthorized: Your AfricasTalking credentials (API Key or Username) are invalid. Please verify them in your dashboard.'
                };
            }

            return { success: false, error: `Gateway Error: ${response.statusText}` };
        }

        const data = await response.json();
        console.log('✅ SMS Response:', data);
        return { success: true, data };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Network connection to SMS gateway failed'
        console.error('❌ SMS Connection Error:', error);
        return { success: false, error: message };
    }
}
