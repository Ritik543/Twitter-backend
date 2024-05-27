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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const db_1 = require("../../client/db");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
// const {storage}=require("../../cloudinary.js");
// const upload = multer({ storage});
const s3Client = new client_s3_1.S3Client({
    // region: process.env.AWS_DEFAULT_REGION,
    region: process.env.AWS_DEFAULT_REGION,
});
const querries = {
    getAllTweets: () => __awaiter(void 0, void 0, void 0, function* () {
        // const cachedTweets = await redisclient.get("ALL_TWEETS");
        // if (cachedTweets) return JSON.parse(cachedTweets);
        const tweets = db_1.prismaclient.tweet.findMany({ orderBy: { createdAt: "desc" } });
        // await redisclient.set("ALL_TWEETS", JSON.stringify(tweets));
        return tweets;
    }),
    getSignedURLForTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { imageType, imageName }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error("Unauthenticated");
        const allowedImageTypes = [
            "image/jpg",
            "image/jpeg",
            "image/png",
            "image/webp",
        ];
        if (!allowedImageTypes.includes(imageType))
            throw new Error("Unsupported Image Type");
        const putObjectCommand = new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            ContentType: imageType,
            Key: `uploads/${ctx.user.id}/tweets/${imageName}-${Date.now()}`,
        });
        const signedURL = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, putObjectCommand);
        return signedURL;
    }),
};
const mutations = {
    createTweet: (parent_2, _b, ctx_2) => __awaiter(void 0, [parent_2, _b, ctx_2], void 0, function* (parent, { payload }, ctx) {
        if (!ctx.user)
            throw new Error("You are not authenticated");
        const tweet = yield db_1.prismaclient.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURL,
                author: { connect: { id: ctx.user.id } }
            }
        });
        // await redisclient.del("ALL_TWEETS");
        //   const tweet = await TweetServi.createTweet({
        //     ...payload,
        //     userId: ctx.user.id,
        //   });
        return tweet;
    }),
};
const extraResolvers = {
    Tweet: {
        author: (parent) => db_1.prismaclient.user.findUnique({ where: { id: parent.authorId } }),
    },
};
exports.resolvers = { mutations, extraResolvers, querries };
