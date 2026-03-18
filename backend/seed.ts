import mongoose from 'mongoose';
import User from './src/models/User.js';
// Import other models as they are created

const seedDatabase = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lst-app';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // 1. Clear existing data
    await User.deleteMany({});
    
    // 2. Create Demo Users
    const demoUser = await User.create({
      username: 'LST_Dev',
      email: 'dev@lst-app.com',
      password: 'password123', // In real use, hash this
      avatar: 'https://ui-avatars.com/api/?name=LST+Dev&background=8B5CF6&color=fff',
      bio: 'LST Core Developer'
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
