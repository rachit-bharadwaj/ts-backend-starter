import { Router } from "express";

// controllers
import { health, home } from "../controllers/base";

const baseRoutes = Router();

baseRoutes.get("/", home);
baseRoutes.get("/health", health);

export default baseRoutes;
