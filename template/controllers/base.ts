import { Request, Response } from "express";
import { API_VERSION, NODE_ENV, PORT, TIMESTAMP } from "../constants/config";
import { getLocalIpAddress } from "../utils/config";

export const home = async (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to TS Backend Starter",
    version: API_VERSION,
    timestamp: TIMESTAMP,
    environment: NODE_ENV,
    ipAddress: getLocalIpAddress(),
    port: PORT,
    status: "Server is up and running",
  });
};

export const health = async (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Server is up and running",
    timestamp: TIMESTAMP,
    environment: NODE_ENV,
  });
};
