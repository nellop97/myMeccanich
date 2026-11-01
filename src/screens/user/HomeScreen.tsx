// src/screens/user/HomeScreen.tsx
// Home del proprietario: il veicolo, cosa c'è da fare e la prossima prenotazione
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    AlertCircle,
    Calendar,
    Car,
    ChevronRight,
    DollarSign,
    Eye,
    Fuel,
    LucideIcon,
    Plus,
    Repeat,
    Search,
    Settings,
    Wrench,
} from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

import { db } from '../../services/firebase';
import { useStore } from '../../store';
import BookingService from '../../services/BookingService';
import { TransferService } from '../../services/TransferService';
import { VehicleViewRequestService } from '../../services/VehicleViewRequestService';
import TransferAcceptanceModal from '../../components/TransferAcceptanceModal';
import { BookingRequest, VehicleTransfer } from '../../types/database.types';
import { MechanicTheme, mechanicCard, mechanicRadius, useMechanicBreakpoints, useMechanicTheme } from '../mechanic/mechanicTheme';
import UserLayout from './UserLayout';
import { bookingNeedsUserAction, getBookingStatusLabel, isBookingOpen } from './bookingStatus';

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    mileage?: number;
    currentMileage?: number;
    imageUrl?: string;
    mainImageUrl?: string;
}

interface Deadline {
    id: string;
    vehicleId: string;
    description: string;
    dueDate: any;
}

interface RecentActivity {
    id: string;
    description: string;
    date: any;
    cost?: number;
}

interface TodoItem {
    id: string;
    icon: LucideIcon;
    title: string;
    subtitle: string;
    tone: 'primary' | 'warning' | 'error';
    onPress: () => void;
}

const toDate = (value: any): Date => value?.toDate?.() || new Date(value);

const formatShortDate = (value: any) =>
    toDate(value).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

const formatBookingDate = (value: any) =>
    toDate(value).toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
    });

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);

