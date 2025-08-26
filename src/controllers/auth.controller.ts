import { Request, Response } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { prisma } from "../config/env";

// DTO for validation
const registerDto = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["ADMIN", "VENDOR", "AFFILIATE", "INFLUENCER", "BUYER"]),
});

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerDto.parse(req.body);

    // check if email exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return res.status(409).json({ message: "Email already used" });
    }

    // hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        passwordHash,
        isVerified: false,
      },
    });

    res
      .status(201)
      .json({ id: user.id, email: user.email, role: user.role });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

const loginDto = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginDto.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Fix: cast secrets as jwt.Secret
    const access = jwt.sign(
      { sub: user.id, role: user.role, name: user.name },
      process.env.JWT_ACCESS_SECRET as Secret,
      { expiresIn: process.env.ACCESS_TOKEN_TTL || "15m" }
    );

    const refresh = jwt.sign(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET as Secret,
      { expiresIn: process.env.REFRESH_TOKEN_TTL || "7d" }
    );

    res.json({ access, refresh });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.status(200).json({
    message:
      "Logged out successfully. Please remove tokens from client storage.",
    success: true,
  });
};
