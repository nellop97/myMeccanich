
// src/services/CarDataService.ts
interface CarBrand {
  id: number;
  name: string;
  logo?: string;
}

interface CarModel {
  id: number;
  name: string;
  year_from: number;
  year_to: number;
}

interface CarYear {
  year: number;
}

class CarDataService {
  private baseUrl = 'https://car-api2.p.rapidapi.com';
  private apiKey = 'your-rapidapi-key'; // Sostituire con una chiave reale
  
  // Alternative free API
  private freeApiUrl = 'https://vpic.nhtsa.dot.gov/api';

  // Fallback data per quando l'API non è disponibile
  private fallbackBrands = [
    'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Ford', 'Toyota', 'Honda',
    'Nissan', 'Hyundai', 'Kia', 'Peugeot', 'Renault', 'Citroën', 'Fiat',
    'Alfa Romeo', 'Lancia', 'Ferrari', 'Lamborghini', 'Maserati', 'Porsche',
    'Volvo', 'Saab', 'Skoda', 'Seat', 'Opel', 'Chevrolet', 'Jeep', 'Land Rover',
    'Jaguar', 'Mini', 'Smart', 'Tesla', 'Subaru', 'Mazda', 'Mitsubishi',
    'Suzuki', 'Dacia', 'Lexus', 'Infiniti', 'Acura', 'Cadillac', 'Buick',
    'Chrysler', 'Dodge', 'Ram', 'Lincoln'
  ].sort();

