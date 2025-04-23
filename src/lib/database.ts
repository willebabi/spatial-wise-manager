import Dexie from 'dexie';

// Define the database
export interface Layout {
  id?: number;
  name: string;
  rows: number;
  columns: number;
  createdAt: Date;
}

export interface Group {
  id?: number;
  name: string;
  layoutId: number;
  column: number;
  row: number;
  rows: number;
  columns: number;
  createdAt: Date;
}

export interface Location {
  id?: number;
  groupId: number;
  layoutId: number;
  row: number;
  column: number;
  address: string;
  isOccupied: boolean;
}

class WMSDatabase extends Dexie {
  layouts: Dexie.Table<Layout, number>;
  groups: Dexie.Table<Group, number>;
  locations: Dexie.Table<Location, number>;

  constructor() {
    super('WMSDatabase');
    this.version(2).stores({
      layouts: '++id, name, createdAt',
      groups: '++id, layoutId, name, column, row, createdAt',
      locations: '++id, groupId, layoutId, row, column, address'
    });
    
    this.layouts = this.table('layouts');
    this.groups = this.table('groups');
    this.locations = this.table('locations');
  }
}

export const db = new WMSDatabase();

export async function initDatabase() {
  // Check if we need to seed the database with initial data
  const layoutCount = await db.layouts.count();
  
  if (layoutCount === 0) {
    console.log('Initializing database with sample data');
    // We could add sample data here if needed
  }
  
  return db;
}

// Layout operations
export async function createLayout(layout: Omit<Layout, 'id' | 'createdAt'>) {
  return await db.layouts.add({
    ...layout,
    createdAt: new Date()
  });
}

export async function getLayouts() {
  return await db.layouts.orderBy('createdAt').reverse().toArray();
}

export async function getLayoutById(id: number) {
  return await db.layouts.get(id);
}

export async function deleteLayout(id: number) {
  // First delete all groups and locations for this layout
  const groups = await db.groups.where({ layoutId: id }).toArray();
  for (const group of groups) {
    if (group.id) {
      await db.locations.where({ groupId: group.id }).delete();
    }
  }
  
  await db.groups.where({ layoutId: id }).delete();
  return await db.layouts.delete(id);
}

// Group operations
export async function createGroup(group: Omit<Group, 'id' | 'createdAt'>) {
  return await db.groups.add({
    ...group,
    createdAt: new Date()
  });
}

export async function getGroupsByLayoutId(layoutId: number) {
  return await db.groups.where({ layoutId }).toArray();
}

export async function deleteGroup(id: number) {
  // First delete all locations for this group
  await db.locations.where({ groupId: id }).delete();
  return await db.groups.delete(id);
}

// Location operations
export async function createLocation(location: Omit<Location, 'id'>) {
  return await db.locations.add(location);
}

export async function getLocationsByGroupId(groupId: number) {
  return await db.locations.where({ groupId }).toArray();
}

export async function getLocationsByLayoutId(layoutId: number) {
  return await db.locations.where({ layoutId }).toArray();
}

export async function updateLocation(id: number, changes: Partial<Location>) {
  return await db.locations.update(id, changes);
}

export async function deleteLocation(id: number) {
  return await db.locations.delete(id);
}
