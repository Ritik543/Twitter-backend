"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tweet = void 0;
const types_1 = require("./types");
const mutations_1 = require("./mutations");
const querry_1 = require("./querry");
const Resolver_1 = require("./Resolver");
exports.Tweet = { types: types_1.types, resolvers: Resolver_1.resolvers, muatations: mutations_1.muatations, queries: querry_1.queries };
