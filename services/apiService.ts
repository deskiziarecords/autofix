
import { VehicleRecord, PaymentStatus } from '../types';

// In a real environment, this would be your API endpoint
const API_BASE_URL = '/api';

/**
 * NOTE FOR INTEGRATION:
 * For the purpose of this demonstration, we simulate the PostgreSQL API calls.
 * In a production environment, these would be fetch() calls to a backend server.
 */

export const apiService = {
  async fetchRecords(): Promise<VehicleRecord[]> {
    console.log("PostgreSQL: SELECT * FROM vehicles ORDER BY created_at DESC");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    const saved = localStorage.getItem('autofix_records');
    return saved ? JSON.parse(saved) : [];
  },

  async createRecord(record: VehicleRecord): Promise<VehicleRecord> {
    console.log("PostgreSQL: INSERT INTO vehicles (id, license_plate, ...) VALUES (...)");
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const records = await this.fetchRecords();
    const updated = [record, ...records];
    localStorage.setItem('autofix_records', JSON.stringify(updated));
    return record;
  },

  async updateRecord(updatedRecord: VehicleRecord): Promise<VehicleRecord> {
    console.log(`PostgreSQL: UPDATE vehicles SET status = '${updatedRecord.status}' WHERE id = '${updatedRecord.id}'`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const records = await this.fetchRecords();
    const updated = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    localStorage.setItem('autofix_records', JSON.stringify(updated));
    return updatedRecord;
  },

  async togglePayment(id: string): Promise<VehicleRecord | null> {
    console.log(`PostgreSQL: UPDATE vehicles SET payment_status = ... WHERE id = '${id}'`);
    const records = await this.fetchRecords();
    let updatedRecord: VehicleRecord | null = null;
    
    const updated = records.map(r => {
      if (r.id === id) {
        updatedRecord = {
          ...r,
          paymentStatus: r.paymentStatus === PaymentStatus.PAID ? PaymentStatus.PENDING : PaymentStatus.PAID
        };
        return updatedRecord;
      }
      return r;
    });
    
    localStorage.setItem('autofix_records', JSON.stringify(updated));
    return updatedRecord;
  },

  async fetchInventory(): Promise<any[]> {
    console.log("PostgreSQL: SELECT * FROM inventory");
    await new Promise(resolve => setTimeout(resolve, 500));
    const saved = localStorage.getItem('autofix_inventory');
    return saved ? JSON.parse(saved) : [];
  },

  async updateInventory(inventory: any[]): Promise<void> {
    console.log("PostgreSQL: UPDATE inventory ...");
    await new Promise(resolve => setTimeout(resolve, 300));
    localStorage.setItem('autofix_inventory', JSON.stringify(inventory));
  }
};
