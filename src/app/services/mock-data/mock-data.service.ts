import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

// Interfaces para datos mock
export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  memberSince: string;
  preferences: {
    language: 'es' | 'en';
    currency: 'COP' | 'USD';
    notifications: boolean;
    newsletter: boolean;
  };
}

export interface MockActivity {
  id: string;
  name: string;
  description: string;
  category: 'deportiva' | 'cultural' | 'aventura' | 'relajacion';
  duration: number;
  price: number;
  maxParticipants: number;
  schedule: string[];
  equipment: string[];
  difficulty: 'facil' | 'moderado' | 'dificil';
  rating: number;
  reviewCount: number;
  isActive: boolean;
}

export interface MockPromotion {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  validFrom: string;
  validTo: string;
  applicableServices: string[];
  applicableCabins: string[];
  code: string;
  minPurchase?: number;
  maxDiscount?: number;
  isActive: boolean;
}

export interface MockTestimonial {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  service?: string;
  cabin?: string;
  date: string;
  verified: boolean;
  helpful: number;
}

export interface MockFAQ {
  id: string;
  category: 'reservas' | 'servicios' | 'cabanas' | 'pagos' | 'politicas' | 'general';
  question: string;
  answer: string;
  isPopular: boolean;
  helpful: number;
  notHelpful: number;
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {

  constructor() { }

  /**
   * Obtiene usuarios mock
   */
  getUsers(): Observable<MockUser[]> {
    const users: MockUser[] = [
      {
        id: 'user-123',
        name: 'María García',
        email: 'maria.garcia@example.com',
        phone: '+57 300 123 4567',
        avatar: '/assets/images/avatars/maria.jpg',
        memberSince: '2023-06-15',
        preferences: {
          language: 'es',
          currency: 'COP',
          notifications: true,
          newsletter: true
        }
      },
      {
        id: 'user-456',
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@example.com',
        phone: '+57 310 987 6543',
        avatar: '/assets/images/avatars/carlos.jpg',
        memberSince: '2023-01-20',
        preferences: {
          language: 'es',
          currency: 'COP',
          notifications: false,
          newsletter: true
        }
      },
      {
        id: 'user-789',
        name: 'Ana Martínez',
        email: 'ana.martinez@example.com',
        phone: '+57 320 555 9876',
        memberSince: '2024-01-10',
        preferences: {
          language: 'es',
          currency: 'COP',
          notifications: true,
          newsletter: false
        }
      }
    ];

    return of(users).pipe(delay(300));
  }

  /**
   * Obtiene actividades mock
   */
  getActivities(): Observable<MockActivity[]> {
    const activities: MockActivity[] = [
      {
        id: 'activity-001',
        name: 'Yoga al Amanecer',
        description: 'Sesión de yoga matutina en un ambiente natural, perfecta para comenzar el día con energía positiva y conexión con la naturaleza.',
        category: 'relajacion',
        duration: 90,
        price: 35000,
        maxParticipants: 15,
        schedule: ['06:30', '07:00'],
        equipment: ['Mat de yoga', 'Cojín de meditación', 'Manta'],
        difficulty: 'facil',
        rating: 4.8,
        reviewCount: 124,
        isActive: true
      },
      {
        id: 'activity-002',
        name: 'Senderismo Ecológico',
        description: 'Caminata guiada por senderos naturales donde podrás conocer la flora y fauna local mientras disfrutas de paisajes únicos.',
        category: 'aventura',
        duration: 180,
        price: 45000,
        maxParticipants: 20,
        schedule: ['08:00', '14:00'],
        equipment: ['Bastones de senderismo', 'Binoculares', 'Guía naturalista'],
        difficulty: 'moderado',
        rating: 4.6,
        reviewCount: 89,
        isActive: true
      },
      {
        id: 'activity-003',
        name: 'Taller de Cerámica',
        description: 'Aprende técnicas básicas de cerámica mientras creas tu propia obra de arte en un ambiente relajado y creativo.',
        category: 'cultural',
        duration: 120,
        price: 55000,
        maxParticipants: 12,
        schedule: ['10:00', '15:00'],
        equipment: ['Arcilla', 'Herramientas de modelado', 'Mandil'],
        difficulty: 'facil',
        rating: 4.9,
        reviewCount: 67,
        isActive: true
      },
      {
        id: 'activity-004',
        name: 'Aqua Aeróbicos',
        description: 'Ejercítate de forma divertida y efectiva en el agua con rutinas diseñadas para todos los niveles de condición física.',
        category: 'deportiva',
        duration: 60,
        price: 25000,
        maxParticipants: 25,
        schedule: ['09:00', '11:00', '16:00', '18:00'],
        equipment: ['Pesas acuáticas', 'Fideos de flotación', 'Música'],
        difficulty: 'facil',
        rating: 4.5,
        reviewCount: 156,
        isActive: true
      }
    ];

    return of(activities).pipe(delay(400));
  }

  /**
   * Obtiene promociones mock
   */
  getPromotions(): Observable<MockPromotion[]> {
    const promotions: MockPromotion[] = [
      {
        id: 'promo-001',
        title: 'Descuento de Temporada',
        description: '20% de descuento en todos los servicios de spa durante los fines de semana de enero',
        discountPercent: 20,
        validFrom: '2024-01-01',
        validTo: '2024-01-31',
        applicableServices: ['spa-massage-001', 'spa-facial-001'],
        applicableCabins: [],
        code: 'ENERO20',
        minPurchase: 100000,
        maxDiscount: 50000,
        isActive: true
      },
      {
        id: 'promo-002',
        title: 'Paquete Parejas',
        description: 'Estadía romántica por 2 noches en cabaña + 2 masajes relajantes + cena especial',
        discountPercent: 15,
        validFrom: '2024-02-01',
        validTo: '2024-02-29',
        applicableServices: ['spa-massage-001'],
        applicableCabins: ['cabin-romantic-001'],
        code: 'ROMANCE15',
        minPurchase: 500000,
        isActive: true
      },
      {
        id: 'promo-003',
        title: 'Plan Familiar',
        description: 'Descuento especial en cabañas familiares para estadías de 3 noches o más',
        discountPercent: 25,
        validFrom: '2024-03-01',
        validTo: '2024-03-31',
        applicableServices: [],
        applicableCabins: ['cabin-family-001'],
        code: 'FAMILIA25',
        minPurchase: 800000,
        maxDiscount: 200000,
        isActive: true
      }
    ];

    return of(promotions).pipe(delay(250));
  }

  /**
   * Obtiene testimonios mock
   */
  getTestimonials(): Observable<MockTestimonial[]> {
    const testimonials: MockTestimonial[] = [
      {
        id: 'testimonial-001',
        userName: 'Laura Pérez',
        userAvatar: '/assets/images/avatars/laura.jpg',
        rating: 5,
        comment: 'Una experiencia increíble. El masaje relajante fue exactamente lo que necesitaba después de una semana estresante. El ambiente es perfecto y el personal muy profesional.',
        service: 'Masaje Relajante Completo',
        date: '2024-01-15',
        verified: true,
        helpful: 23
      },
      {
        id: 'testimonial-002',
        userName: 'Roberto Silva',
        userAvatar: '/assets/images/avatars/roberto.jpg',
        rating: 5,
        comment: 'La cabaña familiar superó nuestras expectativas. Espaciosa, limpia y con todas las comodidades. Los niños se divirtieron mucho y nosotros pudimos relajarnos.',
        cabin: 'Cabaña Familiar del Bosque',
        date: '2024-01-10',
        verified: true,
        helpful: 18
      },
      {
        id: 'testimonial-003',
        userName: 'Carolina Mendoza',
        rating: 4,
        comment: 'El circuito de aguas termales es fantástico. Pasé toda la tarde relajándome y sintiéndome renovada. Definitivamente regresaré.',
        service: 'Circuito de Aguas Termales',
        date: '2024-01-08',
        verified: true,
        helpful: 31
      },
      {
        id: 'testimonial-004',
        userName: 'Miguel Vargas',
        userAvatar: '/assets/images/avatars/miguel.jpg',
        rating: 5,
        comment: 'La cabaña romántica fue perfecta para nuestra luna de miel. La vista al lago es espectacular y los detalles románticos hicieron la diferencia.',
        cabin: 'Cabaña Romántica Lago Sereno',
        date: '2024-01-05',
        verified: true,
        helpful: 27
      },
      {
        id: 'testimonial-005',
        userName: 'Patricia Jiménez',
        rating: 4,
        comment: 'El tratamiento facial fue excelente. Mi piel se sintió hidratada y renovada. La terapeuta fue muy profesional y explicó cada paso del proceso.',
        service: 'Tratamiento Facial Hidratante',
        date: '2024-01-03',
        verified: true,
        helpful: 15
      }
    ];

    return of(testimonials).pipe(delay(200));
  }

  /**
   * Obtiene preguntas frecuentes mock
   */
  getFAQs(): Observable<MockFAQ[]> {
    const faqs: MockFAQ[] = [
      {
        id: 'faq-001',
        category: 'reservas',
        question: '¿Cómo puedo hacer una reserva?',
        answer: 'Puedes hacer tu reserva a través de nuestra página web, llamando directamente a nuestro centro de atención o visitándonos en persona. Te recomendamos reservar con anticipación, especialmente en temporadas altas.',
        isPopular: true,
        helpful: 45,
        notHelpful: 2
      },
      {
        id: 'faq-002',
        category: 'reservas',
        question: '¿Puedo cancelar mi reserva?',
        answer: 'Sí, puedes cancelar tu reserva. Las políticas de cancelación varían según el servicio o cabaña reservada. Generalmente, las cancelaciones con más de 24-48 horas de anticipación no tienen costo.',
        isPopular: true,
        helpful: 38,
        notHelpful: 5
      },
      {
        id: 'faq-003',
        category: 'servicios',
        question: '¿Los masajes incluyen aceites y productos?',
        answer: 'Sí, todos nuestros servicios de spa incluyen los productos necesarios: aceites esenciales, cremas, mascarillas y demás elementos de alta calidad para garantizar la mejor experiencia.',
        isPopular: false,
        helpful: 22,
        notHelpful: 1
      },
      {
        id: 'faq-004',
        category: 'cabanas',
        question: '¿Las cabañas incluyen cocina equipada?',
        answer: 'La mayoría de nuestras cabañas incluyen cocina equipada con refrigerador, estufa, microondas y utensilios básicos. Las cabañas familiares y premium tienen cocinas completas.',
        isPopular: false,
        helpful: 29,
        notHelpful: 3
      },
      {
        id: 'faq-005',
        category: 'pagos',
        question: '¿Qué métodos de pago aceptan?',
        answer: 'Aceptamos efectivo, tarjetas de crédito y débito (Visa, MasterCard, American Express), transferencias bancarias y pagos digitales como PSE y Nequi.',
        isPopular: true,
        helpful: 41,
        notHelpful: 1
      },
      {
        id: 'faq-006',
        category: 'politicas',
        question: '¿Permiten mascotas?',
        answer: 'Algunas de nuestras cabañas familiares permiten mascotas con restricciones. Se debe informar al momento de la reserva y aplica un cargo adicional. Los servicios de spa no permiten mascotas.',
        isPopular: false,
        helpful: 18,
        notHelpful: 7
      },
      {
        id: 'faq-007',
        category: 'general',
        question: '¿Cuáles son los horarios de atención?',
        answer: 'Nuestro spa está abierto de lunes a domingo de 8:00 AM a 8:00 PM. Las cabañas tienen check-in a partir de las 3:00 PM y check-out hasta las 11:00 AM.',
        isPopular: true,
        helpful: 52,
        notHelpful: 0
      },
      {
        id: 'faq-008',
        category: 'servicios',
        question: '¿Necesito traer algo para los tratamientos?',
        answer: 'No es necesario traer nada. Proporcionamos batas, toallas, sandalias y todos los productos necesarios. Solo ven cómodo y listo para relajarte.',
        isPopular: false,
        helpful: 33,
        notHelpful: 2
      }
    ];

    return of(faqs).pipe(delay(150));
  }

  /**
   * Obtiene estadísticas generales mock
   */
  getGeneralStats(): Observable<{
    totalClients: number;
    satisfactionRate: number;
    servicesProvided: number;
    yearsOfExperience: number;
    totalReviews: number;
    averageRating: number;
    promotionsActive: number;
    activitiesAvailable: number;
  }> {
    const stats = {
      totalClients: 2847,
      satisfactionRate: 96.5,
      servicesProvided: 12650,
      yearsOfExperience: 8,
      totalReviews: 1458,
      averageRating: 4.7,
      promotionsActive: 3,
      activitiesAvailable: 12
    };

    return of(stats).pipe(delay(100));
  }

  /**
   * Obtiene configuración de la aplicación
   */
  getAppConfig(): Observable<{
    maintenanceMode: boolean;
    allowBookings: boolean;
    showPromotions: boolean;
    emergencyMessage?: string;
    supportEmail: string;
    supportPhone: string;
    socialMedia: {
      facebook: string;
      instagram: string;
      twitter: string;
      whatsapp: string;
    };
    businessHours: {
      monday: string;
      tuesday: string;
      wednesday: string;
      thursday: string;
      friday: string;
      saturday: string;
      sunday: string;
    };
    location: {
      address: string;
      city: string;
      coordinates: {
        lat: number;
        lng: number;
      };
    };
  }> {
    const config = {
      maintenanceMode: false,
      allowBookings: true,
      showPromotions: true,
      supportEmail: 'info@countryspa.com',
      supportPhone: '+57 1 234 5678',
      socialMedia: {
        facebook: 'https://facebook.com/countryspa',
        instagram: 'https://instagram.com/countryspa',
        twitter: 'https://twitter.com/countryspa',
        whatsapp: 'https://wa.me/573001234567'
      },
      businessHours: {
        monday: '8:00 AM - 8:00 PM',
        tuesday: '8:00 AM - 8:00 PM',
        wednesday: '8:00 AM - 8:00 PM',
        thursday: '8:00 AM - 8:00 PM',
        friday: '8:00 AM - 9:00 PM',
        saturday: '7:00 AM - 9:00 PM',
        sunday: '7:00 AM - 8:00 PM'
      },
      location: {
        address: 'Km 12 Vía La Calera, Vereda El Hato',
        city: 'La Calera, Cundinamarca',
        coordinates: {
          lat: 4.7218,
          lng: -73.9679
        }
      }
    };

    return of(config).pipe(delay(80));
  }

  /**
   * Simula búsqueda de contenido
   */
  searchContent(query: string): Observable<any[]> {
    // Simular resultados de búsqueda combinando diferentes tipos de contenido
    const mockResults = [
      {
        type: 'service',
        id: 'spa-massage-001',
        title: 'Masaje Relajante',
        description: 'Masaje completo para relajación total',
        relevance: 0.9
      },
      {
        type: 'cabin',
        id: 'cabin-romantic-001',
        title: 'Cabaña Romántica',
        description: 'Refugio romántico con vista al lago',
        relevance: 0.8
      },
      {
        type: 'faq',
        id: 'faq-001',
        title: '¿Cómo hacer una reserva?',
        description: 'Información sobre el proceso de reservas',
        relevance: 0.7
      }
    ].filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
    );

    return of(mockResults).pipe(delay(300));
  }
}