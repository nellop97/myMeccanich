// src/screens/user/BookingDetailScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useMechanicTheme } from '../mechanic/mechanicTheme';
import MechanicHeader from '../mechanic/MechanicHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  Car,
  MapPin,
  Phone,
  FileText,
  Send,
  Check,
  X,
  AlertCircle,
  MessageCircle,
} from 'lucide-react-native';
import { useStore } from '../../store';
import BookingService from '../../services/BookingService';
import QuoteService from '../../services/QuoteService';
import { BookingRequest, BookingProposal, Quote } from '../../types/database.types';
import NotificationService from '../../services/NotificationService';
import { showAlert, showPrompt } from '../../utils/platformHelpers';
import UniversalDatePicker from '../../components/UniversalDatePicker';
import { canCancelBooking, getBookingStatusLabel } from './bookingStatus';

interface BookingDetailScreenProps {
  navigation: any;
  route: any;
}

export default function BookingDetailScreen({ navigation, route }: BookingDetailScreenProps) {
  const { user } = useStore();
  const theme = useMechanicTheme();
  const { bookingId } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingRequest | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposedDate, setProposedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  });
  // Stessa schermata per entrambi: ognuno risponde solo alle proposte dell'altro
  const myRole = user?.isMechanic ? 'mechanic' : 'user';

  useEffect(() => {
    loadBookingDetails();

    // Real-time listener
    const unsubscribe = BookingService.onBookingChange(bookingId, (updatedBooking) => {
      if (updatedBooking) {
        setBooking(updatedBooking);
        // Mark messages as read
        if (user?.id) {
          BookingService.markMessagesAsRead(bookingId, user.id);
        }
      }
    });

    return () => unsubscribe();
  }, [bookingId, user?.id]);

  useEffect(() => {
    if (booking?.quoteId) {
      loadQuote(booking.quoteId);
    }
  }, [booking?.quoteId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const data = await BookingService.getBookingRequest(bookingId);
      setBooking(data);

      if (user?.id) {
        await BookingService.markMessagesAsRead(bookingId, user.id);
      }
    } catch (error) {
      console.error('Errore caricamento prenotazione:', error);
      showAlert('Errore', 'Impossibile caricare la prenotazione');
    } finally {
      setLoading(false);
    }
  };

  const loadQuote = async (quoteId: string) => {
    try {
      const quoteData = await QuoteService.getQuote(quoteId);
      setQuote(quoteData);
    } catch (error) {
      console.error('Errore caricamento preventivo:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      setSendingMessage(true);
      await BookingService.addMessage(bookingId, {
        senderId: user.id,
        senderName: user.name || 'Utente',
        senderType: user.isMechanic ? 'mechanic' : 'user',
        message: message.trim(),
      });
      setMessage('');
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      showAlert('Errore', 'Impossibile inviare il messaggio');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    try {
      setLoading(true);
      await BookingService.acceptProposal(bookingId, proposalId);
      showAlert('Successo', 'Proposta accettata! La prenotazione è ora confermata.');
    } catch (error) {
      console.error('Errore accettazione proposta:', error);
      showAlert('Errore', 'Impossibile accettare la proposta');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    showAlert(
      'Rifiuta Proposta',
      'Vuoi proporre una data alternativa?',
      [
        {
          text: 'Solo Rifiuta',
          onPress: async () => {
            try {
              setLoading(true);
              await BookingService.rejectProposal(bookingId, proposalId);
            } catch (error) {
              console.error('Errore:', error);
              showAlert('Errore', 'Impossibile rifiutare la proposta');
            } finally {
              setLoading(false);
            }
          },
        },
        {
          text: 'Proponi Altra Data',
          onPress: () => setShowProposalForm(true),
        },
      ]
    );
  };

  const handleSubmitCounterProposal = async () => {
    if (!booking || !user) return;

    const lastProposal = booking.proposals[booking.proposals.length - 1];
    if (!lastProposal) return;

    if (proposedDate.getTime() <= Date.now()) {
      showAlert('Data non valida', 'Scegli una data e un orario futuri');
      return;
    }

    try {
      setLoading(true);
      await BookingService.counterPropose(bookingId, lastProposal.id, {
        proposedBy: myRole,
        proposedDate,
        message: `Ho proposto una data alternativa: ${proposedDate.toLocaleDateString('it-IT')}`,
      });
      setShowProposalForm(false);
      showAlert('Successo', 'Controproposta inviata!');
    } catch (error) {
      console.error('Errore:', error);
      showAlert('Errore', 'Impossibile inviare la controproposta');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveQuote = async () => {
    if (!quote) return;

    showAlert(
      'Approva Preventivo',
      `Confermi di voler approvare il preventivo di €${quote.totalCost.toFixed(2)}?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Approva',
          onPress: async () => {
            try {
              setLoading(true);
              await QuoteService.approveQuote(quote.id);
              await BookingService.updateBookingStatus(bookingId, 'confirmed', {
                quoteStatus: 'approved',
              });
              showAlert('Successo', 'Preventivo approvato! La prenotazione è confermata.');
            } catch (error) {
              console.error('Errore:', error);
              showAlert('Errore', 'Impossibile approvare il preventivo');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectQuote = async () => {
    if (!quote) return;

    showPrompt(
      'Rifiuta Preventivo',
      'Indica il motivo (opzionale)',
      async (reason) => {
        try {
          setLoading(true);
          await QuoteService.rejectQuote(quote.id, reason);
          await BookingService.updateBookingStatus(bookingId, 'pending', {
            quoteStatus: 'rejected',
          });
          showAlert('Preventivo Rifiutato', 'Il meccanico verrà notificato.');
        } catch (error) {
          console.error('Errore:', error);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleCancelBooking = () => {
    showAlert('Annulla prenotazione', "L'officina vedrà che hai annullato la richiesta.", [
      { text: 'Indietro', style: 'cancel' },
      {
        text: 'Annulla prenotazione',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await BookingService.cancelBooking(bookingId);
            showAlert('Prenotazione annullata', "L'officina vede la richiesta come annullata.");
          } catch (error) {
            console.error('Errore annullamento prenotazione:', error);
            showAlert('Errore', 'Impossibile annullare la prenotazione');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleCollected = () => {
    showAlert('Ritiro auto', "Confermi di aver ritirato l'auto?", [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Ho ritirato',
        onPress: async () => {
          try {
            setLoading(true);
            await BookingService.setWorkStatus(bookingId, 'completed');
          } catch (error) {
            console.error('Errore conferma ritiro:', error);
            showAlert('Errore', 'Impossibile confermare il ritiro. Riprova.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const renderCompletion = () => {
    if (!booking || (booking.status !== 'ready' && booking.status !== 'completed')) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {booking.status === 'ready' ? 'La tua auto è pronta' : 'Lavoro concluso'}
        </Text>
        {typeof booking.actualCost === 'number' && (
          <Text style={[styles.quoteTotalValueFinal, { color: theme.text }]}>
            Totale €{booking.actualCost.toFixed(2)} IVA inclusa
          </Text>
        )}
        {booking.maintenanceRecordId && myRole === 'user' && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={() => navigation.navigate('MaintenanceDetail', {
              maintenanceId: booking.maintenanceRecordId,
              carId: booking.vehicleId,
            })}
            accessibilityRole="button"
          >
            <Text style={[styles.cancelButtonText, { color: theme.primary }]}>Vedi costi, ricambi e foto</Text>
          </TouchableOpacity>
        )}
        {booking.status === 'ready' && myRole === 'user' && (
          <TouchableOpacity
            style={[styles.proposalButton, styles.collectButton, { backgroundColor: theme.primary }]}
            onPress={handleCollected}
            accessibilityRole="button"
          >
            <Check size={20} color={theme.onPrimary} />
            <Text style={styles.proposalButtonText}>Ho ritirato l'auto</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderProposalForm = () => {
    if (!showProposalForm) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{"Proponi un'altra data"}</Text>
        <UniversalDatePicker label="Data e ora" mode="datetime" value={proposedDate} onChange={setProposedDate} minimumDate={new Date()} />
        <View style={styles.proposalActions}>
          <TouchableOpacity
            style={[styles.proposalButton, { backgroundColor: theme.border }]}
            onPress={() => setShowProposalForm(false)}
          >
            <Text style={[styles.proposalButtonText, { color: theme.text }]}>Annulla</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.proposalButton, { backgroundColor: theme.primary }]}
            onPress={handleSubmitCounterProposal}
          >
            <Text style={styles.proposalButtonText}>Invia proposta</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderBookingInfo = () => {
    if (!booking) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Dettagli Prenotazione</Text>

        <View style={styles.infoRow}>
          <Car size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            {booking.vehicleMake} {booking.vehicleModel} ({booking.vehicleLicensePlate})
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MapPin size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            {booking.workshopName}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <FileText size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            {booking.serviceName}
          </Text>
        </View>

        {booking.selectedDate && (
          <View style={styles.infoRow}>
            <Calendar size={20} color={theme.success} />
            <Text style={[styles.infoText, { color: theme.success, fontWeight: 'bold' }]}>
              {new Date(booking.selectedDate).toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        )}

        {!booking.selectedDate && booking.preferredDates?.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={[styles.problemTitle, { color: theme.text }]}>Date proposte dal cliente:</Text>
            {booking.preferredDates.map((date) => (
              <View key={new Date(date).getTime()} style={styles.infoRow}>
                <Clock size={20} color={theme.primary} />
                <Text style={[styles.infoText, { color: theme.text }]}>
                  {new Date(date).toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.divider} />

        <Text style={[styles.problemTitle, { color: theme.text }]}>Descrizione Problema:</Text>
        <Text style={[styles.problemText, { color: theme.textSecondary }]}>
          {booking.problemDescription}
        </Text>
      </View>
    );
  };

  const renderProposals = () => {
    if (!booking || booking.proposals.length === 0) return null;

    const pendingProposals = booking.proposals.filter(p => p.status === 'pending');
    if (pendingProposals.length === 0) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Proposte Date</Text>

        {pendingProposals.map((proposal) => (
          <View
            key={proposal.id}
            style={[styles.proposalCard, { backgroundColor: theme.background, borderColor: theme.border }]}
          >
            <View style={styles.proposalHeader}>
              <Calendar size={20} color={theme.primary} />
              <Text style={[styles.proposalDate, { color: theme.text }]}>
                {new Date(proposal.proposedDate).toLocaleDateString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {proposal.message && (
              <Text style={[styles.proposalMessage, { color: theme.textSecondary }]}>
                {proposal.message}
              </Text>
            )}

            {proposal.estimatedCost && (
              <Text style={[styles.proposalCost, { color: theme.success }]}>
                Costo stimato: €{proposal.estimatedCost.toFixed(2)}
              </Text>
            )}

            {proposal.proposedBy === myRole ? (
              <Text style={[styles.proposalMessage, { color: theme.textSecondary }]}>
                In attesa di risposta
              </Text>
            ) : (
            <View style={styles.proposalActions}>
              <TouchableOpacity
                style={[styles.proposalButton, { backgroundColor: theme.success }]}
                onPress={() => handleAcceptProposal(proposal.id)}
              >
                <Check size={20} color={theme.onPrimary} />
                <Text style={styles.proposalButtonText}>Accetta</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.proposalButton, { backgroundColor: theme.error }]}
                onPress={() => handleRejectProposal(proposal.id)}
              >
                <X size={20} color={theme.onPrimary} />
                <Text style={styles.proposalButtonText}>Rifiuta</Text>
              </TouchableOpacity>
            </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderQuote = () => {
    if (!quote || quote.status === 'draft') return null;

    const isExpired = QuoteService.isQuoteExpired(quote);

    return (
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.quoteHeader}>
          <FileText size={24} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preventivo</Text>
        </View>

        {isExpired && (
          <View style={[styles.expiredBanner, { backgroundColor: theme.error + '20' }]}>
            <AlertCircle size={16} color={theme.error} />
            <Text style={[styles.expiredText, { color: theme.error }]}>
              Preventivo scaduto
            </Text>
          </View>
        )}

        {/* Services */}
        {quote.services.length > 0 && (
          <View style={styles.quoteSection}>
            <Text style={[styles.quoteSubtitle, { color: theme.text }]}>Servizi</Text>
            {quote.services.map((service) => (
              <View key={service.id} style={styles.quoteItem}>
                <Text style={[styles.quoteItemName, { color: theme.text }]}>{service.name}</Text>
                <Text style={[styles.quoteItemPrice, { color: theme.text }]}>
                  €{service.laborCost.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Parts */}
        {quote.parts.length > 0 && (
          <View style={styles.quoteSection}>
            <Text style={[styles.quoteSubtitle, { color: theme.text }]}>Ricambi</Text>
            {quote.parts.map((part) => (
              <View key={part.id} style={styles.quoteItem}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.quoteItemName, { color: theme.text }]}>{part.name}</Text>
                  <Text style={[styles.quoteItemDetail, { color: theme.textSecondary }]}>
                    Qtà: {part.quantity} x €{part.unitPrice.toFixed(2)}
                  </Text>
                </View>
                <Text style={[styles.quoteItemPrice, { color: theme.text }]}>
                  €{part.totalPrice.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={[styles.quoteTotals, { borderTopColor: theme.border }]}>
          <View style={styles.quoteTotalRow}>
            <Text style={[styles.quoteTotalLabel, { color: theme.textSecondary }]}>Subtotale</Text>
            <Text style={[styles.quoteTotalValue, { color: theme.text }]}>
              €{quote.subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.quoteTotalRow}>
            <Text style={[styles.quoteTotalLabel, { color: theme.textSecondary }]}>
              IVA ({quote.vatRate}%)
            </Text>
            <Text style={[styles.quoteTotalValue, { color: theme.text }]}>
              €{quote.vatAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.quoteTotalRow}>
            <Text style={[styles.quoteTotalLabelFinal, { color: theme.text }]}>Totale</Text>
            <Text style={[styles.quoteTotalValueFinal, { color: theme.success }]}>
              €{quote.totalCost.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {quote.status === 'sent' && !isExpired && myRole === 'user' && (
          <View style={styles.quoteActions}>
            <TouchableOpacity
              style={[styles.quoteButton, { backgroundColor: theme.success }]}
              onPress={handleApproveQuote}
            >
              <Check size={20} color={theme.onPrimary} />
              <Text style={styles.quoteButtonText}>Approva Preventivo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quoteButton, { backgroundColor: theme.error }]}
              onPress={handleRejectQuote}
            >
              <X size={20} color={theme.onPrimary} />
              <Text style={styles.quoteButtonText}>Rifiuta</Text>
            </TouchableOpacity>
          </View>
        )}

        {quote.status === 'approved' && (
          <View style={[styles.approvedBanner, { backgroundColor: theme.success + '20' }]}>
            <Check size={20} color={theme.success} />
            <Text style={[styles.approvedText, { color: theme.success }]}>
              Preventivo approvato
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderChat = () => {
    if (!booking) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.chatHeader}>
          <MessageCircle size={20} color={theme.primary} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Chat</Text>
        </View>

        <View style={styles.messagesContainer}>
          {booking.messages.map((msg, index) => {
            const isUser = msg.senderType === 'user';
            return (
              <View
                key={index}
                style={[
                  styles.message,
                  isUser ? styles.messageUser : styles.messageMechanic,
                  { backgroundColor: isUser ? theme.primary : theme.border },
                ]}
              >
                <Text style={[styles.messageSender, { color: isUser ? theme.onPrimary : theme.text }]}>
                  {msg.senderName}
                </Text>
                <Text style={[styles.messageText, { color: isUser ? theme.onPrimary : theme.text }]}>
                  {msg.message}
                </Text>
                <Text style={[styles.messageTime, { color: isUser ? theme.textSecondary : theme.textSecondary }]}>
                  {new Date(msg.createdAt).toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading && !booking) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.surface }}>
        <MechanicHeader
          title="Dettaglio Prenotazione"
          subtitle={booking ? getBookingStatusLabel(booking) : undefined}
          onBack={() => navigation.goBack()}
        />
      </SafeAreaView>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCompletion()}
        {renderBookingInfo()}
        {renderProposals()}
        {renderProposalForm()}
        {renderQuote()}
        {renderChat()}
        {booking && myRole === 'user' && canCancelBooking(booking) && (
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border }]}
            onPress={handleCancelBooking}
            accessibilityRole="button"
          >
            <Text style={[styles.cancelButtonText, { color: theme.error }]}>Annulla prenotazione</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Message Input */}
      {booking && booking.status !== 'completed' && booking.status !== 'cancelled' && (
        <View style={[styles.messageInput, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            placeholder="Scrivi un messaggio..."
            placeholderTextColor={theme.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: message.trim() ? theme.primary : theme.border }]}
            onPress={handleSendMessage}
            disabled={!message.trim() || sendingMessage}
          >
            <Send size={20} color={theme.onPrimary} />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  collectButton: {
    flex: 0,
    minHeight: 44,
    marginTop: 8,
  },
  cancelButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  section: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  problemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  problemText: {
    fontSize: 14,
    lineHeight: 20,
  },
  proposalCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proposalDate: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  proposalMessage: {
    fontSize: 14,
  },
  proposalCost: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  proposalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  proposalButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  proposalButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quoteSection: {
    gap: 8,
  },
  quoteSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quoteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  quoteItemName: {
    fontSize: 14,
  },
  quoteItemDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  quoteItemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  quoteTotals: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  quoteTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quoteTotalLabel: {
    fontSize: 14,
  },
  quoteTotalValue: {
    fontSize: 14,
  },
  quoteTotalLabelFinal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quoteTotalValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quoteActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  quoteButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quoteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  expiredText: {
    fontSize: 14,
    fontWeight: '600',
  },
  approvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  approvedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messagesContainer: {
    gap: 12,
  },
  message: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
  },
  messageUser: {
    alignSelf: 'flex-end',
  },
  messageMechanic: {
    alignSelf: 'flex-start',
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  messageInput: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
