
import { pool } from "../db.js";

const camposPublicos =
  "id_usuario, nome, email, data_cadastro, foto_perfil, biografia";

export class UsuarioRepository {

  // Cadastrar usuário e seu papel de jogador
  async criar(
    nome: string,
    email: string,
    senhaHash: string,
    apelido: string,
    fotoPerfil: string | null,
    biografia: string | null
  ) {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const resultado = await client.query(
        `INSERT INTO usuario
          (nome, email, senha_hash, foto_perfil, biografia)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${camposPublicos}`,
        [nome, email, senhaHash, fotoPerfil, biografia]
      );

      const usuario = resultado.rows[0];

      await client.query(
        `INSERT INTO jogador (id_usuario, apelido)
         VALUES ($1, $2)`,
        [usuario.id_usuario, apelido || `Jogador${usuario.id_usuario}`]
      );

      await client.query("COMMIT");
      return usuario;

    } catch (erro) {
      await client.query("ROLLBACK");
      throw erro;
    } finally {
      client.release();
    }
  }

  // Listar todos os usuários
  async listar() {
    const resultado = await pool.query(
      `SELECT ${camposPublicos}
       FROM usuario
       ORDER BY id_usuario`
    );

    return resultado.rows;
  }

  // Buscar usuário pelo ID
  async buscarPorId(id: number) {
    const resultado = await pool.query(
      `SELECT ${camposPublicos}
       FROM usuario
       WHERE id_usuario = $1`,
      [id]
    );

    return resultado.rows[0] ?? null;
  }

  // Buscar e-mail e hash para autenticação
  async buscarPorEmail(email: string) {
    const resultado = await pool.query(
      `SELECT id_usuario, email, senha_hash
       FROM usuario
       WHERE email = $1`,
      [email]
    );

    return resultado.rows[0] ?? null;
  }

  // Atualizar os dados de um usuário
  async atualizar(
    id: number,
    nome?: string,
    email?: string,
    fotoPerfil?: string | null,
    biografia?: string | null
  ) {
    const resultado = await pool.query(
      `UPDATE usuario
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           foto_perfil =
             CASE WHEN $3 THEN $4 ELSE foto_perfil END,
           biografia =
             CASE WHEN $5 THEN $6 ELSE biografia END
       WHERE id_usuario = $7
       RETURNING ${camposPublicos}`,
      [
        nome ?? null,
        email ?? null,
        fotoPerfil !== undefined,
        fotoPerfil ?? null,
        biografia !== undefined,
        biografia ?? null,
        id
      ]
    );

    return resultado.rows[0] ?? null;
  }

  // Excluir usuário
  async excluir(id: number) {
    const resultado = await pool.query(
      `DELETE FROM usuario
       WHERE id_usuario = $1
       RETURNING id_usuario`,
      [id]
    );

    return (resultado.rowCount ?? 0) > 0;
  }
}