const getDaysUntil = (value: any) =>
    Math.ceil((toDate(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

const Section = ({ title, theme, children }: { title: string; theme: MechanicTheme; children: React.ReactNode }) => (
    <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]} accessibilityRole="header">
            {title}
        </Text>
        {children}
    </View>
);

const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { user } = useStore();
    const theme = useMechanicTheme();
    const { isDesktop, isMobile } = useMechanicBreakpoints();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [bookings, setBookings] = useState<BookingRequest[]>([]);
    const [pendingViewRequests, setPendingViewRequests] = useState(0);
    const [transfers, setTransfers] = useState<VehicleTransfer[]>([]);
    const [selectedTransfer, setSelectedTransfer] = useState<VehicleTransfer | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadSecondaryData = async (vehicleIds: string[]) => {
        const [deadlineDocs, activityDocs, viewRequests, activeTransfers] = await Promise.allSettled([
            vehicleIds.length > 0
                ? getDocs(query(
                    collection(db, 'deadlines'),
                    where('vehicleId', 'in', vehicleIds.slice(0, 30)),
                    where('status', '==', 'active'),
                    orderBy('dueDate', 'asc'),
                    limit(10)
                ))
                : Promise.resolve(null),
            vehicleIds.length > 0
                ? getDocs(query(
                    collection(db, 'activities'),
                    where('vehicleId', 'in', vehicleIds.slice(0, 30)),
                    orderBy('date', 'desc'),
                    limit(5)
                ))
                : Promise.resolve(null),
            user?.id ? VehicleViewRequestService.getInstance().getIncomingRequests(user.id) : Promise.resolve([]),
            user?.email ? TransferService.getInstance().getActiveTransfers(user.email) : Promise.resolve([]),
        ]);

        if (deadlineDocs.status === 'fulfilled' && deadlineDocs.value) {
            setDeadlines(deadlineDocs.value.docs.map((d) => ({ id: d.id, ...d.data() })) as Deadline[]);
        }
        if (activityDocs.status === 'fulfilled' && activityDocs.value) {
            setActivities(activityDocs.value.docs.map((d) => ({ id: d.id, ...d.data() })) as RecentActivity[]);
        }
        if (viewRequests.status === 'fulfilled') {
            setPendingViewRequests(viewRequests.value.filter((r) => r.status === 'pending').length);
        }
        if (activeTransfers.status === 'fulfilled') {
            setTransfers(activeTransfers.value);
        }
    };

    const loadData = useCallback(async () => {
        if (!user?.id) return;

        try {
            setLoadFailed(false);
            const snapshot = await getDocs(query(
                collection(db, 'vehicles'),
                where('ownerId', '==', user.id),
                where('isActive', '==', true)
            ));

            const vehiclesList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Vehicle[];
            setVehicles(vehiclesList);
            setSelectedVehicleId((current) =>
                current && vehiclesList.some((v) => v.id === current) ? current : vehiclesList[0]?.id ?? null
            );

            // Il veicolo si mostra subito: il resto non deve tenere ferma la pagina
            setLoading(false);
            await loadSecondaryData(vehiclesList.map((v) => v.id));
        } catch (error) {
            console.error('Errore caricamento Home:', error);
            setLoadFailed(true);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?.email]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    useEffect(() => {
        if (!user?.id) return;
        return BookingService.onUserBookingsChange(user.id, setBookings);
    }, [user?.id]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) ?? null;
    const nextBooking = useMemo(() => bookings.find(isBookingOpen) ?? null, [bookings]);
    const bookingsToAnswer = useMemo(() => bookings.filter(bookingNeedsUserAction), [bookings]);

    const todoItems = useMemo(() => {
        const items: TodoItem[] = bookingsToAnswer.map((booking) => ({
            id: `booking-${booking.id}`,
            icon: Calendar,
            title: getBookingStatusLabel(booking),
            subtitle: `${booking.workshopName} · ${booking.vehicleMake} ${booking.vehicleModel}`,
            tone: 'primary',
            onPress: () => navigation.navigate('BookingDetail', { bookingId: booking.id }),
        }));

        transfers.forEach((transfer) => {
            items.push({
                id: `transfer-${transfer.id}`,
                icon: Repeat,
                title: 'Trasferimento di proprietà da confermare',
                subtitle: 'Controlla i dati del veicolo',
                tone: 'primary',
                onPress: () => setSelectedTransfer(transfer),
            });
        });

        if (pendingViewRequests > 0) {
            items.push({
                id: 'view-requests',
                icon: Eye,
                title: pendingViewRequests === 1
                    ? '1 richiesta di vedere i dati del veicolo'
                    : `${pendingViewRequests} richieste di vedere i dati del veicolo`,
                subtitle: 'Approva o rifiuta',
                tone: 'primary',
                onPress: () => navigation.navigate('ViewRequests'),
            });
        }

        deadlines
            .filter((deadline) => getDaysUntil(deadline.dueDate) <= 30)
            .slice(0, 4)
            .forEach((deadline) => {
                const days = getDaysUntil(deadline.dueDate);
                const vehicle = vehicles.find((v) => v.id === deadline.vehicleId);
                items.push({
                    id: `deadline-${deadline.id}`,
                    icon: AlertCircle,
                    title: deadline.description,
                    subtitle: `${days < 0 ? 'Scaduta il' : 'Scade il'} ${formatShortDate(deadline.dueDate)}${vehicle ? ` · ${vehicle.make} ${vehicle.model}` : ''}`,
                    tone: days < 0 ? 'error' : 'warning',
                    onPress: () => navigation.navigate('Reminders'),
                });
            });

        return items;
    }, [bookingsToAnswer, transfers, pendingViewRequests, deadlines, vehicles, navigation]);

    const toneColors = {
        primary: { background: theme.primaryLight, color: theme.onPrimaryLight },
        warning: { background: theme.warningLight, color: theme.text },
        error: { background: theme.errorLight, color: theme.text },
    };

    const cardStyle = [styles.card, { backgroundColor: theme.surface, borderColor: theme.border }];
    const firstName = user?.name?.split(' ')[0];

    const renderBookingCard = () => {
        if (nextBooking) {
            const date = nextBooking.selectedDate;
            return (
                <TouchableOpacity
                    style={cardStyle}
                    onPress={() => navigation.navigate('BookingDetail', { bookingId: nextBooking.id })}
                    accessibilityRole="button"
                    accessibilityLabel={`Prenotazione presso ${nextBooking.workshopName}, ${getBookingStatusLabel(nextBooking)}`}
                >
                    <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>Prossima prenotazione</Text>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                        {date ? formatBookingDate(date) : getBookingStatusLabel(nextBooking)}
                    </Text>
                    <Text style={[styles.cardText, { color: theme.textSecondary }]}>
                        {nextBooking.workshopName} · {nextBooking.serviceName}
                    </Text>
                </TouchableOpacity>
            );
        }

        return (
            <View style={cardStyle}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Serve un intervento?</Text>
                <Text style={[styles.cardText, { color: theme.textSecondary }]}>
                    {"Scegli un'officina e proponi le date che preferisci."}
                </Text>
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                    onPress={() => navigation.navigate('WorkshopSearch')}
                    accessibilityRole="button"
                >
                    <Search size={18} color={theme.onPrimary} strokeWidth={2} />
                    <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>Prenota un intervento</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderVehicle = () => {
        if (!selectedVehicle) return null;
        const imageUrl = selectedVehicle.mainImageUrl || selectedVehicle.imageUrl;
        const mileage = selectedVehicle.mileage ?? selectedVehicle.currentMileage;

        return (
            <TouchableOpacity
                style={[styles.vehicleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => navigation.navigate('CarDetail', { carId: selectedVehicle.id })}
                accessibilityRole="button"
                accessibilityLabel={`Apri la scheda di ${selectedVehicle.make} ${selectedVehicle.model}`}
            >
                {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.vehicleImage} accessibilityLabel={`Foto di ${selectedVehicle.make} ${selectedVehicle.model}`} />
                ) : (
                    <View style={[styles.vehicleImage, styles.vehiclePlaceholder, { backgroundColor: theme.surfaceVariant }]}>
                        <Car size={40} color={theme.textSecondary} strokeWidth={2} />
                    </View>
                )}
                <View style={styles.vehicleInfo}>
                    <Text style={[styles.vehicleName, { color: theme.text }]} numberOfLines={2}>
                        {selectedVehicle.make} {selectedVehicle.model}
                    </Text>
                    <View style={[styles.plate, { borderColor: theme.border }]}>
                        <Text style={[styles.plateText, { color: theme.text }]}>{selectedVehicle.licensePlate}</Text>
                    </View>
                    <Text style={[styles.cardText, { color: theme.textSecondary }]}>
                        {selectedVehicle.year}
                        {typeof mileage === 'number' ? ` · ${mileage.toLocaleString('it-IT')} km` : ''}
                    </Text>
                </View>
                <ChevronRight size={20} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
        );
    };

    const logActions: { label: string; route: string; icon: LucideIcon }[] = [
        { label: 'Rifornimento', route: 'AddFuel', icon: Fuel },
        { label: 'Spesa', route: 'AddExpense', icon: DollarSign },
        { label: 'Manutenzione', route: 'AddMaintenance', icon: Wrench },
    ];

    const renderVehicleArea = () => (
        <>
            {vehicles.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleTabs}>
                    {vehicles.map((vehicle) => {
                        const isSelected = vehicle.id === selectedVehicleId;
                        return (
                            <TouchableOpacity
                                key={vehicle.id}
                                style={[
                                    styles.vehicleTab,
                                    {
                                        backgroundColor: isSelected ? theme.primaryLight : theme.surface,
                                        borderColor: isSelected ? theme.primary : theme.border,
                                    },
                                ]}
                                onPress={() => setSelectedVehicleId(vehicle.id)}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isSelected }}
                            >
                                <Text style={[styles.vehicleTabText, { color: isSelected ? theme.onPrimaryLight : theme.text }]}>
                                    {vehicle.make} {vehicle.model}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}

            {renderVehicle()}
        </>
    );

    const renderLogArea = () => (
        <>
            <Section title="Registra" theme={theme}>
                <View style={styles.logRow}>
                    {logActions.map(({ label, route, icon: Icon }) => (
                        <TouchableOpacity
                            key={route}
                            style={[styles.logAction, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={() => navigation.navigate(route, { carId: selectedVehicleId })}
                            accessibilityRole="button"
                            accessibilityLabel={`Registra ${label.toLowerCase()}`}
                        >
                            <Icon size={22} color={theme.primary} strokeWidth={2} />
                            <Text style={[styles.logLabel, { color: theme.text }]} numberOfLines={1}>{label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Section>

            {activities.length > 0 && (
                <Section title="Ultime attività" theme={theme}>
                    <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {activities.map((activity, index) => (
                            <View
                                key={activity.id}
                                style={[styles.listRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
                            >
                                <View style={styles.listBody}>
                                    <Text style={[styles.listTitle, { color: theme.text }]}>{activity.description}</Text>
                                    <Text style={[styles.cardText, { color: theme.textSecondary }]}>{formatShortDate(activity.date)}</Text>
                                </View>
                                {typeof activity.cost === 'number' && (
                                    <Text style={[styles.listTitle, { color: theme.text }]}>{formatCurrency(activity.cost)}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                </Section>
            )}
        </>
    );

    const renderSideColumn = () => (
        <View style={[isDesktop ? styles.sideColumn : styles.stackedColumn]}>
            {renderBookingCard()}

            <Section title="Da fare" theme={theme}>
                {todoItems.length === 0 ? (
                    <View style={cardStyle}>
                        <Text style={[styles.cardText, { color: theme.textSecondary }]}>
                            Niente da fare: nessuna scadenza nei prossimi 30 giorni.
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {todoItems.map(({ id, icon: Icon, title, subtitle, tone, onPress }, index) => (
                            <TouchableOpacity
                                key={id}
                                style={[styles.listRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}
                                onPress={onPress}
                                accessibilityRole="button"
                            >
                                <View style={[styles.todoIcon, { backgroundColor: toneColors[tone].background }]}>
                                    <Icon size={18} color={toneColors[tone].color} strokeWidth={2} />
                                </View>
                                <View style={styles.listBody}>
                                    <Text style={[styles.listTitle, { color: theme.text }]}>{title}</Text>
                                    <Text style={[styles.cardText, { color: theme.textSecondary }]}>{subtitle}</Text>
                                </View>
                                <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </Section>

            <TouchableOpacity
                style={[styles.linkRow, { borderColor: theme.border }]}
                onPress={() => navigation.navigate('RequestVehicleView')}
                accessibilityRole="button"
            >
                <Text style={[styles.cardText, styles.listBody, { color: theme.text }]}>
                    {"Stai comprando un'auto? Chiedi di vederne i dati"}
                </Text>
                <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.linkRow}
                onPress={() => navigation.navigate('MyVehicleViewRequests')}
                accessibilityRole="button"
            >
                <Text style={[styles.cardText, styles.listBody, { color: theme.text }]}>
                    Le tue richieste di dati sui veicoli
                </Text>
                <ChevronRight size={18} color={theme.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
        </View>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            );
        }

        if (loadFailed) {
            return (
                <View style={styles.centered}>
                    <AlertCircle size={40} color={theme.error} strokeWidth={2} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Impossibile caricare i tuoi veicoli</Text>
                    <Text style={[styles.cardText, { color: theme.textSecondary }]}>Controlla la connessione e riprova.</Text>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                        onPress={() => {
                            setLoading(true);
                            loadData();
                        }}
                        accessibilityRole="button"
                    >
                        <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>Riprova</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (vehicles.length === 0) {
            return (
                <View style={styles.centered}>
                    <Car size={48} color={theme.textSecondary} strokeWidth={2} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Aggiungi la tua prima auto</Text>
                    <Text style={[styles.cardText, styles.centeredText, { color: theme.textSecondary }]}>
                        Tieni insieme manutenzioni, spese e scadenze, e prenota in officina.
                    </Text>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                        onPress={() => navigation.navigate('AddVehicle')}
                        accessibilityRole="button"
                    >
                        <Plus size={18} color={theme.onPrimary} strokeWidth={2} />
                        <Text style={[styles.primaryButtonText, { color: theme.onPrimary }]}>Aggiungi veicolo</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={[styles.columns, isDesktop && styles.columnsDesktop]}>
                {isDesktop ? (
                    <>
                        <View style={styles.column}>
                            {renderVehicleArea()}
                            {renderLogArea()}
                        </View>
                        {renderSideColumn()}
                    </>
                ) : (
                    <>
                        {renderVehicleArea()}
                        {renderSideColumn()}
                        {renderLogArea()}
                    </>
                )}
            </View>
        );
    };

    return (
        <UserLayout active="home" badges={{ bookings: bookingsToAnswer.length }}>
            <ScrollView
                style={[styles.page, { backgroundColor: theme.background }]}
                contentContainerStyle={[styles.pageContent, !isMobile && styles.pageContentWide]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
            >
                <View style={styles.pageHeader}>
                    <Text style={[styles.greeting, { color: theme.text }]} accessibilityRole="header">
                        {firstName ? `Ciao, ${firstName}` : 'Ciao'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.addButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        onPress={() => navigation.navigate('Settings')}
                        accessibilityRole="button"
                        accessibilityLabel="Impostazioni"
                    >
                        <Settings size={18} color={theme.text} strokeWidth={2} />
                    </TouchableOpacity>
                    {vehicles.length > 0 && (
                        <TouchableOpacity
                            style={[styles.addButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                            onPress={() => navigation.navigate('AddVehicle')}
                            accessibilityRole="button"
                            accessibilityLabel="Aggiungi veicolo"
                        >
                            <Plus size={18} color={theme.text} strokeWidth={2} />
                            {!isMobile && <Text style={[styles.addButtonText, { color: theme.text }]}>Aggiungi veicolo</Text>}
                        </TouchableOpacity>
                    )}
                </View>
                {renderContent()}
            </ScrollView>

            <TransferAcceptanceModal
                visible={selectedTransfer !== null}
                onClose={() => setSelectedTransfer(null)}
                transfer={selectedTransfer}
                onTransferProcessed={loadData}
            />
        </UserLayout>
    );
};

const styles = StyleSheet.create({
    page: {
        flex: 1,
    },
    pageContent: {
        padding: 16,
        paddingBottom: 32,
        gap: 16,
    },
    pageContentWide: {
        padding: 32,
        width: '100%',
        maxWidth: 1120,
        alignSelf: 'center',
    },
    pageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    greeting: {
        flex: 1,
        fontSize: 28,
        fontWeight: '700',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minWidth: 44,
        minHeight: 44,
        paddingHorizontal: 12,
        borderRadius: mechanicRadius.md,
        borderWidth: 1,
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    columns: {
        gap: 24,
    },
    columnsDesktop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    column: {
        flex: 1,
        gap: 24,
        minWidth: 0,
    },
    sideColumn: {
        width: 360,
        gap: 24,
    },
    stackedColumn: {
        gap: 24,
    },
    section: {
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    card: {
        ...mechanicCard,
        gap: 8,
    },
    eyebrow: {
        fontSize: 12,
        fontWeight: '700',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    cardText: {
        fontSize: 14,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 44,
        marginTop: 8,
        paddingHorizontal: 16,
        borderRadius: mechanicRadius.md,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    vehicleTabs: {
        gap: 8,
    },
    vehicleTab: {
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: mechanicRadius.full,
        borderWidth: 1,
    },
    vehicleTabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    vehicleCard: {
        ...mechanicCard,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    vehicleImage: {
        width: 120,
        height: 90,
        borderRadius: mechanicRadius.md,
    },
    vehiclePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    vehicleInfo: {
        flex: 1,
        gap: 6,
        alignItems: 'flex-start',
    },
    vehicleName: {
        fontSize: 20,
        fontWeight: '700',
    },
    plate: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
        borderRadius: 6,
    },
    plateText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    logRow: {
        flexDirection: 'row',
        gap: 8,
    },
    logAction: {
        flex: 1,
        minHeight: 84,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 8,
        borderWidth: 1,
        borderRadius: mechanicRadius.lg,
    },
    logLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    list: {
        borderWidth: 1,
        borderRadius: mechanicRadius.xl,
        overflow: 'hidden',
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    listBody: {
        flex: 1,
    },
    listTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    todoIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    linkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 44,
        paddingVertical: 8,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 64,
    },
    centeredText: {
        textAlign: 'center',
        maxWidth: 360,
    },
});

export default HomeScreen;
