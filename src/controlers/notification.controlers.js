
export const savePushTokenController = async (req, res) => {
    try {
        const token = req.body.token || req.body.pushToken || req.body.user_token;
        if (!token) {
            return res.status(400).json({ success: false, message: "Push token required in body as 'token' or 'pushToken' or 'user_token'." });
        }
        if (req.user && req.user._id) {
            try {
                const UserModule = await import("../model/user.model.js").catch(() => null);
                const User = UserModule ? (UserModule.default || UserModule) : null;
                if (User && typeof User.findByIdAndUpdate === "function") {
                    await User.findByIdAndUpdate(req.user._id, { user_token: token });
                }
            } catch (e) {
                console.error("notification.controlers: DB update failed", e?.message || e);
            }
        }
        return res.json({ success: true, token });
    } catch (err) {
        console.error("savePushTokenController error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const generatePushTokenController = (req, res) => {
    const generated = `DEBUG_PUSH_TOKEN_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return res.json({ success: true, token: generated });
};