
import { pool } from "../db.js";

export class UsuarioRepository {
  async listar() {
    const resultado = await pool.query(`
      SELECT
        id_usuario,
        nome,
        email,
        data_cadastro,
        foto_perfil,
        biografia
      FROM usuario
      ORDER BY id_usuario
    `);

    return resultado.rows;
  }
}
