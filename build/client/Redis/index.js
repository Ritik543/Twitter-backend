"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisclient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
exports.redisclient = new ioredis_1.default("rediss://default:AaGFAAIncDFiMDcxYTFiOWY5MjE0NmNlOGVhZjE5Yjc5MzVjNWMxNXAxNDEzNDk@possible-jaybird-41349.upstash.io:6379");
