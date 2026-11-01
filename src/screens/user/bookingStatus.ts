// src/screens/user/bookingStatus.ts - Stato di una prenotazione visto dal cliente
import { BookingRequest } from '../../types/database.types';

const lastProposal = (booking: BookingRequest) => {
  const proposals = booking.proposals ?? [];
  return proposals[proposals.length - 1];
};

// Il cliente deve rispondere a una data dell'officina o a un preventivo
export const bookingNeedsUserAction = (booking: BookingRequest) =>
  booking.status === 'quote_sent' ||
  booking.status === 'ready' ||
  (booking.status === 'date_proposed' && lastProposal(booking)?.proposedBy === 'mechanic');

export const isBookingOpen = (booking: BookingRequest) =>
  !['completed', 'cancelled', 'rejected'].includes(booking.status);

export const canCancelBooking = (booking: BookingRequest) =>
  ['pending', 'quote_requested', 'quote_sent', 'date_proposed', 'confirmed'].includes(booking.status);

export const getBookingStatusLabel = (booking: BookingRequest) => {
  switch (booking.status) {
    case 'pending':
    case 'quote_requested':
      return "In attesa dell'officina";
    case 'quote_sent':
      return 'Preventivo da approvare';
    case 'date_proposed':
      return bookingNeedsUserAction(booking) ? 'Data da confermare' : "Data in attesa dell'officina";
    case 'confirmed':
      return 'Confermata';
    case 'in_progress':
      return 'Auto in officina';
    case 'ready':
      return 'Pronta per il ritiro';
    case 'completed':
      return 'Completata';
    case 'rejected':
      return "Rifiutata dall'officina";
    case 'cancelled':
      return 'Annullata';
    default:
      return 'In corso';
  }
};
