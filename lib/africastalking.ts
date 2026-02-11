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

        const data = await response.json();
        console.log('✅ SMS Response:', data);
        return { success: true, data };
    } catch (error) {
        console.error('❌ SMS Error:', error);
        return { success: false, error };
    }
}
