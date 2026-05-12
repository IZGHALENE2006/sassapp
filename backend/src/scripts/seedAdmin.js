const connectDb = require("../config/db");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    await connectDb();

    const email = process.env.ADMIN_EMAIL || "admin@clinic.local";
    const password = process.env.ADMIN_PASSWORD || "Admin123!";

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Admin already exists: ${email}`);
      process.exit(0);
    }

    await User.create({
      name: "System Admin",
      email,
      password,
      role: "admin"
    });

    console.log(`Admin created: ${email}`);
    process.exit(0);
  } catch (err) {
    console.error("Admin seed failed:", err.message);
    process.exit(1);
  }
};

seedAdmin();
