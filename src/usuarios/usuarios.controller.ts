
import type { Request, Response } from "express";
import { UsuarioService, ErroHttp } from "./usuarios.service.js";

export function tratarErro(res: Response, erro: unknown) {
  console.error(erro);

  if (erro instanceof ErroHttp) {
    res.status(erro.status).json({ erro: erro.message });
    return;
  }

  const codigo = (erro as { code?: string })?.code;

  if (codigo === "23505") {
    res.status(409).json({ erro: "Registro duplicado." });
    return;
  }

  if (codigo === "23503") {
    res.status(409).json({ erro: "Registro possui vínculos no banco." });
    return;
  }

  res.status(500).json({ erro: "Erro interno no servidor." });
}

export class UsuarioController {
  private service = new UsuarioService();

  criar = async (req: Request, res: Response) => {
    try {
      const usuario = await this.service.criar(req.body);
      res.status(201).json(usuario);
    } catch (erro) {
      tratarErro(res, erro);
    }
  };

  listar = async (_req: Request, res: Response) => {
    try {
      const usuarios = await this.service.listar();
      res.status(200).json(usuarios);
    } catch (erro) {
      tratarErro(res, erro);
    }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const id = this.validarId(req);
      const usuario = await this.service.buscarPorId(id);
      res.status(200).json(usuario);
    } catch (erro) {
      tratarErro(res, erro);
    }
  };

  atualizar = async (req: Request, res: Response) => {
    try {
      const id = this.validarId(req);
      const usuario = await this.service.atualizar(id, req.body);
      res.status(200).json(usuario);
    } catch (erro) {
      tratarErro(res, erro);
    }
  };

  excluir = async (req: Request, res: Response) => {
    try {
      const id = this.validarId(req);
      await this.service.excluir(id);
      res.status(204).send();
    } catch (erro) {
      tratarErro(res, erro);
    }
  };

  private validarId(req: Request): number {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new ErroHttp(400, "ID inválido.");
    }

    return id;
  }
}
