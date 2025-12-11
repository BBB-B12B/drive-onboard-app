// A mock database for users.
// In a real application, you would use a database like PostgreSQL, MongoDB, etc.
import type { User } from '@/lib/types';

let users: User[] = [
  {
    id: 'user-admin-001',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    password: 'password', // In a real app, passwords should be hashed
  },
  {
    id: 'user-driver-001',
    name: 'Driver 1',
    email: 'driver1@example.com',
    role: 'employee',
    password: 'password',
  },
  {
    id: 'user-driver-002',
    name: 'Driver 2',
    email: 'driver2@example.com',
    role: 'employee',
    password: 'password',
  },
];

export const getUsers = () => users;

export const getUserById = (id: string) => users.find((user) => user.id === id);

export const getUserByEmail = (email: string) => users.find((user) => user.email === email);

export const addUser = (user: Omit<User, 'id'>) => {
  const newUser = { ...user, id: `user-${Date.now()}` };
  users.push(newUser);
  return newUser;
};

export const updateUser = (id: string, updatedUser: Partial<User>) => {
  users = users.map((user) => (user.id === id ? { ...user, ...updatedUser } : user));
  return getUserById(id);
};

export const deleteUser = (id: string) => {
  users = users.filter((user) => user.id !== id);
  return true;
};
