import { createHash } from 'crypto';
import type {
  InsertUser,
  InsertJob,
  InsertChat,
  InsertNotification,
  InsertRating,
  User,
  Job,
  Chat,
  Notification,
  Rating
} from '@shared/schema';
import { users, jobs, chats, notifications, ratings } from '@shared/schema';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { eq, and, or, desc, asc, count, sql } from 'drizzle-orm';

interface IStorage {
  // Users
  createUser(data: Omit<InsertUser, 'createdAt' | 'updatedAt'>): Promise<User>;
  getUserById(id: number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: number, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void>;
  updateUserSubscription(id: number, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus: 'active' | 'inactive' | 'trial';
    subscriptionExpiresAt?: Date;
  }): Promise<void>;
  
  // Jobs
  createJob(data: Omit<InsertJob, 'createdAt' | 'updatedAt'>): Promise<Job>;
  getJobById(id: number): Promise<Job | null>;
  getJobs(filters: {
    status?: string;
    cargoType?: string;
    industry?: string;
    pickupCountry?: string;
    deliveryCountry?: string;
    limit?: number;
    offset?: number;
  }): Promise<Job[]>;
  getUserJobs(userId: number, role: 'shipper' | 'carrier'): Promise<Job[]>;
  getJobsByShipper(shipperId: number): Promise<Job[]>;
  getJobsByCarrier(carrierId: number): Promise<Job[]>;
  updateJob(id: number, data: Partial<Omit<Job, 'id' | 'createdAt'>>): Promise<void>;
  takeJob(jobId: number, carrierId: number): Promise<void>;
  completeJob(jobId: number): Promise<void>;
  
  // Chats
  createChat(data: Omit<InsertChat, 'createdAt' | 'updatedAt'>): Promise<Chat>;
  getChatById(id: number): Promise<Chat | null>;
  getChatByJobId(jobId: number): Promise<Chat | null>;
  getUserChats(userId: number): Promise<Chat[]>;
  getChatsByUser(userId: number): Promise<Chat[]>;
  addMessage(chatId: number, senderId: number, content: string): Promise<void>;
  markMessagesAsRead(chatId: number, userId: number): Promise<void>;
  
  // Notifications
  createNotification(data: Omit<InsertNotification, 'createdAt'>): Promise<Notification>;
  getUserNotifications(userId: number, limit?: number): Promise<Notification[]>;
  getNotificationsByUser(userId: number, limit?: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // Ratings
  createRating(data: Omit<InsertRating, 'createdAt'>): Promise<Rating>;
  getUserRatings(userId: number): Promise<Rating[]>;
  getJobRatings(jobId: number): Promise<Rating[]>;
  getUserAverageRating(userId: number): Promise<number>;
  
  // Analytics operations
  getUserCount(role?: string): Promise<number>;
  getJobCount(status?: string): Promise<number>;
  getMonthlyRevenue(): Promise<number>;
}

class PostgreSQLStorage implements IStorage {
  // Users
  async createUser(data: Omit<InsertUser, 'createdAt' | 'updatedAt'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        ...data,
        password: hashedPassword,
      })
      .returning();
    
