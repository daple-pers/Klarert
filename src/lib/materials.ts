import facade from '@/assets/facade.jpg';
import brick from '@/assets/brick.jpg';
import steel from '@/assets/steel.jpg';
import concrete from '@/assets/concrete.jpg';
import wood from '@/assets/wood.jpg';
import windows from '@/assets/windows.jpg';

export const categories = ['Alle', 'Fasadeplater', 'Tegl & Mur', 'Stål & Bjelker', 'Betong & Hulldekker', 'Tre & Interiør'];
export type Material = { id: number; title: string; category: string; image: string; level: number; date: string; dateLabel: string; quantity: string; unit: string; condition: string; donor: string; city: string; seller: string; advisor: string; co2: string; price: number; structural: boolean };
export const materials: Material[] = [
  { id: 1, title: 'Cembrit Fasadeplater Grå 8mm', category: 'Fasadeplater', image: facade, level: 2, date: '2027-08-15', dateLabel: '15. aug 2027', quantity: '1 200', unit: 'm²', condition: 'God', donor: 'Teknobyen', city: 'Trondheim', seller: 'Trondheim kommune', advisor: 'Rambøll AS', co2: '14,2', price: 180, structural: false },
  { id: 2, title: 'Rød teglstein – massiv tegl', category: 'Tegl & Mur', image: brick, level: 2, date: '2027-09-01', dateLabel: '1. sep 2027', quantity: '18 000', unit: 'stk', condition: 'God', donor: 'Industrigata 12', city: 'Stjørdal', seller: 'Stjørdal kommune', advisor: 'Norconsult AS', co2: '9,8', price: 8, structural: false },
  { id: 3, title: 'Stålbjelker HEB 200 – S355', category: 'Stål & Bjelker', image: steel, level: 3, date: '2027-09-15', dateLabel: '15. sep 2027', quantity: '48', unit: 'stk', condition: 'Meget god', donor: 'Ørin næringspark', city: 'Verdal', seller: 'Verdal Industripark AS', advisor: 'Sweco Norge AS', co2: '22,6', price: 1450, structural: true },
  { id: 4, title: 'Hulldekker HD 265', category: 'Betong & Hulldekker', image: concrete, level: 2, date: '2027-10-01', dateLabel: '1. okt 2027', quantity: '640', unit: 'm²', condition: 'God', donor: 'Sluppen kontorbygg', city: 'Trondheim', seller: 'Kjeldsberg Eiendom AS', advisor: 'Rambøll AS', co2: '18,4', price: 320, structural: true },
  { id: 5, title: 'Massivt eikegulv 22mm', category: 'Tre & Interiør', image: wood, level: 1, date: '2027-10-15', dateLabel: '15. okt 2027', quantity: '380', unit: 'm²', condition: 'God', donor: 'Sentrum skole', city: 'Stjørdal', seller: 'Stjørdal kommune', advisor: 'Norconsult AS', co2: '3,1', price: 240, structural: false },
  { id: 6, title: 'Aluminiumsvinduer 3-lags', category: 'Fasadeplater', image: windows, level: 2, date: '2027-11-01', dateLabel: '1. nov 2027', quantity: '64', unit: 'stk', condition: 'Meget god', donor: 'Lade kontorsenter', city: 'Trondheim', seller: 'Entra ASA', advisor: 'Sweco Norge AS', co2: '6,7', price: 2100, structural: false },
];
export async function downloadReport(material: Material) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  pdf.setFontSize(22); pdf.text('Klarert | Eksempelrapport', 20, 25);
  pdf.setFontSize(11);
  const lines = ['TEK17 § 9-7 - Kartlegging for ombruk', '', 'PROTOTYPE - ikke gyldig dokumentasjon eller sertifisering.', '', material.title, `Donorbygg: ${material.donor}, ${material.city}`, `Mengde: ${material.quantity} ${material.unit}`, `Tilstand: ${material.condition}`, `Klareringsnivå: ${material.level}`, `Selger: ${material.seller}`, `Ombruksrådgiver: ${material.advisor}`, `Tilgjengelig: ${material.dateLabel}`, `Estimert CO2-besparelse: ${material.co2} tonn`, '', 'Materialets egnethet må vurderes for det konkrete bruksområdet.', 'Faktiske testresultater og dokumentasjon må innhentes fra selger.'];
  pdf.text(lines, 20, 45); pdf.save(`Klarert-eksempelrapport-${material.id}.pdf`);
}