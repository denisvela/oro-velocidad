interface GoldPriceData {
  price: number;
  change: number;
  changePercent: number;
  lastUpdate: string;
}

class GoldPriceService {
  private static instance: GoldPriceService;
  private currentPrice: number = 85.25; // Precio inicial aproximado por gramo en EUR
  private lastChange: number = 0;
  private listeners: ((data: GoldPriceData) => void)[] = [];

  private constructor() {
    this.startRealTimeUpdates();
  }

  static getInstance(): GoldPriceService {
    if (!GoldPriceService.instance) {
      GoldPriceService.instance = new GoldPriceService();
    }
    return GoldPriceService.instance;
  }

  // Método para obtener precio real del oro
  private async fetchRealGoldPrice(): Promise<GoldPriceData | null> {
    try {
      // Usamos una API pública para obtener el precio del oro
      // Nota: En producción, necesitarías una API key y manejar CORS
      const response = await fetch('https://api.metals.live/v1/spot/gold', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Error fetching gold price');
      }

      const data = await response.json();
      
      // Convertir de USD por onza a EUR por gramo (aproximado)
      // 1 onza = 31.1035 gramos, USD a EUR ≈ 0.85
      const pricePerGram = (data.price / 31.1035) * 0.85;
      const change = data.change || 0;
      const changePercent = (change / (data.price - change)) * 100;

      return {
        price: pricePerGram,
        change: change,
        changePercent: changePercent,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching real gold price:', error);
      return null;
    }
  }

  // Método alternativo usando scraping simulado (para desarrollo)
  private async fetchGoldPriceAlternative(): Promise<GoldPriceData> {
    // Simulamos datos realistas basados en precios actuales del oro
    const basePrice = 85.25; // EUR por gramo aproximado
    const randomVariation = (Math.random() - 0.5) * 2; // ±1 EUR
    const newPrice = Math.max(basePrice + randomVariation, 80); // Mínimo 80 EUR
    
    const change = newPrice - this.currentPrice;
    const changePercent = (change / this.currentPrice) * 100;
    
    this.currentPrice = newPrice;
    this.lastChange = changePercent;

    return {
      price: newPrice,
      change: change,
      changePercent: changePercent,
      lastUpdate: new Date().toISOString()
    };
  }

  private async startRealTimeUpdates() {
    const updatePrice = async () => {
      try {
        // Intentar obtener precio real primero
        let priceData = await this.fetchRealGoldPrice();
        
        // Si falla, usar datos simulados realistas
        if (!priceData) {
          priceData = await this.fetchGoldPriceAlternative();
        }

        // Notificar a todos los listeners
        this.listeners.forEach(listener => listener(priceData));
      } catch (error) {
        console.error('Error updating gold price:', error);
      }
    };

    // Actualizar inmediatamente
    updatePrice();
    
    // Actualizar cada 30 segundos
    setInterval(updatePrice, 30000);
  }

  subscribe(callback: (data: GoldPriceData) => void) {
    this.listeners.push(callback);
    
    // Enviar datos actuales inmediatamente
    callback({
      price: this.currentPrice,
      change: this.lastChange,
      changePercent: this.lastChange,
      lastUpdate: new Date().toISOString()
    });

    // Retornar función para desuscribirse
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
}

export default GoldPriceService;