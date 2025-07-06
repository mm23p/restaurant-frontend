//import Dexie from 'dexie';
import Dexie from 'dexie';

// Create a new Dexie database instance.
// The name should be unique to your application.
export const db = new Dexie('RestaurantPOS_DB');

// --- Define the Database Schema (Version 1) ---
// This block tells Dexie what tables (object stores) to create
// and which properties to index for fast lookups.
//db.use(liveQuery);

db.version(1).stores({
  /**
   * menuItems: A local cache of the restaurant's menu.
   * This allows for browsing and adding items to an order while offline.
   *
   * 'id': The primary key (from your MySQL table).
   * 'name': Indexed for searching by name.
   * 'category': Indexed for filtering by category.
   * The other fields (price, is_available, etc.) are stored but not indexed
   * because we don't need to search them directly.
   */
  menuItems: 'id, name, category',

  /**
   * users: A local cache of user data, specifically for waiters.
   * This is useful for displaying waiter names or other non-sensitive info offline.
   *
   * 'id': The primary key.
   * 'role': Indexed to quickly find all users with the 'waiter' role.
   */
  //users: 'id, role',
   users: 'id, &username, role',
  /**
   * pendingOrders: This is the critical offline queue.
   * It stores orders created while the application has no internet connection.
   * This table does NOT exist in your remote MySQL database.
   *
   * '++id': An auto-incrementing primary key, managed by Dexie.
   * 'createdAt': Indexed to ensure orders can be synced in the order they were created.
   * The actual order data will be stored as a single object within each record.
   */
  pendingOrders: '++id, createdAt',
  
  /**
   * ingredients: (Optional - for future expansion)
   * If you ever build a recipe management or advanced inventory system,
   * you would cache the ingredients list here.
   *
   * 'id, name'
   */
  // ingredients: 'id, name', // Uncomment if you need this feature later
});

export const getPendingOrderCount = () => {
  return db.liveQuery(() => db.pendingOrders.count());
};

// Note: We do NOT create local tables for 'orders' or 'order_items' because
// they represent finalized data on the server. We only store them locally
// in the 'pendingOrders' queue before they are sent to the server.