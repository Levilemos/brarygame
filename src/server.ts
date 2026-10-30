
import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import swaggerUi from "swagger-ui-express";
import { pool } from "./db.js";

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("Configure JWT_SECRET no .env");
}

const camposPublicos =
  "id_usuario, nome, email, data_cadastro, foto_perfil, biografia";

function erroBanco(res: Response, erro: unknown) {
  console.error(erro);
  const codigo = (erro as { code?: string }).code;

  if (codigo === "23505") {
    res.status(409).json({ erro: "Registro duplicado, verifique o e-mail." });
  } else if (codigo === "23503") {
    res.status(409).json({ erro: "Registro possui vínculos no banco." });
  } else {
    res.status(500).json({ erro: "Erro interno no servidor." });
  }
}

function obterId(req: Request, res: Response): number | null {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    res.status(400).json({ erro: "ID inválido." });
    return null;
  }
  return id;
}

function autenticar(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    res.status(401).json({ erro: "Token obrigatório." });
    return;
  }

  try {
    const dados = jwt.verify(token, JWT_SECRET!) as jwt.JwtPayload;

    if (String(dados.id) !== String(req.params.id)) {
      res.status(403).json({ erro: "Você só pode alterar sua própria conta." });
      return;
    }

    next();
  } catch {
    res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}

// CREATE - Cadastro de usuário e jogador na mesma transação
app.post("/usuarios", async (req, res) => {
  const { nome, email, senha, apelido, foto_perfil, biografia } = req.body;

  if (
    typeof nome !== "string" || !nome.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof senha !== "string" || senha.length < 6
  ) {
    res.status(400).json({
      erro: "Informe nome, e-mail e senha de pelo menos 6 caracteres."
    });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const senhaHash = await bcrypt.hash(senha, 10);

    const resultado = await client.query(
      `INSERT INTO usuario
        (nome, email, senha_hash, foto_perfil, biografia)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${camposPublicos}`,
      [
        nome.trim(),
        email.trim().toLowerCase(),
        senhaHash,
        foto_perfil ?? null,
        biografia ?? null
      ]
    );

    const usuario = resultado.rows[0];

    await client.query(
      "INSERT INTO jogador (id_usuario, apelido) VALUES ($1, $2)",
      [usuario.id_usuario, apelido?.trim() || `Jogador${usuario.id_usuario}`]
    );

    await client.query("COMMIT");
    res.status(201).json(usuario);
  } catch (erro) {
    await client.query("ROLLBACK");
    erroBanco(res, erro);
  } finally {
    client.release();
  }
});

