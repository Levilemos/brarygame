
import { Router } from "express";
import { UsuarioController } from "./usuarios.controller.js";
import { autenticar } from "../middlewares/autenticar.js";

const router = Router();
const controller = new UsuarioController();

router.post("/", controller.criar);
router.get("/", controller.listar);
router.get("/:id", controller.buscarPorId);
router.put("/:id", autenticar, controller.atualizar);
router.delete("/:id", autenticar, controller.excluir);

export default router;
