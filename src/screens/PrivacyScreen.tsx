// src/screens/PrivacyScreen.tsx
/**
 * PrivacyScreen - Pagina Privacy Policy
 * Visualizzazione completa della privacy policy con scroll e design responsive
 */

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Shield, Mail, Lock, Eye, Database } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const PrivacyScreen = () => {
    const navigation = useNavigation();
    const { width } = useWindowDimensions();

    // Breakpoints
    const isDesktop = width >= 1024;
    const isTablet = width >= 768 && width < 1024;
    const isMobile = width < 768;

    // Render Header
    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <ChevronLeft size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <View style={styles.placeholder} />
        </View>
    );

    // Render Icon Section
    const IconSection = ({ icon: Icon, title }: any) => (
        <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
                <Icon size={24} color="#007AFF" />
            </View>
            <Text style={styles.iconTitle}>{title}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {renderHeader()}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    isDesktop && styles.scrollContentDesktop,
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <View style={styles.hero}>
                    <Shield size={64} color="#007AFF" />
                    <Text style={styles.heroTitle}>Privacy & Sicurezza</Text>
                    <Text style={styles.heroSubtitle}>
                        La tua privacy è importante per noi. Questa policy spiega come raccogliamo,
                        usiamo e proteggiamo i tuoi dati personali.
                    </Text>
                    <Text style={styles.lastUpdated}>
                        Ultimo aggiornamento: 17 Ottobre 2025
                    </Text>
                </View>

                {/* Icons Grid */}
                <View style={styles.iconsGrid}>
                    <IconSection icon={Lock} title="Dati Protetti" />
                    <IconSection icon={Eye} title="Trasparenza" />
                    <IconSection icon={Database} title="Controllo" />
                    <IconSection icon={Shield} title="Sicurezza" />
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Sezione 1 */}
                    <Section
                        number="1"
                        title="Informazioni che raccogliamo"
                        content="Raccogliamo diversi tipi di informazioni per fornire e migliorare il servizio:"
                    />

                    <BulletPoint text="Informazioni dell'account: nome, email, telefono" />
                    <BulletPoint text="Dati del veicolo: marca, modello, targa, informazioni tecniche" />
                    <BulletPoint text="Cronologia manutenzioni e riparazioni" />
                    <BulletPoint text="Dati di utilizzo dell'app e preferenze" />
                    <BulletPoint text="Per meccanici: dati dell'officina, P.IVA, licenze" />

                    {/* Sezione 2 */}
                    <Section
                        number="2"
                        title="Come utilizziamo i tuoi dati"
                        content="Utilizziamo le informazioni raccolte per:"
                    />

                    <BulletPoint text="Fornire e gestire il servizio MyMechanic" />
                    <BulletPoint text="Personalizzare la tua esperienza" />
                    <BulletPoint text="Inviare notifiche e promemoria importanti" />
                    <BulletPoint text="Analizzare e migliorare il servizio" />
                    <BulletPoint text="Prevenire frodi e abusi" />
                    <BulletPoint text="Adempiere agli obblighi legali" />

                    {/* Sezione 3 */}
                    <Section
                        number="3"
                        title="Condivisione dei dati"
                        content="Non vendiamo mai i tuoi dati personali a terze parti. Condividiamo i dati solo quando necessario:"
                    />

                    <BulletPoint text="Con meccanici autorizzati per servizi richiesti" />
                    <BulletPoint text="Con fornitori di servizi che ci aiutano (hosting, analytics)" />
                    <BulletPoint text="Quando richiesto dalla legge o autorità competenti" />
                    <BulletPoint text="Con il tuo consenso esplicito" />

                    {/* Sezione 4 */}
                    <Section
                        number="4"
                        title="Sicurezza dei dati"
                        content="Implementiamo misure di sicurezza avanzate per proteggere i tuoi dati:"
                    />

                    <BulletPoint text="Crittografia end-to-end per dati sensibili" />
                    <BulletPoint text="Autenticazione sicura con Firebase" />
                    <BulletPoint text="Backup regolari e ridondanza dei dati" />
                    <BulletPoint text="Monitoraggio continuo per attività sospette" />
                    <BulletPoint text="Accesso ai dati limitato solo al personale autorizzato" />

                    {/* Sezione 5 */}
                    <Section
                        number="5"
                        title="I tuoi diritti"
                        content="Hai il diritto di:"
                    />

                    <BulletPoint text="Accedere ai tuoi dati personali" />
                    <BulletPoint text="Correggere dati errati o incompleti" />
                    <BulletPoint text="Richiedere la cancellazione dei tuoi dati" />
                    <BulletPoint text="Esportare i tuoi dati in formato leggibile" />
                    <BulletPoint text="Opporti al trattamento dei tuoi dati" />
                    <BulletPoint text="Revocare il consenso in qualsiasi momento" />

                    {/* Sezione 6 */}
                    <Section
                        number="6"
                        title="Cookie e tecnologie simili"
                        content="Utilizziamo cookie e tecnologie simili per:"
                    />

                    <BulletPoint text="Mantenere attiva la sessione di login" />
                    <BulletPoint text="Ricordare le tue preferenze" />
                    <BulletPoint text="Analizzare l'utilizzo dell'app" />
                    <BulletPoint text="Migliorare le performance" />

                    <Note>
                        Puoi gestire le preferenze sui cookie nelle impostazioni del tuo browser o
                        dispositivo.
                    </Note>

                    {/* Sezione 7 */}
                    <Section
                        number="7"
                        title="Servizi di terze parti"
                        content="MyMechanic integra i seguenti servizi di terze parti:"
                    />

                    <BulletPoint text="Firebase (Google) - Autenticazione e database" />
                    <BulletPoint text="Cloud Storage - Archiviazione file e immagini" />
                    <BulletPoint text="Analytics - Statistiche anonime di utilizzo" />

                    <Note>
                        Questi servizi hanno le proprie policy sulla privacy. Ti consigliamo di
                        leggerle per comprendere come gestiscono i tuoi dati.
                    </Note>

                    {/* Sezione 8 */}
                    <Section
                        number="8"
                        title="Conservazione dei dati"
                        content="Conserviamo i tuoi dati personali solo per il tempo necessario a:"
                    />

                    <BulletPoint text="Fornire il servizio richiesto" />
                    <BulletPoint text="Adempiere agli obblighi legali" />
                    <BulletPoint text="Risolvere dispute e far rispettare i contratti" />

                    <Note>
                        Quando elimini il tuo account, i tuoi dati personali vengono rimossi entro 30
                        giorni, salvo obblighi legali di conservazione.
                    </Note>

                    {/* Sezione 9 */}
                    <Section
                        number="9"
                        title="Minori"
                        content="MyMechanic non è destinato a minori di 18 anni. Non raccogliamo
            consapevolmente dati personali da minori. Se vieni a conoscenza che un minore
            ci ha fornito dati personali, ti preghiamo di contattarci immediatamente."
                    />

                    {/* Sezione 10 */}
                    <Section
                        number="10"
                        title="Modifiche alla Privacy Policy"
                        content="Ci riserviamo il diritto di aggiornare questa policy in qualsiasi momento.
            Le modifiche sostanziali saranno comunicate via email o attraverso
            l'applicazione. Ti consigliamo di rivedere periodicamente questa pagina."
                    />

                    {/* Sezione 11 */}
                    <Section
                        number="11"
                        title="Contatti"
                        content="Per domande, dubbi o richieste riguardanti questa Privacy Policy o il
            trattamento dei tuoi dati personali, puoi contattarci:"
                    />

                    <ContactInfo
                        icon={Mail}
                        label="Email"
                        value="privacy@mymechanic.app"
                    />

                    <ContactInfo
                        icon={Shield}
                        label="Data Protection Officer"
                        value="dpo@mymechanic.app"
                    />

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Conforme al GDPR (Regolamento Generale sulla Protezione dei Dati) e alle
                            normative italiane sulla privacy.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Componente Section