    return user;
  }

  async getUserById(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    
    return user || null;
  }

  async updateUser(id: number, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<void> {
    await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async updateUserSubscription(id: number, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus: 'active' | 'inactive' | 'trial';
    subscriptionExpiresAt?: Date;
  }): Promise<void> {
    await db
      .update(users)
      .set({
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionExpiresAt: data.subscriptionExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  // Jobs
  async createJob(data: Omit<InsertJob, 'createdAt' | 'updatedAt'>): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values(data)
      .returning();
    
    return job;
  }

  async getJobById(id: number): Promise<Job | null> {
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id));
    
    return job || null;
  }

  async getJobs(filters: {
    status?: string;
    cargoType?: string;
    industry?: string;
    pickupCountry?: string;
    deliveryCountry?: string;
    limit?: number;
    offset?: number;
  }): Promise<Job[]> {
    let query = db.select().from(jobs);
    
    const conditions = [];
    if (filters.status) conditions.push(eq(jobs.status, filters.status as any));
    if (filters.cargoType) conditions.push(eq(jobs.cargoType, filters.cargoType as any));
    if (filters.industry) conditions.push(eq(jobs.industry, filters.industry as any));
    if (filters.pickupCountry) conditions.push(eq(jobs.pickupCountry, filters.pickupCountry as any));
    if (filters.deliveryCountry) conditions.push(eq(jobs.deliveryCountry, filters.deliveryCountry as any));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    query = query.orderBy(desc(jobs.createdAt)) as any;
    
    if (filters.limit) {
      query = query.limit(filters.limit) as any;
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset) as any;
    }
    
    return query;
  }

  async getUserJobs(userId: number, role: 'shipper' | 'carrier'): Promise<Job[]> {
    const condition = role === 'shipper' 
      ? eq(jobs.shipperId, userId)
      : eq(jobs.carrierId, userId);
    
    return db
      .select()
      .from(jobs)
      .where(condition)
      .orderBy(desc(jobs.createdAt));
  }

  async updateJob(id: number, data: Partial<Omit<Job, 'id' | 'createdAt'>>): Promise<void> {
    await db
      .update(jobs)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));
  }

  async takeJob(jobId: number, carrierId: number): Promise<void> {
    await db
      .update(jobs)
      .set({
        carrierId,
        status: 'taken',
        takenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));
  }

  async completeJob(jobId: number): Promise<void> {
    await db
      .update(jobs)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));
  }

  // Chats
  async createChat(data: Omit<InsertChat, 'createdAt' | 'updatedAt'>): Promise<Chat> {
    const [chat] = await db
      .insert(chats)
      .values(data)
      .returning();
    
    return chat;
  }

  async getChatById(id: number): Promise<Chat | null> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, id));
    
    return chat || null;
  }

  async getChatByJobId(jobId: number): Promise<Chat | null> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.jobId, jobId));
    
    return chat || null;
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return db
      .select()
      .from(chats)
      .where(sql`${userId} = ANY(${chats.participants})`)
      .orderBy(desc(chats.updatedAt));
  }

  async addMessage(chatId: number, senderId: number, content: string): Promise<void> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));
    
    if (!chat) throw new Error('Chat not found');
    
    const newMessage = {
      senderId,
      content,
      timestamp: new Date(),
      read: false,
    };
    
    const updatedMessages = [...(chat.messages || []), newMessage];
    
    await db
      .update(chats)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, chatId));
  }

  async markMessagesAsRead(chatId: number, userId: number): Promise<void> {
    const [chat] = await db
      .select()
      .from(chats)
      .where(eq(chats.id, chatId));
    
    if (!chat) return;
    
    const updatedMessages = (chat.messages || []).map(message => ({
      ...message,
      read: message.senderId === userId ? message.read : true,
    }));
    
    await db
      .update(chats)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, chatId));
  }

  // Notifications
  async createNotification(data: Omit<InsertNotification, 'createdAt'>): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    
    return notification;
  }

  async getUserNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  // Ratings
  async createRating(data: Omit<InsertRating, 'createdAt'>): Promise<Rating> {
    const [rating] = await db
      .insert(ratings)
      .values(data)
      .returning();
    
    return rating;
  }

  async getUserRatings(userId: number): Promise<Rating[]> {
    return db
      .select()
      .from(ratings)
      .where(eq(ratings.ratedUserId, userId))
      .orderBy(desc(ratings.createdAt));
  }

  async getJobRatings(jobId: number): Promise<Rating[]> {
    return db
      .select()
      .from(ratings)
      .where(eq(ratings.jobId, jobId));
  }

  async getUserAverageRating(userId: number): Promise<number> {
    const [result] = await db
      .select({
        avgRating: sql<number>`AVG(${ratings.rating})::float`,
      })
      .from(ratings)
      .where(eq(ratings.ratedUserId, userId));
    
    return result?.avgRating || 0;
  }
  
  // Analytics operations
  async getUserCount(role?: string): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(users);
    
    if (role) {
      query = query.where(eq(users.role, role as any)) as any;
    }
    
    const [result] = await query;
    return result?.count || 0;
  }
  
  async getJobCount(status?: string): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(jobs);
    
    if (status) {
      query = query.where(eq(jobs.status, status as any)) as any;
    }
    
    const [result] = await query;
    return result?.count || 0;
  }
  
  async getMonthlyRevenue(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const [result] = await db
      .select({
        totalRevenue: sql<number>`SUM(${jobs.paymentAmount})::float`,
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.status, 'completed'),
          sql`${jobs.completedAt} >= ${startOfMonth}`
        )
      );
    
    return result?.totalRevenue || 0;
  }
  
  // Additional methods needed by routes
  async getJobsByShipper(shipperId: number): Promise<Job[]> {
    return this.getUserJobs(shipperId, 'shipper');
  }
  
  async getJobsByCarrier(carrierId: number): Promise<Job[]> {
    return this.getUserJobs(carrierId, 'carrier');
  }
  
  async getChatsByUser(userId: number): Promise<Chat[]> {
    return this.getUserChats(userId);
  }
  
  async getNotificationsByUser(userId: number, limit: number = 50): Promise<Notification[]> {
    return this.getUserNotifications(userId, limit);
  }
}

export const storage = new PostgreSQLStorage();