  private fallbackModels: { [brand: string]: string[] } = {
    'Fiat': ['500', '500X', '500L', 'Panda', 'Punto', 'Tipo', 'Doblo', 'Ducato', 'Qubo'],
    'Volkswagen': ['Golf', 'Polo', 'Passat', 'Tiguan', 'Touran', 'Touareg', 'Arteon', 'T-Cross', 'T-Roc'],
    'BMW': ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'Serie 6', 'Serie 7', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7'],
    'Mercedes-Benz': ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'Classe S', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS'],
    'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT'],
    'Toyota': ['Yaris', 'Corolla', 'Camry', 'Prius', 'RAV4', 'Highlander', 'Land Cruiser', 'Aygo', 'C-HR'],
    'Ford': ['Fiesta', 'Focus', 'Mondeo', 'Mustang', 'Kuga', 'EcoSport', 'Edge', 'Explorer', 'Ka+'],
    'Renault': ['Clio', 'Megane', 'Laguna', 'Scenic', 'Espace', 'Captur', 'Kadjar', 'Koleos', 'Twingo'],
    'Peugeot': ['108', '208', '308', '508', '2008', '3008', '5008', 'Partner', 'Expert'],
    'Honda': ['Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Jazz', 'Insight'],
    'Nissan': ['Micra', 'Note', 'Pulsar', 'Qashqai', 'X-Trail', 'Juke', 'Leaf'],
    'Hyundai': ['i10', 'i20', 'i30', 'Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Kona'],
    'Kia': ['Picanto', 'Rio', 'Ceed', 'Optima', 'Sportage', 'Sorento', 'Stonic', 'Niro'],
    'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y']
  };

  // Ottieni tutte le marche usando NHTSA API (gratuita)
  async getBrands(): Promise<string[]> {
    try {
      const response = await fetch(`${this.freeApiUrl}/vehicles/GetMakesForVehicleType/car?format=json`);
      
      if (!response.ok) {
        throw new Error('API response not ok');
      }
      
      const data = await response.json();
      
      if (data.Results && Array.isArray(data.Results)) {
        const brands = data.Results
          .map((item: any) => item.MakeName)
          .filter((name: string) => name && name.length > 0)
          .sort();
        
        // Filtra solo le marche più comuni per evitare troppe opzioni
        const commonBrands = brands.filter((brand: string) => 
          this.fallbackBrands.some(fb => 
            fb.toLowerCase() === brand.toLowerCase() || 
            brand.toLowerCase().includes(fb.toLowerCase())
          )
        );
        
        return commonBrands.length > 0 ? commonBrands : this.fallbackBrands;
      }
      
      throw new Error('Invalid API response format');
      
    } catch (error) {
      console.warn('Errore nel caricamento marche da API, uso dati locali:', error);
      return this.fallbackBrands;
    }
  }

  // Ottieni modelli per una marca specifica
  async getModelsForBrand(brand: string): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.freeApiUrl}/vehicles/GetModelsForMake/${encodeURIComponent(brand)}?format=json`
      );
      
      if (!response.ok) {
        throw new Error('API response not ok');
      }
      
      const data = await response.json();
      
      if (data.Results && Array.isArray(data.Results)) {
        const models = data.Results
          .map((item: any) => item.Model_Name)
          .filter((name: string) => name && name.length > 0)
          .sort();
        
        return models.length > 0 ? models : this.getFallbackModels(brand);
      }
      
      throw new Error('Invalid API response format');
      
    } catch (error) {
      console.warn(`Errore nel caricamento modelli per ${brand}, uso dati locali:`, error);
      return this.getFallbackModels(brand);
    }
  }

  // Ottieni anni disponibili per un modello specifico
  async getYearsForModel(brand: string, model: string): Promise<number[]> {
    try {
      const currentYear = new Date().getFullYear();
      const startYear = 1990;
      
      // Genera array di anni da 1990 a anno corrente + 1
      const years: number[] = [];
      for (let year = currentYear + 1; year >= startYear; year--) {
        years.push(year);
      }
      
      return years;
      
    } catch (error) {
      console.warn('Errore nel caricamento anni:', error);
      
      // Fallback: ultimi 30 anni
      const currentYear = new Date().getFullYear();
      const years: number[] = [];
      for (let year = currentYear + 1; year >= currentYear - 30; year--) {
        years.push(year);
      }
      return years;
    }
  }

  // Ottieni modelli fallback per una marca
  private getFallbackModels(brand: string): string[] {
    const normalizedBrand = brand.toLowerCase().trim();
    
    // Cerca corrispondenza esatta
    const exactMatch = Object.keys(this.fallbackModels).find(
      key => key.toLowerCase() === normalizedBrand
    );
    
    if (exactMatch) {
      return this.fallbackModels[exactMatch];
    }
    
    // Cerca corrispondenza parziale
    const partialMatch = Object.keys(this.fallbackModels).find(
      key => key.toLowerCase().includes(normalizedBrand) || 
            normalizedBrand.includes(key.toLowerCase())
    );
    
    if (partialMatch) {
      return this.fallbackModels[partialMatch];
    }
    
    // Modelli generici se non trovato
    return ['Modello Base', 'Modello Sport', 'Modello Luxury'];
  }

  // Ricerca marche per testo
  async searchBrands(query: string): Promise<string[]> {
    const allBrands = await this.getBrands();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      return allBrands.slice(0, 20); // Primi 20 risultati
    }
    
    return allBrands.filter(brand => 
      brand.toLowerCase().includes(normalizedQuery)
    ).slice(0, 10); // Primi 10 risultati della ricerca
  }

  // Ricerca modelli per testo
  async searchModels(brand: string, query: string): Promise<string[]> {
    const allModels = await this.getModelsForBrand(brand);
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) {
      return allModels.slice(0, 20); // Primi 20 risultati
    }
    
    return allModels.filter(model => 
      model.toLowerCase().includes(normalizedQuery)
    ).slice(0, 10); // Primi 10 risultati della ricerca
  }

  // Valida se una combinazione marca/modello è valida
  async validateCarData(brand: string, model: string, year: number): Promise<boolean> {
    try {
      const brands = await this.getBrands();
      const brandExists = brands.some(b => b.toLowerCase() === brand.toLowerCase());
      
      if (!brandExists) {
        return false;
      }
      
      const models = await this.getModelsForBrand(brand);
      const modelExists = models.some(m => m.toLowerCase() === model.toLowerCase());
      
      if (!modelExists) {
        return false;
      }
      
      const currentYear = new Date().getFullYear();
      const yearValid = year >= 1990 && year <= currentYear + 1;
      
      return yearValid;
      
    } catch (error) {
      console.warn('Errore nella validazione dati auto:', error);
      return true; // In caso di errore, accetta i dati
    }
  }
}

export const carDataService = new CarDataService();
export type { CarBrand, CarModel, CarYear };
