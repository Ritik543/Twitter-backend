
import axios from 'axios';
import { prismaclient } from '../../client/db';
import JWTService from '../Services/jwt';
import { GraphqlContext } from '../../interfaces';
import { User } from '@prisma/client';
import UserService from '../Services/user';
import { redisclient } from '../../client/Redis';




interface GoogleTokenResult {
    iss?: string;
    azp?: string;
    aud?: string;
    sub?: string;
    email?: string;
    email_verified?: string;
    nbf?: string;
    name?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
    iat?: string;
    exp?: string;
    jti?: string;
    alg?: string;
    kid?: string;
    typ?: string;
  }
  


const queries = {
    verifyGoogleToken:async (parent:any,{token}:{token:string})=>{
        const googleToken =token;
       const googleOauthURL= new URL(`https://oauth2.googleapis.com/tokeninfo`)
       googleOauthURL.searchParams.set("id_token",googleToken);
   
   const {data}= await axios.get<GoogleTokenResult>(googleOauthURL.toString(),{
    responseType: 'json'
   });

const user= await prismaclient.user.findUnique({
    where:{email:data.email},
});

if(!user){
    await prismaclient.user.create({
        data : {
            email: `${data.email}`,
            firstName:`${data.given_name}`,
            lastName:data.family_name,
            profileImageURL:data.picture,
        },
    });
}

const UserInDb= await prismaclient.user.findUnique({where:{email:data.email}});
if(!UserInDb) throw new Error(`User with email not found`);

const userToken = JWTService.generateTokenForUser(UserInDb)
   console.log(data);
   return userToken;        //;
    },

    getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
        console.log(ctx);
        const id = ctx.user?.id;
        if (!id) return null;                           // getting user id from context with every request as token is coming with every request as req.headers.authorization
        //                                                  by decoding which we get email and id due to JWTuser interface in jwt.ts 
    
        const user = await prismaclient.user.findUnique({where:{id}})     // here we will get id of user and serach that id in db and return that user that user
                                                                           // will be our current user and will send this data as response on client side to display the information of current user                             
        return user;
      },
      getUserById: async (
        parent: any,
        { id }: { id: string },
        ctx: GraphqlContext
      ) => prismaclient.user.findUnique({where:{id}}),
    };




const extraResolvers = {
    User: {
      tweets: (parent: User) =>
        prismaclient .tweet.findMany({ where: { author: { id: parent.id } } }),
      followers: async (parent: User) => {
        const result = await prismaclient.follows.findMany({
          where: { following: { id: parent.id } },
          include: {
            follower: true,
          },
        });
        return result.map((el) => el.follower);
      },
      following: async (parent: User) => {
        const result = await prismaclient.follows.findMany({
          where: { follower: { id: parent.id } },
          include: {
            following: true,
          },
        });
        return result.map((el) => el.following);
      },
      recommendedUsers: async (parent: User, _: any, ctx: GraphqlContext) => {
        if (!ctx.user) return [];

        const cachedValue = await redisclient.get(
          `RECOMMENDED_USERS:${ctx.user.id}`
        );
  
        if (cachedValue) {
          console.log("Cache Found");
          return JSON.parse(cachedValue);
        }
  
        const myFollowings = await prismaclient.follows.findMany({
          where: {
            follower: { id: ctx.user.id },
          },
          include: {
            following: {
              include: { followers: { include: { following: true } } },
            },
          },
        });
  
        const users: User[] = [];
  
        for (const followings of myFollowings) {
          for (const followingOfFollowedUser of followings.following.followers) {
            if (
              followingOfFollowedUser.following.id !== ctx.user.id &&
              myFollowings.findIndex(
                (e) => e?.followingId === followingOfFollowedUser.following.id
              ) < 0
            ) {
              users.push(followingOfFollowedUser.following);
            }
          }
        }
  
        console.log("Cache Not Found");
        await redisclient.set(
          `RECOMMENDED_USERS:${ctx.user.id}`,
          JSON.stringify(users)
        );
  
        return users;
      },
    }
  



    }




const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");

    await UserService.followUser(ctx.user.id, to);
    // await redisclient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
    await UserService.unfollowUser(ctx.user.id, to);
    // await redisclient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    return true;
  },
};



export const resolvers ={queries,extraResolvers,mutations};
