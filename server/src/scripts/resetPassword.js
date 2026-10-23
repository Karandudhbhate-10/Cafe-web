import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../server/.env') });

import { User } from '../models/User.js';
import { MONGODB_URI } from '../config/env.js';

async function resetAdminPassword() {
  const newPassword = process.argv[2] || 'admin123';
  const username = process.argv[3] || 'admin';

  console.log(`\n========================================`);
  console.log(` BREW & BEAN — Emergency Password Reset `);
  console.log(`========================================`);
  console.log(`[1] Connecting to MongoDB...`);

  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`[2] Connected successfully.`);

    const user = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
    });

    if (!user) {
      console.error(`[ERROR] User "${username}" not found in database.`);
      process.exit(1);
    }

    user.password = newPassword;
    await user.save();

    console.log(`[3] Success! Admin password has been reset.`);
    console.log(`----------------------------------------`);
    console.log(`Username : ${user.username}`);
    console.log(`Password : ${newPassword}`);
    console.log(`URL      : http://localhost:5173/admin/login`);
    console.log(`----------------------------------------\n`);
  } catch (err) {
    console.error(`[ERROR] Failed to reset password:`, err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetAdminPassword();
