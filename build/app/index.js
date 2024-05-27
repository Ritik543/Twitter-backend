"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initserver = void 0;
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
// import { prismaclient } from "../client/db";
const User_1 = require("./User");
const jwt_1 = __importDefault(require("./Services/jwt"));
const Tweet_1 = require("./Tweet");
function initserver() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        app.use(body_parser_1.default.json());
        app.use((0, cors_1.default)());
        // prismaclient.user.create({
        //     data:{
        //         lastName:
        //     }
        // })
        const graphqlserver = new server_1.ApolloServer({
            typeDefs: `
    ${User_1.User.types}
    ${Tweet_1.Tweet.types}

    type Query{
   ${User_1.User.queries}
   ${Tweet_1.Tweet.queries}   

    }
    type Mutation{
      ${Tweet_1.Tweet.muatations} 
      ${User_1.User.mutations} 
    }
    
    `,
            resolvers: Object.assign(Object.assign({ Query: Object.assign(Object.assign({}, User_1.User.resolvers.queries), Tweet_1.Tweet.resolvers.querries), Mutation: Object.assign(Object.assign({}, Tweet_1.Tweet.resolvers.mutations), User_1.User.resolvers.mutations) }, Tweet_1.Tweet.resolvers.extraResolvers), User_1.User.resolvers.extraResolvers),
        });
        yield graphqlserver.start();
        app.use("/graphql", (0, express4_1.expressMiddleware)(graphqlserver, {
            context: (_a) => __awaiter(this, [_a], void 0, function* ({ req, res }) {
                return {
                    user: req.headers.authorization
                        ? jwt_1.default.decodeToken(// decode token to get current user information  on context with every request from client it will check for the req.headers.authorization
                        //  which contain json web token by decoding which we get data of user
                        req.headers.authorization.split("Bearer ")[1])
                        : undefined,
                };
            }),
        }));
        return app;
    });
}
exports.initserver = initserver;
;
