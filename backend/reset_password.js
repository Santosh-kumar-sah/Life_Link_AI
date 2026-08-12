import mongoose from "mongoose";
import connectDB from "./src/config/db.js";
import User from "./src/features/auth/user.model.js";

async function run() {
  const email = process.argv[2];
  const newPassword = process.argv[3];
  
  if (!email || !newPassword) {
    console.error("Usage: node reset_password.js <email> <new_password>");
    process.exit(1);
  }
  
  await connectDB();
  
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    console.error(`Error: User with email '${email}' not found.`);
  } else {
    user.password = newPassword;
    await user.save();
    console.log(`Successfully updated password for '${email}'!`);
  }
  
  await mongoose.connection.close();
}

run().catch(console.error);
