import { Prisma, PrismaClient } from "@prisma/client";
import { query } from "express";

 export const prismaclient = new PrismaClient({log:['query']});