import express  from "express";
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import bodyParser from "body-parser";
import cors from "cors";
// import { prismaclient } from "../client/db";
import { User } from "./User";
import { GraphqlContext } from "../interfaces";
import JWTService from "./Services/jwt";
import{Tweet} from "./Tweet"



 export async function initserver (){

const app = express();
app.use(bodyParser.json());
app.use(cors());




// prismaclient.user.create({
//     data:{
//         lastName:
//     }
// })
const graphqlserver = new ApolloServer <GraphqlContext>({
    typeDefs:`
    ${User.types}
    ${Tweet.types}

    type Query{
   ${User.queries}
   ${Tweet.queries}   

    }
    type Mutation{
      ${Tweet.muatations} 
      ${User.mutations} 
    }
    
    `,
    resolvers:{
        Query:{
           ...User.resolvers.queries , 
           ...Tweet.resolvers.querries
        },
        Mutation:{
          ...Tweet.resolvers.mutations,
          ...User.resolvers.mutations,
        },
        ...Tweet.resolvers.extraResolvers,
        ...User.resolvers.extraResolvers,
        
        
    },
  });
  await graphqlserver.start();

  app.use(
    "/graphql",
    expressMiddleware(graphqlserver, {
      context: async ({ req, res }) => {
        return {
          user: req.headers.authorization
            ? JWTService.decodeToken(                 // decode token to get current user information  on context with every request from client it will check for the req.headers.authorization
                                                      //  which contain json web token by decoding which we get data of user
                req.headers.authorization.split("Bearer ")[1]
              )
            : undefined,
        };
      },
    })
  );
return app;
};