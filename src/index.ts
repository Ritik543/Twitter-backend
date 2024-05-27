import { initserver } from "./app";
import  * as dotenv from "dotenv";

dotenv.config();
async function init() {
    const app=  await initserver();
    app.listen(8000,()=> console.log("server listening on 8080"));
}


init(); 