
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UsuarioRepository } from "../usuarios/usuarios.repository.js";
import { ErroHttp } from "../usuarios/usuarios.service.js";

export class AuthService {
  private repository = new UsuarioRepository();

  async login(email: string, senha: string) {
    if (typeof email !== "string" || typeof senha !== "string") {
      throw new ErroHttp(400, "E-mail e senha obrigatórios.");
    }

    const usuario = await this.repository.buscarPorEmail(
      email.trim().toLowerCase()
    );

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
      throw new ErroHttp(401, "Credenciais inválidas.");
    }

    const chave = process.env.JWT_SECRET;

    if (!chave) {
      throw new ErroHttp(500, "JWT_SECRET não configurado.");
    }

    const token = jwt.sign(
      { id: usuario.id_usuario },
      chave,
      { expiresIn: "2h" }
    );

    return {
      mensagem: "Login realizado com sucesso.",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        email: usuario.email
      }
    };
  }
}
