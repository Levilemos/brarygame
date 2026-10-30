
import { UsuarioRepository } from "./usuarios.repository.js";

export class UsuarioService {
  private repository = new UsuarioRepository();

  async listar() {
    return await this.repository.listar();
  }
}
