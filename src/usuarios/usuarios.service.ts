
import bcrypt from "bcryptjs";
import { UsuarioRepository } from "./usuarios.repository.js";

interface CriarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  apelido?: string;
  foto_perfil?: string | null;
  biografia?: string | null;
}

interface AtualizarUsuarioDTO {
  nome?: string;
  email?: string;
  foto_perfil?: string | null;
  biografia?: string | null;
}

export class ErroHttp extends Error {
  constructor(
    public status: number,
    mensagem: string
  ) {
    super(mensagem);
  }
}

export class UsuarioService {
  private repository = new UsuarioRepository();

  // CREATE
  async criar(dados: CriarUsuarioDTO) {
    const { nome, email, senha, apelido, foto_perfil, biografia } = dados;

    if (
      typeof nome !== "string" || !nome.trim() ||
      typeof email !== "string" || !email.trim() ||
      typeof senha !== "string" || senha.length < 6
    ) {
      throw new ErroHttp(
        400,
        "Informe nome, e-mail e senha de pelo menos 6 caracteres."
      );
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    return this.repository.criar(
      nome.trim(),
      email.trim().toLowerCase(),
      senhaHash,
      typeof apelido === "string" ? apelido.trim() : "",
      foto_perfil ?? null,
      biografia ?? null
    );
  }

  // READ - Listar
  async listar() {
    return this.repository.listar();
  }

  // READ - Buscar por ID
  async buscarPorId(id: number) {
    const usuario = await this.repository.buscarPorId(id);

    if (!usuario) {
      throw new ErroHttp(404, "Usuário não encontrado.");
    }

    return usuario;
  }

  // UPDATE
  async atualizar(id: number, dados: AtualizarUsuarioDTO) {
    if (
      (dados.nome !== undefined &&
        (typeof dados.nome !== "string" || !dados.nome.trim())) ||
      (dados.email !== undefined &&
        (typeof dados.email !== "string" || !dados.email.trim()))
    ) {
      throw new ErroHttp(400, "Nome ou e-mail inválido.");
    }

    const usuario = await this.repository.atualizar(
      id,
      dados.nome?.trim(),
      dados.email?.trim().toLowerCase(),
      dados.foto_perfil,
      dados.biografia
    );

    if (!usuario) {
      throw new ErroHttp(404, "Usuário não encontrado.");
    }

    return usuario;
  }

  // DELETE
  async excluir(id: number) {
    const excluido = await this.repository.excluir(id);

    if (!excluido) {
      throw new ErroHttp(404, "Usuário não encontrado.");
    }
  }
}
