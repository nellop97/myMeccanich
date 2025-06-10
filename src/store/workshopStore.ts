// src/store/workshopStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Part = {
  id: string;
  name: string;
  quantity: number;
  unitCost: number;
  category?: 'ricambio' | 'fluido' | 'consumabile' | 'accessorio';
  brand?: string;
  partNumber?: string;
  supplier?: string;
};

export type Repair = {
  id: string;
  description: string;
  scheduledDate: string;
  deliveryDate: string;
  totalCost: number;
  laborCost: number; // Costo manodopera
  status: 'pending' | 'in-progress' | 'completed';
  parts: Part[];
  notes?: string;
  mechanicId?: string;
  estimatedHours?: number;
  actualHours?: number;
};

export type Car = {
  id: string;
  model: string;
  vin: string;
  licensePlate?: string;
  owner?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  year?: string;
  color?: string;
  mileage?: number;
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
  updatePartInRepair: (carId: string, repairId: string, partId: string, partData: Partial<Omit<Part, 'id'>>) => void;
  removePartFromRepair: (carId: string, repairId: string, partId: string) => void;
}

export const useWorkshopStore = create<WorkshopStore>()(
  persist(
    (set, get) => ({
      cars: [
        // Auto esistente - Tesla
        {
          id: '1',
          model: 'Tesla Model 3',
          vin: '5YJ3E1EAXKF123456',
          licensePlate: 'AB123CD',
          owner: 'Mario Rossi',
          ownerPhone: '+39 334 1234567',
          ownerEmail: 'mario.rossi@email.com',
          year: '2021',
          color: 'Bianco',
          mileage: 45000,
          repairs: [
            {
              id: '1',
              description: 'Sostituzione batteria trazione',
              scheduledDate: '2025-05-15',
              deliveryDate: '2025-05-20',
              totalCost: 1200,
              laborCost: 200,
              status: 'in-progress',
              estimatedHours: 4,
              actualHours: 3.5,
              notes: 'Batteria sotto garanzia, sostituire modulo principale',
              parts: [
                { 
                  id: '1', 
                  name: 'Batteria 75kWh', 
                  quantity: 1, 
                  unitCost: 1000,
                  category: 'ricambio',
                  brand: 'Tesla',
                  partNumber: 'TSL-BAT-75KWH',
                  supplier: 'Tesla Motors'
                },
                { 
                  id: '2', 
                  name: 'Kit installazione', 
                  quantity: 1, 
                  unitCost: 200,
                  category: 'accessorio',
                  brand: 'Tesla',
                  partNumber: 'TSL-KIT-INST',
                  supplier: 'Tesla Motors'
                },
              ],
            },
          ],
        },
        // Nuova auto - Fiat con manutenzione ordinaria
        {
          id: '2',
          model: 'Fiat Panda',
          vin: 'ZFA3120000J789012',
          licensePlate: 'CD456EF',
          owner: 'Anna Verdi',
          ownerPhone: '+39 347 9876543',
          ownerEmail: 'anna.verdi@email.com',
          year: '2019',
          color: 'Azzurro',
          mileage: 78500,
          repairs: [
            {
              id: '2',
              description: 'Tagliando completo - cambio olio e filtri',
              scheduledDate: '2025-06-01',
              deliveryDate: '2025-06-01',
              totalCost: 150,
              laborCost: 50,
              status: 'pending',
              estimatedHours: 2,
              notes: 'Tagliando a 80.000 km - controllare anche cinghie',
              parts: [
                {
                  id: '3',
                  name: 'Olio motore 5W-30',
                  quantity: 4,
                  unitCost: 8.50,
                  category: 'fluido',
                  brand: 'Castrol',
                  partNumber: 'CTR-5W30-1L',
                  supplier: 'Ricambi Auto SpA'
                },
                {
                  id: '4',
                  name: 'Filtro olio',
                  quantity: 1,
                  unitCost: 12.00,
                  category: 'consumabile',
                  brand: 'Mann',
                  partNumber: 'MAN-W610/3',
                  supplier: 'Ricambi Auto SpA'
                },
                {
                  id: '5',
                  name: 'Filtro aria',
                  quantity: 1,
                  unitCost: 15.00,
                  category: 'consumabile',
                  brand: 'Bosch',
                  partNumber: 'BSH-1457433589',
                  supplier: 'Ricambi Auto SpA'
                },
                {
                  id: '6',
                  name: 'Filtro abitacolo',
                  quantity: 1,
                  unitCost: 18.00,
                  category: 'consumabile',
                  brand: 'Mahle',
                  partNumber: 'MHL-LAK285',
                  supplier: 'Ricambi Auto SpA'
                }
              ],
            },
            {
              id: '3',
              description: 'Sostituzione pastiglie freno anteriori',
              scheduledDate: '2025-06-03',
              deliveryDate: '2025-06-03',
              totalCost: 120,
              laborCost: 40,
              status: 'pending',
              estimatedHours: 1.5,
              notes: 'Controllare anche dischi, potrebbero necessitare spianatura',
              parts: [
                {
                  id: '7',
                  name: 'Pastiglie freno anteriori',
                  quantity: 1,
                  unitCost: 45.00,
                  category: 'ricambio',
                  brand: 'Brembo',
                  partNumber: 'BRM-P23098',
                  supplier: 'Brembo Direct'
                },
                {
                  id: '8',
                  name: 'Liquido freni DOT4',
                  quantity: 1,
                  unitCost: 12.00,
                  category: 'fluido',
                  brand: 'Bosch',
                  partNumber: 'BSH-DOT4-500ML',
                  supplier: 'Ricambi Auto SpA'
                },
                {
                  id: '9',
                  name: 'Grasso per guide',
                  quantity: 1,
                  unitCost: 8.00,
                  category: 'consumabile',
                  brand: 'Textar',
                  partNumber: 'TXT-81000400',
                  supplier: 'Ricambi Auto SpA'
                }
              ],
            }
          ],
        },
        // Auto esistente - Fiat 500
        {
          id: '3',
          model: 'Fiat 500',
          vin: 'ZFA3120000J123456',
          licensePlate: 'XY789ZW',
          owner: 'Laura Bianchi',
          ownerPhone: '+39 328 5551234',
          ownerEmail: 'laura.bianchi@email.com',
          year: '2020',
          color: 'Rosso',
          mileage: 32000,
          repairs: [
            {
              id: '4',
              description: 'Tagliando completo',
              scheduledDate: '2025-05-21',
              deliveryDate: '2025-05-22',
              totalCost: 350,
              laborCost: 80,
              status: 'pending',
              estimatedHours: 3,
              parts: [],
            },
          ],
        },
        // Auto esistente - Golf
        {
          id: '4',
          model: 'Volkswagen Golf',
          vin: 'WVWZZZ1KZAW123456',
          licensePlate: 'EF456GH',
          owner: 'Giovanni Verdi',
          ownerPhone: '+39 339 7778899',
          ownerEmail: 'giovanni.verdi@email.com',
          year: '2018',
          color: 'Grigio',
          mileage: 95000,
          repairs: [
            {
              id: '5',
              description: 'Sostituzione frizione',
              scheduledDate: '2025-05-18',
              deliveryDate: '2025-05-25',
              totalCost: 720,
              laborCost: 200,
              status: 'completed',
              estimatedHours: 6,
              actualHours: 5.5,
              parts: [],
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

      updateRepair: (carId: string, repairId: string, repairData: Partial<Omit<Repair, 'id'>>) => {
        set(state => ({
          cars: state.cars.map(car =>
            car.id === carId ? {
              ...car,
              repairs: car.repairs.map(repair => {
                if (repair.id === repairId) {
                  // Applica prima le modifiche parziali alla riparazione
                  const tempUpdatedRepair = { ...repair, ...repairData };

                  // Se laborCost o l'array parts stesso vengono aggiornati,
                  // ricalcola totalCost.
                  if (repairData.laborCost !== undefined || repairData.parts !== undefined) {
                    const newLaborCost = tempUpdatedRepair.laborCost;
                    const newParts = tempUpdatedRepair.parts;
                    tempUpdatedRepair.totalCost = newLaborCost + newParts.reduce((sum, p) => sum + (p.quantity * p.unitCost), 0);
                  }
                  return tempUpdatedRepair;
                }
                return repair;
              })
            } : car
          )
        }));
      },


      updatePartInRepair: (carId, repairId, partId, partData) => {
        set(state => ({
          cars: state.cars.map(car => 
            car.id === carId ? {
              ...car,
              repairs: car.repairs.map(repair =>
                repair.id === repairId ? {
                  ...repair,
                  parts: repair.parts.map(part =>
                    part.id === partId ? { ...part, ...partData } : part
                  ),
                  totalCost: repair.laborCost + repair.parts.reduce((sum, p) => 
                    sum + (p.id === partId ? 
                      (partData.quantity || p.quantity) * (partData.unitCost || p.unitCost) : 
                      p.quantity * p.unitCost), 0
                  )
                } : repair
              )
            } : car
          )
        }));
      },

      removePartFromRepair: (carId, repairId, partId) => {
        set(state => ({
          cars: state.cars.map(car => 
            car.id === carId ? {
              ...car,
              repairs: car.repairs.map(repair =>
                repair.id === repairId ? {
                  ...repair,
                  parts: repair.parts.filter(part => part.id !== partId),
                  totalCost: repair.laborCost + repair.parts
                    .filter(part => part.id !== partId)
                    .reduce((sum, part) => sum + (part.quantity * part.unitCost), 0)
                } : repair
              )
            } : car
          )
        }));
      }
    }),
    {
      name: 'workshop-storage',
      partialize: (state) => ({ 
        cars: state.cars 
      }),
    }
  )
);