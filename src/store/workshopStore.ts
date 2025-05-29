// src/store/workshopStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Part = {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
};

export type Repair = {
  id: string;
  description: string;
  scheduledDate: string;
  deliveryDate: string;
  totalCost: number;
  status: 'pending' | 'in-progress' | 'completed';
  parts: Part[];
};

export type Car = {
  id: string;
  model: string;
  vin: string;
  licensePlate?: string;
  owner?: string;
  repairs: Repair[];
};

export type FormData = {
  model: string;
  vin: string;
  licensePlate?: string;
  owner?: string;
  repairs: Omit<Repair, 'id' | 'parts'>[];
};

interface WorkshopStore {
  cars: Car[];
  // Metodi di ricerca
  getRepairDetails: (carId: string, repairId: string) => Repair | undefined;
  getCarById: (carId: string) => Car | undefined;
  // Metodi di modifica
  addCar: (car: Omit<Car, 'id' | 'repairs'>) => string;
  addAppointment: (newAppointment: FormData) => string;
  addRepairToCar: (carId: string, repair: Omit<Repair, 'id' | 'parts'>) => string;
  addPartToRepair: (carId: string, repairId: string, part: Omit<Part, 'id'>) => string;
  updateRepairStatus: (carId: string, repairId: string, status: Repair['status']) => void;
  updateRepair: (carId: string, repairId: string, repairData: Partial<Omit<Repair, 'id'>>) => void;
}

export const useWorkshopStore = create<WorkshopStore>()(
  persist(
    (set, get) => ({
      cars: [
        // Dati di esempio
        {
          id: '1',
          model: 'Tesla Model 3',
          vin: '5YJ3E1EAXKF123456',
          licensePlate: 'AB123CD',
          owner: 'Mario Rossi',
          repairs: [
            {
              id: '1',
              description: 'Sostituzione batteria trazione',
              scheduledDate: '2025-05-15',
              deliveryDate: '2025-05-20',
              totalCost: 1200,
              status: 'pending',
              parts: [
                { id: '1', name: 'Batteria 75kWh', quantity: 1, unitCost: 1000 },
                { id: '2', name: 'Kit installazione', quantity: 1, unitCost: 200 },
              ],
            },
          ],
        },
      ],

      getCarById: (carId) => {
        return get().cars.find(car => car.id === carId);
      },

      getRepairDetails: (carId, repairId) => {
        const car = get().cars.find(c => c.id === carId);
        return car?.repairs.find(r => r.id === repairId);
      },

      addCar: (carData) => {
        const newCarId = Date.now().toString();
        set(state => ({
          cars: [...state.cars, {
            id: newCarId,
            ...carData,
            repairs: []
          }]
        }));
        return newCarId;
      },

      addAppointment: (newAppointment) => {
        const newCarId = Date.now().toString();
        const repairs = newAppointment.repairs.map(repair => ({
          ...repair,
          id: `repair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          parts: [],
          status: 'pending' as const
        }));

        set(state => ({
          cars: [...state.cars, {
            id: newCarId,
            model: newAppointment.model,
            vin: newAppointment.vin,
            licensePlate: newAppointment.licensePlate,
            owner: newAppointment.owner,
            repairs
          }]
        }));
        
        return newCarId;
      },

      addRepairToCar: (carId, repair) => {
        const newRepairId = `repair-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        set(state => ({
          cars: state.cars.map(car => 
            car.id === carId ? {
              ...car,
              repairs: [
                ...car.repairs, 
                {
                  id: newRepairId,
                  ...repair,
                  parts: [],
                  status: 'pending'
                }
              ]
            } : car
          )
        }));
        
        return newRepairId;
      },

      addPartToRepair: (carId, repairId, part) => {
        const newPartId = `part-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        set(state => ({
          cars: state.cars.map(car => 
            car.id === carId ? {
              ...car,
              repairs: car.repairs.map(repair =>
                repair.id === repairId ? {
                  ...repair,
                  parts: [...repair.parts, { id: newPartId, ...part }],
                  totalCost: repair.totalCost + (part.quantity * part.unitCost)
                } : repair
              )
            } : car
          )
        }));
        
        return newPartId;
      },

      updateRepairStatus: (carId, repairId, status) => {
        set(state => ({
          cars: state.cars.map(car => 
            car.id === carId ? {
              ...car,
              repairs: car.repairs.map(repair =>
                repair.id === repairId ? {
                  ...repair,
                  status
                } : repair
              )
            } : car
          )
        }));
      },

      updateRepair: (carId, repairId, repairData) => {
        set(state => ({
          cars: state.cars.map(car => 
            car.id === carId ? {
              ...car,
              repairs: car.repairs.map(repair =>
                repair.id === repairId ? {
                  ...repair,
                  ...repairData
                } : repair
              )
            } : car
          )
        }));
      }
    }),
    {
      name: 'workshop-storage', // nome per localStorage
      partialize: (state) => ({ 
        cars: state.cars 
      }), // salva solo i dati delle auto
    }
  )
);