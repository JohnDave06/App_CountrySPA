import { Component, OnInit } from '@angular/core';
import { CabinsService, Cabin } from '../../services/cabins/cabins.service';

@Component({
  selector: 'app-cabins-screen',
  templateUrl: './cabins-screen.component.html',
  styleUrls: ['./cabins-screen.component.css']
})
export class CabinsScreenComponent implements OnInit {
  cabins: Cabin[] = [];
  filteredCabins: Cabin[] = [];
  loading = true;
  searchTerm = '';
  selectedCapacity = '';
  selectedPriceRange = '';
  capacityOptions = [
    { value: '', label: 'Cualquier capacidad' },
    { value: '1-2', label: '1-2 personas' },
    { value: '3-4', label: '3-4 personas' },
    { value: '5-6', label: '5-6 personas' },
    { value: '7+', label: '7+ personas' }
  ];
  priceRanges = [
    { value: '', label: 'Cualquier precio' },
    { value: '0-150000', label: '$0 - $150,000' },
    { value: '150000-300000', label: '$150,000 - $300,000' },
    { value: '300000-500000', label: '$300,000 - $500,000' },
    { value: '500000+', label: '$500,000+' }
  ];

  constructor(private cabinsService: CabinsService) {}

  ngOnInit(): void {
    this.loadCabins();
  }

  loadCabins(): void {
    this.cabinsService.getCabins().subscribe({
      next: (cabins: Cabin[]) => {
        this.cabins = cabins;
        this.filteredCabins = cabins;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading cabins:', error);
        this.loading = false;
      }
    });
  }

  filterCabins(): void {
    let filtered = this.cabins;

    // Filter by search term
    if (this.searchTerm) {
      filtered = filtered.filter(cabin =>
        cabin.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        cabin.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        cabin.location.zone.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Filter by capacity
    if (this.selectedCapacity) {
      filtered = filtered.filter(cabin => {
        switch (this.selectedCapacity) {
          case '1-2':
            return cabin.capacity.max <= 2;
          case '3-4':
            return cabin.capacity.max >= 3 && cabin.capacity.max <= 4;
          case '5-6':
            return cabin.capacity.max >= 5 && cabin.capacity.max <= 6;
          case '7+':
            return cabin.capacity.max >= 7;
          default:
            return true;
        }
      });
    }

    // Filter by price range
    if (this.selectedPriceRange) {
      filtered = filtered.filter(cabin => {
        const price = cabin.pricePerNight;
        switch (this.selectedPriceRange) {
          case '0-150000':
            return price <= 150000;
          case '150000-300000':
            return price > 150000 && price <= 300000;
          case '300000-500000':
            return price > 300000 && price <= 500000;
          case '500000+':
            return price > 500000;
          default:
            return true;
        }
      });
    }

    this.filteredCabins = filtered;
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.filterCabins();
  }

  onCapacityChange(capacity: string): void {
    this.selectedCapacity = capacity;
    this.filterCabins();
  }

  onPriceRangeChange(range: string): void {
    this.selectedPriceRange = range;
    this.filterCabins();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCapacity = '';
    this.selectedPriceRange = '';
    this.filteredCabins = this.cabins;
  }

  bookCabin(cabin: Cabin): void {
    // Integration with reservation system would go here
    console.log('Booking cabin:', cabin);
    alert(`¡Excelente elección! La cabaña "${cabin.name}" está disponible. Pronto podrás completar tu reserva.`);
  }

  getCabinTypeIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'luxury':
        return '👑';
      case 'romantic':
        return '💕';
      case 'family':
        return '👨‍👩‍👧‍👦';
      case 'rustic':
        return '🏕️';
      case 'deluxe':
        return '⭐';
      default:
        return '🏠';
    }
  }
}