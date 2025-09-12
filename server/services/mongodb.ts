import { MongoClient, Db, ObjectId } from 'mongodb';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

class MongoDB {
  private client: MongoClient;
  private db: Db | null = null;

  constructor() {
    this.client = new MongoClient(process.env.DATABASE_URL!);
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db('loadlink-africa');
      console.log('Connected to MongoDB');
      
      // Create indexes for better performance
      await this.createIndexes();
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    if (!this.db) return;

    try {
      // User indexes
      await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await this.db.collection('users').createIndex({ role: 1 });
      await this.db.collection('users').createIndex({ subscriptionStatus: 1 });

      // Job indexes
      await this.db.collection('jobs').createIndex({ status: 1 });
      await this.db.collection('jobs').createIndex({ cargoType: 1 });
      await this.db.collection('jobs').createIndex({ industry: 1 });
      await this.db.collection('jobs').createIndex({ pickupCountry: 1 });
      await this.db.collection('jobs').createIndex({ deliveryCountry: 1 });
      await this.db.collection('jobs').createIndex({ createdAt: -1 });
      await this.db.collection('jobs').createIndex({ shipperId: 1 });
      await this.db.collection('jobs').createIndex({ carrierId: 1 });

      // Chat indexes
      await this.db.collection('chats').createIndex({ jobId: 1 });
      await this.db.collection('chats').createIndex({ participants: 1 });

      // Notification indexes
      await this.db.collection('notifications').createIndex({ userId: 1 });
      await this.db.collection('notifications').createIndex({ read: 1 });
      await this.db.collection('notifications').createIndex({ createdAt: -1 });

      // Rating indexes
      await this.db.collection('ratings').createIndex({ jobId: 1 });
      await this.db.collection('ratings').createIndex({ ratedUserId: 1 });

      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log('Disconnected from MongoDB');
  }

  // Utility method to convert string ID to ObjectId
  toObjectId(id: string): ObjectId {
    return new ObjectId(id);
  }

  // Utility method to convert ObjectId to string
  toString(objectId: ObjectId): string {
    return objectId.toString();
  }
}

export const mongodb = new MongoDB();
