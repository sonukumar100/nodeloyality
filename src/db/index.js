import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDb = async () => {
    try {
        const connectionInstance = await mongoose.connect(
          `${"mongodb+srv://sonukumar7840871141:WichH2pb2NaC89Ce@cluster0.oktsfci.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"}/${DB_NAME}`,
          {
            writeConcern: { w: "majority" },
          }
        );
        console.log("\n MongoDB connected succesfully! \n DB HOST: ",connectionInstance.connection.host);
    } catch (error) {
        console.log('MONGODB connection unsuccessfull!', error);
        process.exit(1);
    }
}

export default connectDb;