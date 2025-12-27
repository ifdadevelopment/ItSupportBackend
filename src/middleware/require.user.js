const requireUser = (req, res, next) => {
    try {
        if (req.user) return next();
        else {
            return res.json({ "error": "Unauthorized User" }).status(401);
        }
    } catch (error) {
        res.json({ "error": "Unauthorized User" }).status(401);
    }
}

export const isAdmin = (req, res, next) => {
    try {
        if (req.user.user_type == 'admin') return next();
        else {
            return res.json(
                { error: "Access denied: This route is restricted to admin users only." }
            ).status(401);
        }
    } catch (error) {
        res.json({ "error": "Access denied: This route is restricted to admin users only." }).status(401);
    }
}

export default requireUser;