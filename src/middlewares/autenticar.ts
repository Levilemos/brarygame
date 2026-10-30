
import type {
  Request,
  Response,
  NextFunction
} from "express";

import jwt from "jsonwebtoken";

export function autenticar(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  const chave = process.env.JWT_SECRET;

  if (!token) {
    res.status(401).json({ erro: "Token obrigatório." });
    return;
  }

  if (!chave) {
    res.status(500).json({ erro: "JWT_SECRET não configurado." });
    return;
  }

  try {
    const dados = jwt.verify(token, chave) as jwt.JwtPayload;

    if (String(dados.id) !== String(req.params.id)) {
      res.status(403).json({
        erro: "Você só pode alterar sua própria conta."
      });
      return;
    }

    next();
  } catch {
    res.status(401).json({
      erro: "Token inválido ou expirado."
    });
  }
}