const Section = ({ number, title, content }: any) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>{number}</Text>
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Text style={styles.sectionContent}>{content}</Text>
    </View>
);

// Componente BulletPoint
const BulletPoint = ({ text }: any) => (
    <View style={styles.bulletPoint}>
        <View style={styles.bullet} />
        <Text style={styles.bulletText}>{text}</Text>
    </View>
);

// Componente Note
const Note = ({ children }: any) => (
    <View style={styles.note}>
        <Text style={styles.noteText}>{children}</Text>
    </View>
);

// Componente ContactInfo
const ContactInfo = ({ icon: Icon, label, value }: any) => (
    <View style={styles.contactInfo}>
        <View style={styles.contactIcon}>
            <Icon size={20} color="#007AFF" />
        </View>
        <View style={styles.contactContent}>
            <Text style={styles.contactLabel}>{label}</Text>
            <Text style={styles.contactValue}>{value}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        padding: 8,
        width: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    placeholder: {
        width: 40,
    },

    // ScrollView
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    scrollContentDesktop: {
        maxWidth: 900,
        width: '100%',
        alignSelf: 'center',
    },

    // Hero
    hero: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#0F172A',
        marginTop: 16,
        marginBottom: 12,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
    },
    lastUpdated: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 16,
        fontStyle: 'italic',
    },

    // Icons Grid
    iconsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
        backgroundColor: '#FFF',
        marginTop: 12,
        marginHorizontal: 16,
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            },
        }),
    },
    iconSection: {
        flex: 1,
        minWidth: 140,
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0F172A',
        textAlign: 'center',
    },

    // Content
    content: {
        padding: 20,
    },

    // Section
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionNumberText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    sectionTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
    },
    sectionContent: {
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
        marginTop: 8,
        marginLeft: 44,
    },

    // Bullet Point
    bulletPoint: {
        flexDirection: 'row',
        marginLeft: 44,
        marginBottom: 8,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#007AFF',
        marginTop: 9,
        marginRight: 12,
    },
    bulletText: {
        flex: 1,
        fontSize: 15,
        color: '#475569',
        lineHeight: 24,
    },

    // Note
    note: {
        backgroundColor: '#FEF3C7',
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
        borderRadius: 8,
        padding: 16,
        marginLeft: 44,
        marginTop: 12,
        marginBottom: 16,
    },
    noteText: {
        fontSize: 14,
        color: '#92400E',
        lineHeight: 22,
    },

    // Contact Info
    contactInfo: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginLeft: 44,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contactContent: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#007AFF',
    },

    // Footer
    footer: {
        marginTop: 32,
        paddingTop: 32,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    footerText: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        fontStyle: 'italic',
    },
});

export default PrivacyScreen;