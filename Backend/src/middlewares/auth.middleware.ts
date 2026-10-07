import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as {
            id: string;
            name: string;
            email: string;
        };

        req.user = {
            id: decoded.id,
            name: decoded.name,
            email: decoded.email
        };

        next();
    } catch {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
};