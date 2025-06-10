// src/store/userCarsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MaintenanceRecord {
  id: string;
  description: string;
  date: string;
  mileage: number;
  cost: number;
  type: 'routine' | 'repair' | 'inspection' | 'other';
  notes?: string;
  nextDueDate?: string;
  nextDueMileage?: number;
  workshopName?: string;
  parts?: string[];
  status: 'completed' | 'scheduled' | 'overdue';
}

export interface Expense {
  id: string;
  description: string;
  date: string;
  amount: number;
  category: 'fuel' | 'maintenance' | 'insurance' | 'parking' | 'toll' | 'other';
  mileage?: number;
  notes?: string;
  receipt?: string; // URL o path dell'immagine dello scontrino
}

export interface Document {
  id: string;
  name: string;
  type: 'insurance' | 'registration' | 'inspection' | 'warranty' | 'other';
  issueDate: string;
  expiryDate?: string;
  documentNumber?: string;
  issuer?: string;
  fileUrl?: string;
  notes?: string;
}

export interface FuelRecord {
  id: string;
  date: string;
  mileage: number;
  liters: number;
  costPerLiter: number;
  totalCost: number;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  isFullTank: boolean;
  stationName?: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  type: 'maintenance' | 'document' | 'inspection' | 'custom';
  dueDate?: string;
  dueMileage?: number;
  isActive: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface UserCar {
  id: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate: string;
  vin?: string;
  
  // Dati di acquisto
  purchaseDate?: string;
  purchasePrice?: number;
  purchaseMileage?: number;
  
  // Stato attuale
  currentMileage: number;
  lastUpdatedMileage: string; // data ultimo aggiornamento km
  
  // Assicurazione
  insuranceCompany?: string;
  insurancePolicy?: string;
  insuranceExpiry?: string;
  
  // Record collegati
  maintenanceRecords: MaintenanceRecord[];
  expenses: Expense[];
  documents: Document[];
  fuelRecords: FuelRecord[];
  reminders: Reminder[];
  
  // Metadati
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  imageUrl?: string; // Foto dell'auto
}

export interface CarStats {
  totalExpenses: number;
  maintenanceCount: number;
  avgFuelConsumption?: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  kmSinceLastMaintenance?: number;
  nextMaintenanceDate?: string;
  nextMaintenanceMileage?: number;
}

interface UserCarsStore {
  cars: UserCar[];
  
  // Metodi per auto
  addCar: (car: Omit<UserCar, 'id' | 'createdAt' | 'updatedAt' | 'maintenanceRecords' | 'expenses' | 'documents' | 'fuelRecords' | 'reminders'>) => string;
  updateCar: (carId: string, data: Partial<Omit<UserCar, 'id' | 'createdAt'>>) => void;
  deleteCar: (carId: string) => void;
  getCarById: (carId: string) => UserCar | undefined;
  updateMileage: (carId: string, mileage: number) => void;
  
  // Metodi per manutenzioni
  addMaintenance: (carId: string, maintenance: Omit<MaintenanceRecord, 'id'>) => string;
  updateMaintenance: (carId: string, maintenanceId: string, data: Partial<Omit<MaintenanceRecord, 'id'>>) => void;
  deleteMaintenance: (carId: string, maintenanceId: string) => void;
  
  // Metodi per spese
  addExpense: (carId: string, expense: Omit<Expense, 'id'>) => string;
  updateExpense: (carId: string, expenseId: string, data: Partial<Omit<Expense, 'id'>>) => void;
  deleteExpense: (carId: string, expenseId: string) => void;
  
  // Metodi per carburante
  addFuelRecord: (carId: string, fuelRecord: Omit<FuelRecord, 'id'>) => string;
  updateFuelRecord: (carId: string, fuelRecordId: string, data: Partial<Omit<FuelRecord, 'id'>>) => void;
  deleteFuelRecord: (carId: string, fuelRecordId: string) => void;
  
  // Metodi per documenti
  addDocument: (carId: string, document: Omit<Document, 'id'>) => string;
  updateDocument: (carId: string, documentId: string, data: Partial<Omit<Document, 'id'>>) => void;
  deleteDocument: (carId: string, documentId: string) => void;
  
  // Metodi per promemoria
  addReminder: (carId: string, reminder: Omit<Reminder, 'id' | 'createdAt'>) => string;
  updateReminder: (carId: string, reminderId: string, data: Partial<Omit<Reminder, 'id' | 'createdAt'>>) => void;
  deleteReminder: (carId: string, reminderId: string) => void;
  completeReminder: (carId: string, reminderId: string) => void;
  
  // Metodi di analisi e statistiche
  getCarStats: (carId: string) => CarStats;
  getAllCarsStats: () => {
    totalCars: number;
    totalExpenses: number;
    totalMileage: number;
    avgExpensePerCar: number;
    carsNeedingAttention: number;
    activeReminders: number;
  };
  
