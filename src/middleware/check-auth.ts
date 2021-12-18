import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export default (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization;
    jwt.verify(token!, "x");
    next();
  } catch (error) {
    res.status(401).json({ message: "You are not authenticated" });
  }
};
