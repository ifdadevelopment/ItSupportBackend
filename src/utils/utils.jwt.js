import jwt from "jsonwebtoken";
const generateTokenByJwt = async (data, option = undefined) => {
    try {
const JWT_SECERET_KEY = process.env.JWT_SECERET_KEY;
        if (typeof data !== 'object' || data === null) {
            throw new Error('Payload must be a valid object.');
        }
        else {
            return jwt.sign(data, JWT_SECERET_KEY, { ...option, algorithm: "HS256" });
        }
    }
    catch (error) {
        throw new Error("Login Failed");
    }
}

const decodeTokenByJwt = async (token) => {
    try {
        const JWT_SECERET_KEY = process.env.JWT_SECERET_KEY;
        const decode = jwt.verify(token, JWT_SECERET_KEY);
        return {
            expired: false,
            valid: true,
            decode
        }
    } catch (error) {
        return {
            expired: true,
            valid: false,
            decode: null
        }
    }
}

export { generateTokenByJwt, decodeTokenByJwt };