  // Metodi per manutenzioni scadute/prossime
  getOverdueMaintenance: (carId?: string) => MaintenanceRecord[];
  getUpcomingMaintenance: (carId?: string, daysAhead?: number) => MaintenanceRecord[];
  getExpiringDocuments: (carId?: string, daysAhead?: number) => Document[];
  getActiveReminders: (carId?: string) => Reminder[];
  
  // Metodi per calcoli carburante
  calculateFuelEfficiency: (carId: string) => number | null;
  getFuelTrends: (carId: string, months?: number) => Array<{
    month: string;
    consumption: number;
    cost: number;
  }>;
}

export const useUserCarsStore = create<UserCarsStore>()(
  persist(
    (set, get) => ({
      cars: [
        // Auto di esempio
        {
          id: '1',
          make: 'Fiat',
          model: '500',
          year: 2019,
          color: 'Bianco',
          licensePlate: 'AB123CD',
          vin: 'ZFA3120000J123456',
          purchaseDate: '2019-03-15',
          purchasePrice: 18000,
          purchaseMileage: 0,
          currentMileage: 45000,
          lastUpdatedMileage: '2025-06-01',
          insuranceCompany: 'UnipolSai',
          insuranceExpiry: '2025-12-15',
          maintenanceRecords: [
            {
              id: '1',
              description: 'Tagliando 40.000 km',
              date: '2025-02-10',
              mileage: 40000,
              cost: 250,
              type: 'routine',
              status: 'completed',
              workshopName: 'Officina Rossi',
              nextDueDate: '2025-08-10',
              nextDueMileage: 50000,
            }
          ],
          expenses: [
            {
              id: '1',
              description: 'Rifornimento',
              date: '2025-06-01',
              amount: 55.50,
              category: 'fuel',
              mileage: 45000,
            }
          ],
          documents: [
            {
              id: '1',
              name: 'Assicurazione RCA',
              type: 'insurance',
              issueDate: '2024-12-15',
              expiryDate: '2025-12-15',
              documentNumber: 'POL123456789',
              issuer: 'UnipolSai',
            }
          ],
          fuelRecords: [
            {
              id: '1',
              date: '2025-06-01',
              mileage: 45000,
              liters: 38.5,
              costPerLiter: 1.44,
              totalCost: 55.50,
              fuelType: 'gasoline',
              isFullTank: true,
              stationName: 'Eni',
            }
          ],
          reminders: [
            {
              id: '1',
              title: 'Prossimo tagliando',
              description: 'Tagliando programmato a 50.000 km',
              type: 'maintenance',
              dueMileage: 50000,
              isActive: true,
              createdAt: '2025-02-10',
            }
          ],
          isActive: true,
          createdAt: '2019-03-15',
          updatedAt: '2025-06-01',
        },
        {
          id: '2',
          make: 'Tesla',
          model: 'Model 3',
          year: 2021,
          color: 'Nero',
          licensePlate: 'CD456EF',
          currentMileage: 28000,
          lastUpdatedMileage: '2025-06-01',
          maintenanceRecords: [],
          expenses: [],
          documents: [],
          fuelRecords: [],
          reminders: [],
          isActive: true,
          createdAt: '2021-05-20',
          updatedAt: '2025-06-01',
        }
      ],

      addCar: (carData) => {
        const newId = Date.now().toString();
        const now = new Date().toISOString();
        
        const newCar: UserCar = {
          id: newId,
          ...carData,
          maintenanceRecords: [],
          expenses: [],
          documents: [],
          fuelRecords: [],
          reminders: [],
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          cars: [...state.cars, newCar],
        }));

        return newId;
      },

      updateCar: (carId, data) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? { ...car, ...data, updatedAt: new Date().toISOString() }
              : car
          ),
        }));
      },

      deleteCar: (carId) => {
        set(state => ({
          cars: state.cars.filter(car => car.id !== carId),
        }));
      },

      getCarById: (carId) => {
        return get().cars.find(car => car.id === carId);
      },

      updateMileage: (carId, mileage) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  currentMileage: mileage,
                  lastUpdatedMileage: new Date().toISOString().split('T')[0],
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      addMaintenance: (carId, maintenanceData) => {
        const newId = Date.now().toString();
        const newMaintenance: MaintenanceRecord = {
          id: newId,
          ...maintenanceData,
        };

        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  maintenanceRecords: [...car.maintenanceRecords, newMaintenance],
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));

        return newId;
      },

      updateMaintenance: (carId, maintenanceId, data) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  maintenanceRecords: car.maintenanceRecords.map(maintenance =>
                    maintenance.id === maintenanceId ? { ...maintenance, ...data } : maintenance
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      deleteMaintenance: (carId, maintenanceId) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  maintenanceRecords: car.maintenanceRecords.filter(maintenance => maintenance.id !== maintenanceId),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      addExpense: (carId, expenseData) => {
        const newId = Date.now().toString();
        const newExpense: Expense = {
          id: newId,
          ...expenseData,
        };

        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  expenses: [...car.expenses, newExpense],
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));

        return newId;
      },

      updateExpense: (carId, expenseId, data) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  expenses: car.expenses.map(expense =>
                    expense.id === expenseId ? { ...expense, ...data } : expense
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      deleteExpense: (carId, expenseId) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  expenses: car.expenses.filter(expense => expense.id !== expenseId),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      addFuelRecord: (carId, fuelRecordData) => {
        const newId = Date.now().toString();
        const newFuelRecord: FuelRecord = {
          id: newId,
          ...fuelRecordData,
        };

        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  fuelRecords: [...car.fuelRecords, newFuelRecord],
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));

        return newId;
      },

      updateFuelRecord: (carId, fuelRecordId, data) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  fuelRecords: car.fuelRecords.map(fuelRecord =>
                    fuelRecord.id === fuelRecordId ? { ...fuelRecord, ...data } : fuelRecord
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      deleteFuelRecord: (carId, fuelRecordId) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  fuelRecords: car.fuelRecords.filter(fuelRecord => fuelRecord.id !== fuelRecordId),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      addDocument: (carId, documentData) => {
        const newId = Date.now().toString();
        const newDocument: Document = {
          id: newId,
          ...documentData,
        };

        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  documents: [...car.documents, newDocument],
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));

        return newId;
      },

      updateDocument: (carId, documentId, data) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  documents: car.documents.map(document =>
                    document.id === documentId ? { ...document, ...data } : document
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      deleteDocument: (carId, documentId) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  documents: car.documents.filter(document => document.id !== documentId),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      addReminder: (carId, reminderData) => {
        const newId = Date.now().toString();
        const now = new Date().toISOString();
        const newReminder: Reminder = {
          id: newId,
          ...reminderData,
          createdAt: now,
        };

        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  reminders: [...car.reminders, newReminder],
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));

        return newId;
      },

      updateReminder: (carId, reminderId, data) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  reminders: car.reminders.map(reminder =>
                    reminder.id === reminderId ? { ...reminder, ...data } : reminder
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      deleteReminder: (carId, reminderId) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  reminders: car.reminders.filter(reminder => reminder.id !== reminderId),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      completeReminder: (carId, reminderId) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId
              ? {
                  ...car,
                  reminders: car.reminders.map(reminder =>
                    reminder.id === reminderId
                      ? { ...reminder, isActive: false, completedAt: new Date().toISOString() }
                      : reminder
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : car
          ),
        }));
      },

      getCarStats: (carId) => {
        const car = get().cars.find(c => c.id === carId);
        if (!car) return {
          totalExpenses: 0,
          maintenanceCount: 0,
          totalFuelCost: 0,
          totalMaintenanceCost: 0,
        };

        const totalExpenses = car.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const maintenanceCount = car.maintenanceRecords.length;
        const totalFuelCost = car.expenses
          .filter(expense => expense.category === 'fuel')
          .reduce((sum, expense) => sum + expense.amount, 0);
        const totalMaintenanceCost = car.expenses
          .filter(expense => expense.category === 'maintenance')
          .reduce((sum, expense) => sum + expense.amount, 0);

        // Calcolo consumo medio carburante
        const fuelRecords = car.fuelRecords.filter(record => record.isFullTank);
        let avgFuelConsumption: number | undefined;
        
        if (fuelRecords.length >= 2) {
          const consumptions = [];
          for (let i = 1; i < fuelRecords.length; i++) {
            const prevRecord = fuelRecords[i - 1];
            const currRecord = fuelRecords[i];
            const kmDiff = currRecord.mileage - prevRecord.mileage;
            if (kmDiff > 0) {
              const consumption = (currRecord.liters / kmDiff) * 100;
              consumptions.push(consumption);
            }
          }
          if (consumptions.length > 0) {
            avgFuelConsumption = consumptions.reduce((sum, cons) => sum + cons, 0) / consumptions.length;
          }
        }

        // Prossima manutenzione
        const activeMaintenance = car.maintenanceRecords
          .filter(record => record.nextDueDate || record.nextDueMileage)
          .sort((a, b) => {
            if (a.nextDueDate && b.nextDueDate) {
              return new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime();
            }
            if (a.nextDueMileage && b.nextDueMileage) {
              return a.nextDueMileage - b.nextDueMileage;
            }
            return 0;
          })[0];

        return {
          totalExpenses,
          maintenanceCount,
          avgFuelConsumption,
          totalFuelCost,
          totalMaintenanceCost,
          kmSinceLastMaintenance: car.maintenanceRecords.length > 0
            ? car.currentMileage - Math.max(...car.maintenanceRecords.map(r => r.mileage))
            : undefined,
          nextMaintenanceDate: activeMaintenance?.nextDueDate,
          nextMaintenanceMileage: activeMaintenance?.nextDueMileage,
        };
      },

      getAllCarsStats: () => {
        const cars = get().cars.filter(car => car.isActive);
        
        const totalExpenses = cars.reduce((sum, car) => 
          sum + car.expenses.reduce((carSum, expense) => carSum + expense.amount, 0), 0
        );
        
        const totalMileage = cars.reduce((sum, car) => sum + car.currentMileage, 0);
        
        const carsNeedingAttention = cars.filter(car => {
          const overdue = get().getOverdueMaintenance(car.id);
          const expiring = get().getExpiringDocuments(car.id, 30);
          return overdue.length > 0 || expiring.length > 0;
        }).length;
        
        const activeReminders = cars.reduce((sum, car) => 
          sum + car.reminders.filter(reminder => reminder.isActive).length, 0
        );

        return {
          totalCars: cars.length,
          totalExpenses,
          totalMileage,
          avgExpensePerCar: cars.length > 0 ? totalExpenses / cars.length : 0,
          carsNeedingAttention,
          activeReminders,
        };
      },

      getOverdueMaintenance: (carId) => {
        const today = new Date();
        const cars = carId ? [get().getCarById(carId)] : get().cars;
        
        return cars
          .filter(car => car)
          .flatMap(car => 
            car!.maintenanceRecords.filter(record => {
              if (record.status === 'completed') return false;
              
              if (record.nextDueDate) {
                return new Date(record.nextDueDate) < today;
              }
              
              if (record.nextDueMileage && car!.currentMileage >= record.nextDueMileage) {
                return true;
              }
              
              return false;
            })
          );
      },

      getUpcomingMaintenance: (carId, daysAhead = 30) => {
        const today = new Date();
        const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        const cars = carId ? [get().getCarById(carId)] : get().cars;
        
        return cars
          .filter(car => car)
          .flatMap(car => 
            car!.maintenanceRecords.filter(record => {
              if (record.status === 'completed') return false;
              
              if (record.nextDueDate) {
                const dueDate = new Date(record.nextDueDate);
                return dueDate >= today && dueDate <= futureDate;
              }
              
              return false;
            })
          );
      },

      getExpiringDocuments: (carId, daysAhead = 30) => {
        const today = new Date();
        const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        const cars = carId ? [get().getCarById(carId)] : get().cars;
        
        return cars
          .filter(car => car)
          .flatMap(car => 
            car!.documents.filter(document => {
              if (!document.expiryDate) return false;
              const expiryDate = new Date(document.expiryDate);
              return expiryDate >= today && expiryDate <= futureDate;
            })
          );
      },

      getActiveReminders: (carId) => {
        const cars = carId ? [get().getCarById(carId)] : get().cars;
        
        return cars
          .filter(car => car)
          .flatMap(car => car!.reminders.filter(reminder => reminder.isActive));
      },

      calculateFuelEfficiency: (carId) => {
        const car = get().getCarById(carId);
        if (!car) return null;

        const fuelRecords = car.fuelRecords
          .filter(record => record.isFullTank)
          .sort((a, b) => a.mileage - b.mileage);

        if (fuelRecords.length < 2) return null;

        const consumptions = [];
        for (let i = 1; i < fuelRecords.length; i++) {
          const prevRecord = fuelRecords[i - 1];
          const currRecord = fuelRecords[i];
          const kmDiff = currRecord.mileage - prevRecord.mileage;
          if (kmDiff > 0) {
            const consumption = (currRecord.liters / kmDiff) * 100;
            consumptions.push(consumption);
          }
        }

        return consumptions.length > 0
          ? consumptions.reduce((sum, cons) => sum + cons, 0) / consumptions.length
          : null;
      },

      getFuelTrends: (carId, months = 12) => {
        const car = get().getCarById(carId);
        if (!car) return [];

        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const monthlyData: { [key: string]: { consumption: number[], cost: number } } = {};

        car.fuelRecords
          .filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= startDate && recordDate <= endDate;
          })
          .forEach(record => {
            const monthKey = record.date.substring(0, 7); // YYYY-MM
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { consumption: [], cost: 0 };
            }
            monthlyData[monthKey].cost += record.totalCost;
          });

        return Object.entries(monthlyData).map(([month, data]) => ({
          month,
          consumption: data.consumption.length > 0
            ? data.consumption.reduce((sum, cons) => sum + cons, 0) / data.consumption.length
            : 0,
          cost: data.cost,
        }));
      },
    }),
    {
      name: 'user-cars-storage',
      partialize: (state) => ({
        cars: state.cars,
      }),
    }
  )
);