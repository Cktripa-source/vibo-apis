// src/controllers/upload.controller.ts
import { Request, Response } from "express";
import path from "path";
import fs from "fs";

export const uploadImage = (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  // Return URL path that frontend can use
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
};
