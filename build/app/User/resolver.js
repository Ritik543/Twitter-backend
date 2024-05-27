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
exports.resolvers = void 0;
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../../client/db");
const jwt_1 = __importDefault(require("../Services/jwt"));
const user_1 = __importDefault(require("../Services/user"));
const Redis_1 = require("../../client/Redis");
const queries = {
    verifyGoogleToken: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { token }) {
        const googleToken = token;
        const googleOauthURL = new URL(`https://oauth2.googleapis.com/tokeninfo`);
        googleOauthURL.searchParams.set("id_token", googleToken);
        const { data } = yield axios_1.default.get(googleOauthURL.toString(), {
            responseType: 'json'
        });
        const user = yield db_1.prismaclient.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            yield db_1.prismaclient.user.create({
                data: {
                    email: `${data.email}`,
                    firstName: `${data.given_name}`,
                    lastName: data.family_name,
                    profileImageURL: data.picture,
                },
            });
        }
        const UserInDb = yield db_1.prismaclient.user.findUnique({ where: { email: data.email } });
        if (!UserInDb)
            throw new Error(`User with email not found`);
        const userToken = jwt_1.default.generateTokenForUser(UserInDb);
        console.log(data);
        return userToken; //;
    }),
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        console.log(ctx);
        const id = (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!id)
            return null; // getting user id from context with every request as token is coming with every request as req.headers.authorization
        //                                                  by decoding which we get email and id due to JWTuser interface in jwt.ts 
        const user = yield db_1.prismaclient.user.findUnique({ where: { id } }); // here we will get id of user and serach that id in db and return that user that user
        // will be our current user and will send this data as response on client side to display the information of current user                             
        return user;
    }),
    getUserById: (parent_2, _c, ctx_1) => __awaiter(void 0, [parent_2, _c, ctx_1], void 0, function* (parent, { id }, ctx) { return db_1.prismaclient.user.findUnique({ where: { id } }); }),
};
const extraResolvers = {
    User: {
        tweets: (parent) => db_1.prismaclient.tweet.findMany({ where: { author: { id: parent.id } } }),
        followers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaclient.follows.findMany({
                where: { following: { id: parent.id } },
                include: {
                    follower: true,
                },
            });
            return result.map((el) => el.follower);
        }),
        following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield db_1.prismaclient.follows.findMany({
                where: { follower: { id: parent.id } },
                include: {
                    following: true,
                },
            });
            return result.map((el) => el.following);
        }),
        recommendedUsers: (parent, _, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            if (!ctx.user)
                return [];
            const cachedValue = yield Redis_1.redisclient.get(`RECOMMENDED_USERS:${ctx.user.id}`);
            if (cachedValue) {
                console.log("Cache Found");
                return JSON.parse(cachedValue);
            }
            const myFollowings = yield db_1.prismaclient.follows.findMany({
                where: {
                    follower: { id: ctx.user.id },
                },
                include: {
                    following: {
                        include: { followers: { include: { following: true } } },
                    },
                },
            });
            const users = [];
            for (const followings of myFollowings) {
                for (const followingOfFollowedUser of followings.following.followers) {
                    if (followingOfFollowedUser.following.id !== ctx.user.id &&
                        myFollowings.findIndex((e) => (e === null || e === void 0 ? void 0 : e.followingId) === followingOfFollowedUser.following.id) < 0) {
                        users.push(followingOfFollowedUser.following);
                    }
                }
            }
            console.log("Cache Not Found");
            yield Redis_1.redisclient.set(`RECOMMENDED_USERS:${ctx.user.id}`, JSON.stringify(users));
            return users;
        }),
    }
};
const mutations = {
    followUser: (parent_3, _d, ctx_2) => __awaiter(void 0, [parent_3, _d, ctx_2], void 0, function* (parent, { to }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unauthenticated");
        yield user_1.default.followUser(ctx.user.id, to);
        // await redisclient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    }),
    unfollowUser: (parent_4, _e, ctx_3) => __awaiter(void 0, [parent_4, _e, ctx_3], void 0, function* (parent, { to }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unauthenticated");
        yield user_1.default.unfollowUser(ctx.user.id, to);
        // await redisclient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
        return true;
    }),
};
exports.resolvers = { queries, extraResolvers, mutations };
