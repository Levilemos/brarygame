
import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";

import usuarioRoutes from "./usuarios/usuarios.routes.js";
import authRoutes from "./auth/auth.routes.js";

const app = express();

app.use(express.json());

app.use("/usuarios", usuarioRoutes);
app.use("/auth", authRoutes);

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
