const notificationService = async ({ expoPushToken }) => {
    try {
        await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: expoPushToken,
                sound: 'default',
                title: 'New Ticket Assigned',
                body: 'A new support ticket has been assigned to you.',
            }),
        });
    }
    catch (err) {
    }
}

export default notificationService;