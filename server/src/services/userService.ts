import { userRepository } from "../repositories/userRepository";
import { IUser } from "../models/User";

export class UserService {
  /**
   * Retrieve a user by email address
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    return userRepository.findByEmail(email);
  }

  /**
   * Retrieve a user by unique ID
   */
  async getUserById(id: string): Promise<IUser | null> {
    return userRepository.findById(id);
  }

  /**
   * Create a new user
   */
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    return userRepository.create(userData);
  }
}

export const userService = new UserService();
