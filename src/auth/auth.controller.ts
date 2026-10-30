
import type { Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import { tratarErro } from "../usuarios/usuarios.controller.js";

export class AuthController {
  private service = new AuthService();

  login = async (req: Request, res: Response) => {
    try {
      const { email, senha } = req.body ?? {};

      const resultado = await this.service.login(email, senha);

      res.status(200).json(resultado);
    } catch (erro) {
      tratarErro(res, erro);
    }
  };
}