// READ - Listar usuários
app.get("/usuarios", async (_req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT ${camposPublicos} FROM usuario ORDER BY id_usuario`
    );
    res.json(resultado.rows);
  } catch (erro) {
    erroBanco(res, erro);
  }
});

// READ - Buscar usuário por ID
app.get("/usuarios/:id", async (req, res) => {
  const id = obterId(req, res);
  if (id === null) return;

  try {
    const resultado = await pool.query(
      `SELECT ${camposPublicos} FROM usuario WHERE id_usuario = $1`,
      [id]
    );

    if (resultado.rowCount === 0) {
      res.status(404).json({ erro: "Usuário não encontrado." });
      return;
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    erroBanco(res, erro);
  }
});

// UPDATE - Editar usuário autenticado
app.put("/usuarios/:id", autenticar, async (req, res) => {
  const id = obterId(req, res);
  if (id === null) return;

  const { nome, email, foto_perfil, biografia } = req.body;

  if (
    (nome !== undefined && (typeof nome !== "string" || !nome.trim())) ||
    (email !== undefined && (typeof email !== "string" || !email.trim()))
  ) {
    res.status(400).json({ erro: "Nome ou e-mail inválido." });
    return;
  }

  try {
    const resultado = await pool.query(
      `UPDATE usuario
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           foto_perfil = CASE WHEN $3 THEN $4 ELSE foto_perfil END,
           biografia = CASE WHEN $5 THEN $6 ELSE biografia END
       WHERE id_usuario = $7
       RETURNING ${camposPublicos}`,
      [
        nome?.trim() ?? null,
        email?.trim().toLowerCase() ?? null,
        foto_perfil !== undefined,
        foto_perfil ?? null,
        biografia !== undefined,
        biografia ?? null,
        id
      ]
    );

    if (resultado.rowCount === 0) {
      res.status(404).json({ erro: "Usuário não encontrado." });
      return;
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    erroBanco(res, erro);
  }
});

// DELETE - Excluir usuário autenticado
app.delete("/usuarios/:id", autenticar, async (req, res) => {
  const id = obterId(req, res);
  if (id === null) return;

  try {
    const resultado = await pool.query(
      "DELETE FROM usuario WHERE id_usuario = $1 RETURNING id_usuario",
      [id]
    );

    if (resultado.rowCount === 0) {
      res.status(404).json({ erro: "Usuário não encontrado." });
      return;
    }

    res.status(204).send();
  } catch (erro) {
    erroBanco(res, erro);
  }
});

// LOGIN - Verificar senha e gerar JWT
app.post("/auth/login", async (req, res) => {
  const { email, senha } = req.body;

  if (typeof email !== "string" || typeof senha !== "string") {
    res.status(400).json({ erro: "E-mail e senha obrigatórios." });
    return;
  }

  try {
    const resultado = await pool.query(
      "SELECT id_usuario, email, senha_hash FROM usuario WHERE email = $1",
      [email.trim().toLowerCase()]
    );

    const usuario = resultado.rows[0];

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
      res.status(401).json({ erro: "Credenciais inválidas." });
      return;
    }

    const token = jwt.sign(
      { id: usuario.id_usuario },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      mensagem: "Login realizado com sucesso.",
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        email: usuario.email
      }
    });
  } catch (erro) {
    erroBanco(res, erro);
  }
});

// Documentação OpenAPI
const idParametro = [{
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer" }
}];

const corpoUsuario = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        required: ["nome", "email", "senha"],
        properties: {
          nome: { type: "string", example: "Pedro" },
          email: { type: "string", example: "pedro@exemplo.com" },
          senha: { type: "string", example: "123456" },
          apelido: { type: "string", example: "PedroGamer" }
        }
      }
    }
  }
};

const corpoLogin = {
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          email: { type: "string", example: "pedro@exemplo.com" },
          senha: { type: "string", example: "123456" }
        }
      }
    }
  }
};

const swagger = {
  openapi: "3.0.0",
  info: {
    title: "BraryGame API",
    version: "1.0.0",
    description: "Entrega 1 - CRUD de Usuario e autenticação"
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/usuarios": {
      post: {
        summary: "Cadastrar usuário",
        requestBody: corpoUsuario,
        responses: { 201: { description: "Usuário criado" } }
      },
      get: {
        summary: "Listar usuários",
        responses: { 200: { description: "Lista de usuários" } }
      }
    },
    "/usuarios/{id}": {
      get: {
        summary: "Buscar usuário por ID",
        parameters: idParametro,
        responses: { 200: { description: "Usuário encontrado" } }
      },
      put: {
        summary: "Atualizar usuário",
        security: [{ bearerAuth: [] }],
        parameters: idParametro,
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nome: { type: "string", example: "Pedro Atualizado" },
                  email: { type: "string" },
                  biografia: { type: "string" },
                  foto_perfil: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Usuário atualizado" } }
      },
      delete: {
        summary: "Excluir usuário",
        security: [{ bearerAuth: [] }],
        parameters: idParametro,
        responses: { 204: { description: "Usuário excluído" } }
      }
    },
    "/auth/login": {
      post: {
        summary: "Realizar login",
        requestBody: corpoLogin,
        responses: { 200: { description: "Token JWT gerado" } }
      }
    }
  }
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger));

app.get("/health", (_req, res) => {
  res.json({ mensagem: "BraryGame funcionando!" });
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(`BraryGame: http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});
