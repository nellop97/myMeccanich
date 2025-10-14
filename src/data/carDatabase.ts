// src/data/carDatabase.ts

export interface CarModel {
    name: string;
    years: number[]; // Anni di produzione disponibili
    fuelTypes?: string[]; // Tipi di carburante disponibili
}

export interface CarMake {
    id: string;
    name: string;
    models: CarModel[];
    logo?: string; // URL logo del brand (opzionale)
}

// Database completo delle marche e modelli auto più comuni in Italia
export const CAR_DATABASE: CarMake[] = [
    {
        id: 'fiat',
        name: 'Fiat',
        models: [
            { name: '500', years: generateYears(2007, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida', 'Elettrica'] },
            { name: '500X', years: generateYears(2014, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida'] },
            { name: 'Panda', years: generateYears(2003, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Metano', 'Ibrida'] },
            { name: 'Tipo', years: generateYears(2015, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Punto', years: generateYears(1999, 2018), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Metano'] },
            { name: 'Panda Cross', years: generateYears(2014, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Ducato', years: generateYears(1981, 2024), fuelTypes: ['Diesel'] },
            { name: 'Doblo', years: generateYears(2000, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Metano'] },
        ]
    },
    {
        id: 'volkswagen',
        name: 'Volkswagen',
        models: [
            { name: 'Golf', years: generateYears(1974, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Metano', 'Ibrida', 'Elettrica'] },
            { name: 'Polo', years: generateYears(1975, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL'] },
            { name: 'Tiguan', years: generateYears(2007, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'T-Roc', years: generateYears(2017, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Passat', years: generateYears(1973, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Up!', years: generateYears(2011, 2024), fuelTypes: ['Benzina', 'GPL'] },
            { name: 'ID.3', years: generateYears(2020, 2024), fuelTypes: ['Elettrica'] },
            { name: 'ID.4', years: generateYears(2021, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'bmw',
        name: 'BMW',
        models: [
            { name: 'Serie 1', years: generateYears(2004, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Serie 2', years: generateYears(2014, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Serie 3', years: generateYears(1975, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Serie 4', years: generateYears(2013, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Serie 5', years: generateYears(1972, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'X1', years: generateYears(2009, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'X3', years: generateYears(2003, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'X5', years: generateYears(1999, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'i3', years: generateYears(2013, 2022), fuelTypes: ['Elettrica'] },
            { name: 'iX', years: generateYears(2021, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'mercedes',
        name: 'Mercedes-Benz',
        models: [
            { name: 'Classe A', years: generateYears(1997, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Classe B', years: generateYears(2005, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Classe C', years: generateYears(1993, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Classe E', years: generateYears(1993, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'GLA', years: generateYears(2013, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'GLC', years: generateYears(2015, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'GLE', years: generateYears(2015, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'EQA', years: generateYears(2021, 2024), fuelTypes: ['Elettrica'] },
            { name: 'EQC', years: generateYears(2019, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'audi',
        name: 'Audi',
        models: [
            { name: 'A1', years: generateYears(2010, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'A3', years: generateYears(1996, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Metano', 'Ibrida Plug-in'] },
            { name: 'A4', years: generateYears(1994, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'A6', years: generateYears(1994, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Q2', years: generateYears(2016, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Q3', years: generateYears(2011, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Q5', years: generateYears(2008, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'e-tron', years: generateYears(2019, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'toyota',
        name: 'Toyota',
        models: [
            { name: 'Yaris', years: generateYears(1999, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
            { name: 'Corolla', years: generateYears(1966, 2024), fuelTypes: ['Benzina', 'Ibrida', 'Ibrida Plug-in'] },
            { name: 'Aygo', years: generateYears(2005, 2022), fuelTypes: ['Benzina'] },
            { name: 'C-HR', years: generateYears(2016, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
            { name: 'RAV4', years: generateYears(1994, 2024), fuelTypes: ['Benzina', 'Ibrida', 'Ibrida Plug-in'] },
            { name: 'Prius', years: generateYears(1997, 2024), fuelTypes: ['Ibrida', 'Ibrida Plug-in'] },
            { name: 'Camry', years: generateYears(1982, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
            { name: 'bZ4X', years: generateYears(2022, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'renault',
        name: 'Renault',
        models: [
            { name: 'Clio', years: generateYears(1990, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Ibrida'] },
            { name: 'Captur', years: generateYears(2013, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Ibrida Plug-in'] },
            { name: 'Megane', years: generateYears(1995, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in', 'Elettrica'] },
            { name: 'Kadjar', years: generateYears(2015, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Twingo', years: generateYears(1992, 2024), fuelTypes: ['Benzina', 'GPL', 'Elettrica'] },
            { name: 'Zoe', years: generateYears(2012, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'peugeot',
        name: 'Peugeot',
        models: [
            { name: '208', years: generateYears(2012, 2024), fuelTypes: ['Benzina', 'Diesel', 'Elettrica'] },
            { name: '308', years: generateYears(2007, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: '2008', years: generateYears(2013, 2024), fuelTypes: ['Benzina', 'Diesel', 'Elettrica'] },
            { name: '3008', years: generateYears(2008, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: '5008', years: generateYears(2009, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
        ]
    },
    {
        id: 'ford',
        name: 'Ford',
        models: [
            { name: 'Fiesta', years: generateYears(1976, 2023), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Focus', years: generateYears(1998, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Puma', years: generateYears(2019, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
            { name: 'Kuga', years: generateYears(2008, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Mustang Mach-E', years: generateYears(2021, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'opel',
        name: 'Opel',
        models: [
            { name: 'Corsa', years: generateYears(1982, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Elettrica'] },
            { name: 'Astra', years: generateYears(1991, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Crossland', years: generateYears(2017, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Grandland', years: generateYears(2017, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Mokka', years: generateYears(2012, 2024), fuelTypes: ['Benzina', 'Diesel', 'Elettrica'] },
        ]
    },
    {
        id: 'citroen',
        name: 'Citroën',
        models: [
            { name: 'C3', years: generateYears(2002, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'C4', years: generateYears(2004, 2024), fuelTypes: ['Benzina', 'Diesel', 'Elettrica'] },
            { name: 'C5 Aircross', years: generateYears(2018, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
        ]
    },
    {
        id: 'jeep',
        name: 'Jeep',
        models: [
            { name: 'Renegade', years: generateYears(2014, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Compass', years: generateYears(2006, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Cherokee', years: generateYears(1984, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Grand Cherokee', years: generateYears(1992, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Wrangler', years: generateYears(1986, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
        ]
    },
    {
        id: 'nissan',
        name: 'Nissan',
        models: [
            { name: 'Micra', years: generateYears(1982, 2024), fuelTypes: ['Benzina'] },
            { name: 'Juke', years: generateYears(2010, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida'] },
            { name: 'Qashqai', years: generateYears(2006, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida'] },
            { name: 'X-Trail', years: generateYears(2001, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida'] },
            { name: 'Leaf', years: generateYears(2010, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'hyundai',
        name: 'Hyundai',
        models: [
            { name: 'i10', years: generateYears(2007, 2024), fuelTypes: ['Benzina'] },
            { name: 'i20', years: generateYears(2008, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida'] },
            { name: 'i30', years: generateYears(2007, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida'] },
            { name: 'Tucson', years: generateYears(2004, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida', 'Ibrida Plug-in'] },
            { name: 'Kona', years: generateYears(2017, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida', 'Elettrica'] },
            { name: 'Ioniq', years: generateYears(2016, 2024), fuelTypes: ['Ibrida', 'Ibrida Plug-in', 'Elettrica'] },
        ]
    },
    {
        id: 'kia',
        name: 'Kia',
        models: [
            { name: 'Picanto', years: generateYears(2004, 2024), fuelTypes: ['Benzina'] },
            { name: 'Rio', years: generateYears(2000, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Ceed', years: generateYears(2006, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Sportage', years: generateYears(1993, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida', 'Ibrida Plug-in'] },
            { name: 'Niro', years: generateYears(2016, 2024), fuelTypes: ['Ibrida', 'Ibrida Plug-in', 'Elettrica'] },
            { name: 'EV6', years: generateYears(2021, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'tesla',
        name: 'Tesla',
        models: [
            { name: 'Model 3', years: generateYears(2017, 2024), fuelTypes: ['Elettrica'] },
            { name: 'Model Y', years: generateYears(2020, 2024), fuelTypes: ['Elettrica'] },
            { name: 'Model S', years: generateYears(2012, 2024), fuelTypes: ['Elettrica'] },
            { name: 'Model X', years: generateYears(2015, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'mazda',
        name: 'Mazda',
        models: [
            { name: 'Mazda2', years: generateYears(2002, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
            { name: 'Mazda3', years: generateYears(2003, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida'] },
            { name: 'CX-3', years: generateYears(2015, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'CX-5', years: generateYears(2012, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'MX-30', years: generateYears(2020, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'alfa_romeo',
        name: 'Alfa Romeo',
        models: [
            { name: 'MiTo', years: generateYears(2008, 2018), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Giulietta', years: generateYears(2010, 2020), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Metano'] },
            { name: 'Giulia', years: generateYears(2015, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Stelvio', years: generateYears(2016, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Tonale', years: generateYears(2022, 2024), fuelTypes: ['Benzina', 'Ibrida', 'Ibrida Plug-in'] },
        ]
    },
    {
        id: 'lancia',
        name: 'Lancia',
        models: [
            { name: 'Ypsilon', years: generateYears(1996, 2024), fuelTypes: ['Benzina', 'GPL', 'Metano', 'Ibrida'] },
            { name: 'Delta', years: generateYears(1979, 2014), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Musa', years: generateYears(2004, 2012), fuelTypes: ['Benzina', 'Diesel', 'GPL'] },
        ]
    },
    {
        id: 'seat',
        name: 'Seat',
        models: [
            { name: 'Ibiza', years: generateYears(1984, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Metano'] },
            { name: 'Leon', years: generateYears(1999, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Metano', 'Ibrida Plug-in'] },
            { name: 'Arona', years: generateYears(2017, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Ateca', years: generateYears(2016, 2024), fuelTypes: ['Benzina', 'Diesel'] },
        ]
    },
    {
        id: 'skoda',
        name: 'Škoda',
        models: [
            { name: 'Fabia', years: generateYears(1999, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL'] },
            { name: 'Octavia', years: generateYears(1996, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL', 'Metano', 'Ibrida Plug-in'] },
            { name: 'Karoq', years: generateYears(2017, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Kodiaq', years: generateYears(2016, 2024), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'Enyaq', years: generateYears(2021, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'volvo',
        name: 'Volvo',
        models: [
            { name: 'XC40', years: generateYears(2017, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in', 'Elettrica'] },
            { name: 'XC60', years: generateYears(2008, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'XC90', years: generateYears(2002, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'V40', years: generateYears(2012, 2019), fuelTypes: ['Benzina', 'Diesel'] },
            { name: 'V60', years: generateYears(2010, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
        ]
    },
    {
        id: 'honda',
        name: 'Honda',
        models: [
            { name: 'Civic', years: generateYears(1972, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida'] },
            { name: 'Jazz', years: generateYears(2001, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
            { name: 'CR-V', years: generateYears(1995, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida'] },
            { name: 'HR-V', years: generateYears(1998, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
            { name: 'e', years: generateYears(2020, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'suzuki',
        name: 'Suzuki',
        models: [
            { name: 'Swift', years: generateYears(2004, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
            { name: 'Ignis', years: generateYears(2000, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
            { name: 'Vitara', years: generateYears(1988, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
            { name: 'S-Cross', years: generateYears(2013, 2024), fuelTypes: ['Benzina', 'Ibrida'] },
        ]
    },
    {
        id: 'dacia',
        name: 'Dacia',
        models: [
            { name: 'Sandero', years: generateYears(2008, 2024), fuelTypes: ['Benzina', 'GPL', 'Metano'] },
            { name: 'Duster', years: generateYears(2010, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL'] },
            { name: 'Logan', years: generateYears(2004, 2024), fuelTypes: ['Benzina', 'Diesel', 'GPL'] },
            { name: 'Spring', years: generateYears(2021, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
    {
        id: 'mini',
        name: 'Mini',
        models: [
            { name: 'Cooper', years: generateYears(2001, 2024), fuelTypes: ['Benzina', 'Diesel', 'Elettrica'] },
            { name: 'Clubman', years: generateYears(2007, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Countryman', years: generateYears(2010, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
        ]
    },
    {
        id: 'porsche',
        name: 'Porsche',
        models: [
            { name: '911', years: generateYears(1963, 2024), fuelTypes: ['Benzina'] },
            { name: 'Cayenne', years: generateYears(2002, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Macan', years: generateYears(2014, 2024), fuelTypes: ['Benzina', 'Elettrica'] },
            { name: 'Panamera', years: generateYears(2009, 2024), fuelTypes: ['Benzina', 'Diesel', 'Ibrida Plug-in'] },
            { name: 'Taycan', years: generateYears(2019, 2024), fuelTypes: ['Elettrica'] },
        ]
    },
];

// Funzione helper per generare range di anni
function generateYears(start: number, end: number): number[] {
    const years: number[] = [];
    for (let year = start; year <= end; year++) {
        years.push(year);
    }
    return years;
}

// Funzioni di ricerca e filtro

/**
 * Cerca marche per nome (case insensitive)
 */
export const searchMakes = (query: string): CarMake[] => {
    if (!query.trim()) return CAR_DATABASE;

    const lowerQuery = query.toLowerCase();
    return CAR_DATABASE.filter(make =>
        make.name.toLowerCase().includes(lowerQuery)
    );
};

/**
 * Cerca modelli per marca specifica
 */
export const searchModelsByMake = (makeId: string, query: string = ''): CarModel[] => {
    const make = CAR_DATABASE.find(m => m.id === makeId);
    if (!make) return [];

    if (!query.trim()) return make.models;

    const lowerQuery = query.toLowerCase();
    return make.models.filter(model =>
        model.name.toLowerCase().includes(lowerQuery)
    );
};

/**
 * Ottieni una marca specifica per ID
 */
export const getMakeById = (makeId: string): CarMake | undefined => {
    return CAR_DATABASE.find(m => m.id === makeId);
};

/**
 * Ottieni un modello specifico
 */
export const getModelByName = (makeId: string, modelName: string): CarModel | undefined => {
    const make = getMakeById(makeId);
    if (!make) return undefined;

    return make.models.find(m => m.name === modelName);
};

/**
 * Ottieni tutte le marche
 */
export const getAllMakes = (): CarMake[] => {
    return CAR_DATABASE;
};

/**
 * Ottieni tutte le marche ordinate alfabeticamente
 */
export const getAllMakesSorted = (): CarMake[] => {
    return [...CAR_DATABASE].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Cerca tra tutti i modelli di tutte le marche
 */
export const searchAllModels = (query: string): Array<{ make: CarMake; model: CarModel }> => {
    if (!query.trim()) return [];

    const results: Array<{ make: CarMake; model: CarModel }> = [];
    const lowerQuery = query.toLowerCase();

    for (const make of CAR_DATABASE) {
        for (const model of make.models) {
            if (model.name.toLowerCase().includes(lowerQuery) ||
                make.name.toLowerCase().includes(lowerQuery)) {
                results.push({ make, model });
            }
        }
    }

    return results;
};