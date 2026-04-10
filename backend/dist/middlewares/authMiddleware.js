import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};
