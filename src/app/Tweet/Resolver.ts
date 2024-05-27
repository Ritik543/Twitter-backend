import { Tweet } from "@prisma/client";
import { prismaclient } from "../../client/db";
import { GraphqlContext } from "../../interfaces";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { redisclient } from "../../client/Redis";
// const {storage}=require("../../cloudinary.js");
// const upload = multer({ storage});



const s3Client = new S3Client({
  // region: process.env.AWS_DEFAULT_REGION,
  region: process.env.AWS_DEFAULT_REGION,
  
})

export interface CreateTweetPayload {
    content: string;
    imageURL?: string;
    // userId: string;
  }


   const querries={
    getAllTweets: async ()=> {
      // const cachedTweets = await redisclient.get("ALL_TWEETS");
    // if (cachedTweets) return JSON.parse(cachedTweets);
      const tweets= prismaclient.tweet.findMany({orderBy:{createdAt:"desc"}});


      // await redisclient.set("ALL_TWEETS", JSON.stringify(tweets));
      return tweets;
    },
      



    getSignedURLForTweet: async (
      parent: any,
      { imageType, imageName }: { imageType: string; imageName: string },
      ctx: GraphqlContext
    ) => {
      if (!ctx.user || !ctx.user.id) throw new Error("Unauthenticated");
      const allowedImageTypes = [
        "image/jpg",
        "image/jpeg",
        "image/png",
        "image/webp",
      ];
  
      if (!allowedImageTypes.includes(imageType))
        throw new Error("Unsupported Image Type");
  
      const putObjectCommand = new PutObjectCommand({

        Bucket: process.env.AWS_S3_BUCKET,
        ContentType: imageType,
        Key: `uploads/${ctx.user.id}/tweets/${imageName}-${Date.now()}`,
      });
  
      const signedURL = await getSignedUrl(s3Client, putObjectCommand);
  
      return signedURL;
    },
  }

const mutations = {
    createTweet: async (
      parent: any,
      { payload }: { payload: CreateTweetPayload },
      ctx: GraphqlContext
    ) => {
      if (!ctx.user) throw new Error("You are not authenticated");

 const tweet = await prismaclient.tweet.create({
    data:{
        content:payload.content,
        imageURL:payload.imageURL,
        author:{connect:{id:ctx.user.id}}
    }
    
}); 
// await redisclient.del("ALL_TWEETS");

    //   const tweet = await TweetServi.createTweet({
    //     ...payload,
    //     userId: ctx.user.id,
    //   });
  
      return tweet;
    },
  };

  const extraResolvers = {
    Tweet: {
      author: (parent: Tweet) => prismaclient.user.findUnique({where:{id:parent.authorId}}),
    },
  };
   export const resolvers= {mutations,extraResolvers, querries}