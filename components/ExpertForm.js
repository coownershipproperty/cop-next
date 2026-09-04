import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { trackConversion } from '@/lib/gtag';
import { track } from '@vercel/analytics';
import { localeFromPath } from '@/lib/i18n';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
import { getFirstTouch } from '@/lib/attribution';

// ── Locale-specific copy ────────────────────────────────────────────────────
const COPY = {
  en: {
    eyebrow: 'Get in Touch',
    heading_pre: 'Speak to an',
    heading_em: 'expert',
    sub: "Tell us what you're looking for and one of our co-ownership specialists will be in touch within 24 hours.",
    name_label: 'Name',
    name_placeholder: 'Your full name',
    email_label: 'Email',
    email_placeholder: 'your@email.com',
    phone_label: 'Phone',
    phone_placeholder: '+44 or +1…',
    budget_label: 'Approximate Budget',
    budget_select: 'Select range',
    destinations_label: 'Destinations Interested In',
    destinations_placeholder: 'Select destinations…',
    message_label: 'Message',
    message_placeholder: 'Tell us about the destination, property type, or anything else…',
    btn_idle: 'Send Enquiry',
    btn_sending: 'Sending…',
    btn_success: 'Sent!',
    msg_validation: 'Please fill in your name and email.',
    msg_success: "Thank you! We'll be in touch within 24 hours.",
    msg_error: 'Something went wrong. Please try again.',
    msg_network: 'Network error. Please try again.',
    required: '*',
  },
  es: {
    eyebrow: 'Contáctanos',
    heading_pre: 'Habla con un',
    heading_em: 'experto',
    sub: 'Cuéntanos qué buscas y uno de nuestros especialistas en copropiedad se pondrá en contacto contigo en menos de 24 horas.',
    name_label: 'Nombre',
    name_placeholder: 'Tu nombre completo',
    email_label: 'Correo electrónico',
    email_placeholder: 'tu@email.com',
    phone_label: 'Teléfono',
    phone_placeholder: '+34 o +1…',
    budget_label: 'Presupuesto aproximado',
    budget_select: 'Seleccionar rango',
    destinations_label: 'Destinos de interés',
    destinations_placeholder: 'Seleccionar destinos…',
    message_label: 'Mensaje',
    message_placeholder: 'Cuéntanos sobre el destino, tipo de propiedad o cualquier otra cosa…',
    btn_idle: 'Enviar consulta',
    btn_sending: 'Enviando…',
    btn_success: '¡Enviado!',
    msg_validation: 'Por favor, completa tu nombre y correo electrónico.',
    msg_success: '¡Gracias! Nos pondremos en contacto contigo en menos de 24 horas.',
    msg_error: 'Algo salió mal. Inténtalo de nuevo.',
    msg_network: 'Error de red. Inténtalo de nuevo.',
    required: '*',
  },
  fr: {
    eyebrow: 'Nous contacter',
    heading_pre: 'Parlez à un',
    heading_em: 'expert',
    sub: 'Dites-nous ce que vous recherchez et un de nos spécialistes en copropriété vous contactera sous 24 heures.',
    name_label: 'Nom',
    name_placeholder: 'Votre nom complet',
    email_label: 'Email',
    email_placeholder: 'vous@email.com',
    phone_label: 'Téléphone',
    phone_placeholder: '+33 ou +1…',
    budget_label: 'Budget approximatif',
    budget_select: 'Sélectionner une fourchette',
    destinations_label: "Destinations d'intérêt",
    destinations_placeholder: 'Sélectionner des destinations…',
    message_label: 'Message',
    message_placeholder: 'Parlez-nous de votre destination favorite, du type de bien ou de toute autre info…',
    btn_idle: 'Envoyer la demande',
    btn_sending: 'Envoi en cours…',
    btn_success: 'Envoyé !',
    msg_validation: 'Veuillez renseigner votre nom et email.',
    msg_success: 'Merci ! Nous vous contacterons sous 24 heures.',
    msg_error: "Une erreur s'est produite. Veuillez réessayer.",
    msg_network: 'Erreur réseau. Veuillez réessayer.',
    required: '*',
  },
  de: {
    eyebrow: 'Kontakt aufnehmen',
    heading_pre: 'Sprechen Sie mit',
    heading_em: 'einem Experten',
    sub: 'Sagen Sie uns, wonach Sie suchen, und einer unserer Miteigentums-Spezialisten meldet sich innerhalb von 24 Stunden bei Ihnen.',
    name_label: 'Name',
    name_placeholder: 'Ihr vollständiger Name',
    email_label: 'E-Mail',
    email_placeholder: 'ihre@email.com',
    phone_label: 'Telefon',
    phone_placeholder: '+49 oder +1…',
    budget_label: 'Ungefähres Budget',
    budget_select: 'Bereich auswählen',
    destinations_label: 'Interessante Reiseziele',
    destinations_placeholder: 'Reiseziele auswählen…',
    message_label: 'Nachricht',
    message_placeholder: 'Erzählen Sie uns vom Reiseziel, Immobilientyp oder allem, was Ihnen wichtig ist…',
    btn_idle: 'Anfrage senden',
    btn_sending: 'Wird gesendet…',
    btn_success: 'Gesendet!',
    msg_validation: 'Bitte geben Sie Ihren Namen und Ihre E-Mail-Adresse ein.',
    msg_success: 'Vielen Dank! Wir melden uns innerhalb von 24 Stunden bei Ihnen.',
    msg_error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    msg_network: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
    required: '*',
  },
  it: {
    eyebrow: 'Contattaci',
    heading_pre: 'Parla con un',
    heading_em: 'esperto',
    sub: 'Dicci che cosa cerchi e uno dei nostri specialisti di comproprietà ti risponderà entro 24 ore.',
    name_label: 'Nome',
    name_placeholder: 'Il tuo nome completo',
    email_label: 'Email',
    email_placeholder: 'tua@email.com',
    phone_label: 'Telefono',
    phone_placeholder: '+39 o +1…',
    budget_label: 'Budget approssimativo',
    budget_select: 'Seleziona la fascia',
    destinations_label: 'Destinazioni di interesse',
    destinations_placeholder: 'Seleziona le destinazioni…',
    message_label: 'Messaggio',
    message_placeholder: 'Raccontaci la destinazione, il tipo di casa o qualsiasi altra cosa ti stia a cuore…',
    btn_idle: 'Invia la richiesta',
    btn_sending: 'Invio in corso…',
    btn_success: 'Inviata!',
    msg_validation: 'Inserisci il tuo nome e la tua email.',
    msg_success: 'Grazie! Ti ricontattiamo entro 24 ore.',
    msg_error: 'Si è verificato un errore. Riprova.',
    msg_network: 'Errore di rete. Riprova.',
    required: '*',
  },
  nl: {
    eyebrow: 'Neem contact op',
    heading_pre: 'Spreek met een',
    heading_em: 'expert',
    sub: 'Vertel ons waarnaar u op zoek bent en een van onze specialisten in mede-eigendom neemt binnen 24 uur contact met u op.',
    name_label: 'Naam',
    name_placeholder: 'Uw volledige naam',
    email_label: 'E-mail',
    email_placeholder: 'uw@email.com',
    phone_label: 'Telefoon',
    phone_placeholder: '+31 of +1…',
    budget_label: 'Indicatief budget',
    budget_select: 'Kies een bereik',
    destinations_label: 'Interessante bestemmingen',
    destinations_placeholder: 'Bestemmingen kiezen…',
    message_label: 'Bericht',
    message_placeholder: 'Vertel ons over de bestemming, het type woning of wat u verder belangrijk vindt…',
    btn_idle: 'Aanvraag versturen',
    btn_sending: 'Verzenden…',
    btn_success: 'Verzonden!',
    msg_validation: 'Vul uw naam en e-mailadres in.',
    msg_success: 'Hartelijk dank! Wij nemen binnen 24 uur contact met u op.',
    msg_error: 'Er is iets misgegaan. Probeer het opnieuw.',
    msg_network: 'Netwerkfout. Probeer het opnieuw.',
    required: '*',
  },
  pt: {
    eyebrow: 'Fale conosco',
    heading_pre: 'Fale com um',
    heading_em: 'especialista',
    sub: 'Conte o que você procura e um dos nossos especialistas em multipropriedade entra em contato em até 24 horas.',
    name_label: 'Nome',
    name_placeholder: 'Seu nome completo',
    email_label: 'E-mail',
    email_placeholder: 'seu@email.com',
    phone_label: 'Telefone',
    phone_placeholder: '+55 ou +1…',
    budget_label: 'Orçamento aproximado',
    budget_select: 'Selecione a faixa',
    destinations_label: 'Destinos de interesse',
    destinations_placeholder: 'Selecione os destinos…',
    message_label: 'Mensagem',
    message_placeholder: 'Conte sobre o destino, o tipo de imóvel ou o que mais importar para você…',
    btn_idle: 'Enviar solicitação',
    btn_sending: 'Enviando…',
    btn_success: 'Enviado!',
    msg_validation: 'Informe seu nome e seu e-mail.',
    msg_success: 'Obrigado! Entraremos em contato em até 24 horas.',
    msg_error: 'Algo deu errado. Tente novamente.',
    msg_network: 'Erro de conexão. Tente novamente.',
    required: '*',
  },
  sv: {
    eyebrow: 'Kontakta oss',
    heading_pre: 'Tala med en',
    heading_em: 'expert',
    sub: 'Berätta vad du söker, så hör en av våra specialister på samägande av sig inom 24 timmar.',
    name_label: 'Namn',
    name_placeholder: 'Ditt fullständiga namn',
    email_label: 'E-post',
    email_placeholder: 'din@epost.se',
    phone_label: 'Telefon',
    phone_placeholder: '+46 eller +1…',
    budget_label: 'Ungefärlig budget',
    budget_select: 'Välj intervall',
    destinations_label: 'Destinationer du är intresserad av',
    destinations_placeholder: 'Välj destinationer…',
    message_label: 'Meddelande',
    message_placeholder: 'Berätta om destinationen, bostadstypen eller vad som helst annat…',
    btn_idle: 'Skicka förfrågan',
    btn_sending: 'Skickar…',
    btn_success: 'Skickat!',
    msg_validation: 'Fyll i ditt namn och din e-postadress.',
    msg_success: 'Tack! Vi hör av oss inom 24 timmar.',
    msg_error: 'Något gick fel. Försök igen.',
    msg_network: 'Nätverksfel. Försök igen.',
    required: '*',
  },
  da: {
    eyebrow: 'Kontakt os',
    heading_pre: 'Tal med en',
    heading_em: 'ekspert',
    sub: 'Fortæl os, hvad du leder efter, så kontakter en af vores specialister i medejerskab dig inden for 24 timer.',
    name_label: 'Navn',
    name_placeholder: 'Dit fulde navn',
    email_label: 'E-mail',
    email_placeholder: 'din@email.com',
    phone_label: 'Telefon',
    phone_placeholder: '+45 eller +1…',
    budget_label: 'Omtrentligt budget',
    budget_select: 'Vælg interval',
    destinations_label: 'Destinationer, du er interesseret i',
    destinations_placeholder: 'Vælg destinationer…',
    message_label: 'Besked',
    message_placeholder: 'Fortæl os om destinationen, boligtypen eller andet, der er vigtigt for dig…',
    btn_idle: 'Send forespørgsel',
    btn_sending: 'Sender…',
    btn_success: 'Sendt!',
    msg_validation: 'Udfyld venligst dit navn og din e-mailadresse.',
    msg_success: 'Mange tak! Vi kontakter dig inden for 24 timer.',
    msg_error: 'Der opstod en fejl. Prøv venligst igen.',
    msg_network: 'Netværksfejl. Prøv venligst igen.',
    required: '*',
  },
  no: {
    eyebrow: 'Ta kontakt',
    heading_pre: 'Snakk med en',
    heading_em: 'ekspert',
    sub: 'Fortell oss hva du er ute etter, så tar en av våre spesialister på sameie kontakt innen 24 timer.',
    name_label: 'Navn',
    name_placeholder: 'Ditt fulle navn',
    email_label: 'E-post',
    email_placeholder: 'din@epost.no',
    phone_label: 'Telefon',
    phone_placeholder: '+47 eller +1…',
    budget_label: 'Omtrentlig budsjett',
    budget_select: 'Velg prisklasse',
    destinations_label: 'Aktuelle destinasjoner',
    destinations_placeholder: 'Velg destinasjoner…',
    message_label: 'Melding',
    message_placeholder: 'Fortell oss om destinasjon, boligtype eller andre ønsker…',
    btn_idle: 'Send henvendelse',
    btn_sending: 'Sender…',
    btn_success: 'Sendt!',
    msg_validation: 'Fyll inn navn og e-postadresse.',
    msg_success: 'Tusen takk! Vi tar kontakt innen 24 timer.',
    msg_error: 'Noe gikk galt. Prøv igjen.',
    msg_network: 'Nettverksfeil. Prøv igjen.',
    required: '*',
  },
};

// ── Locale-specific destination tree ─────────────────────────────────────────
// The country headers and child labels are translated. The values stored when
// the user selects an option remain the same English internal keys so the API
// receives consistent data regardless of the visitor's locale.
const DEST_TREES = {
  en: [
    { country: 'Spain',          children: ['Mallorca', 'Ibiza', 'Menorca', 'Balearic Islands', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Spanish Costas', 'Barcelona', 'Madrid', 'Canary Islands', 'Pyrenees'] },
    { country: 'France',         children: ['South of France', 'French Alps', 'Paris'] },
    { country: 'Italy',          children: ['Italian Lakes', 'Lake Como', 'Lake Garda', 'Liguria', 'Sardinia'] },
    { country: 'USA — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'USA — Florida',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'USA — California', children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'] },
    { country: 'USA — Utah',     children: ['Park City'] },
    { country: 'United Kingdom', children: ['London', 'England'] },
    { country: 'Other',          children: ['Austria', 'Croatia', 'Germany', 'Mexico', 'Portugal', 'Sweden'] },
  ],
  es: [
    { country: 'España',         children: ['Mallorca', 'Ibiza', 'Menorca', 'Islas Baleares', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Costas españolas', 'Barcelona', 'Madrid', 'Islas Canarias', 'Pirineos'] },
    { country: 'Francia',        children: ['Sur de Francia', 'Alpes franceses', 'París'] },
    { country: 'Italia',         children: ['Lagos italianos', 'Lago de Como', 'Lago de Garda', 'Liguria', 'Cerdeña'] },
    { country: 'EE. UU. — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'EE. UU. — Florida',  children: ['Miami', 'Brickell', 'Cayos de Florida', '30A Costa Esmeralda'] },
    { country: 'EE. UU. — California', children: ['Malibú y Santa Bárbara', 'Newport Beach', 'Napa y Sonoma', 'Lago Tahoe', 'Palm Springs'] },
    { country: 'EE. UU. — Utah', children: ['Park City'] },
    { country: 'Reino Unido',    children: ['Londres', 'Inglaterra'] },
    { country: 'Otros',          children: ['Austria', 'Croacia', 'Alemania', 'México', 'Portugal', 'Suecia'] },
  ],
  fr: [
    { country: 'Espagne',        children: ['Majorque', 'Ibiza', 'Minorque', 'Îles Baléares', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Côtes espagnoles', 'Barcelone', 'Madrid', 'Îles Canaries', 'Pyrénées'] },
    { country: 'France',         children: ['Sud de la France', 'Alpes françaises', 'Paris'] },
    { country: 'Italie',         children: ['Lacs italiens', 'Lac de Côme', 'Lac de Garde', 'Ligurie', 'Sardaigne'] },
    { country: 'États-Unis — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'États-Unis — Floride',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'États-Unis — Californie', children: ['Malibu et Santa Barbara', 'Newport Beach', 'Napa et Sonoma', 'Lac Tahoe', 'Palm Springs'] },
    { country: 'États-Unis — Utah',  children: ['Park City'] },
    { country: 'Royaume-Uni',    children: ['Londres', 'Angleterre'] },
    { country: 'Autre',          children: ['Autriche', 'Croatie', 'Allemagne', 'Mexique', 'Portugal', 'Suède'] },
  ],
  de: [
    { country: 'Spanien',        children: ['Mallorca', 'Ibiza', 'Menorca', 'Balearen', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Spanische Costas', 'Barcelona', 'Madrid', 'Kanarische Inseln', 'Pyrenäen'] },
    { country: 'Frankreich',     children: ['Südfrankreich', 'Französische Alpen', 'Paris'] },
    { country: 'Italien',        children: ['Italienische Seen', 'Comer See', 'Gardasee', 'Ligurien', 'Sardinien'] },
    { country: 'USA — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'USA — Florida',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'USA — Kalifornien', children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'] },
    { country: 'USA — Utah',     children: ['Park City'] },
    { country: 'Vereinigtes Königreich', children: ['London', 'England'] },
    { country: 'Sonstige',       children: ['Österreich', 'Kroatien', 'Deutschland', 'Mexiko', 'Portugal', 'Schweden'] },
  ],
  it: [
    { country: 'Spagna',         children: ['Mallorca', 'Ibiza', 'Menorca', 'Isole Baleari', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Costas spagnole', 'Barcellona', 'Madrid', 'Isole Canarie', 'Pirenei'] },
    { country: 'Francia',        children: ['Sud della Francia', 'Alpi francesi', 'Paris'] },
    { country: 'Italia',         children: ['Laghi italiani', 'Lago di Como', 'Lago di Garda', 'Liguria', 'Sardegna'] },
    { country: 'USA — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'USA — Florida',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'USA — California', children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'] },
    { country: 'USA — Utah',     children: ['Park City'] },
    { country: 'Regno Unito',    children: ['London', 'Inghilterra'] },
    { country: 'Altro',          children: ['Austria', 'Croazia', 'Germania', 'Messico', 'Portogallo', 'Svezia'] },
  ],
  nl: [
    { country: 'Spanje',         children: ['Mallorca', 'Ibiza', 'Menorca', 'Balearen', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Spaanse costa\'s', 'Barcelona', 'Madrid', 'Canarische Eilanden', 'Pyreneeën'] },
    { country: 'Frankrijk',      children: ['Zuid-Frankrijk', 'Franse Alpen', 'Paris'] },
    { country: 'Italië',         children: ['Italiaanse Meren', 'Comomeer', 'Gardameer', 'Ligurië', 'Sardinië'] },
    { country: 'VS — Colorado',  children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'VS — Florida',   children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'VS — Californië', children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'] },
    { country: 'VS — Utah',      children: ['Park City'] },
    { country: 'Verenigd Koninkrijk', children: ['London', 'Engeland'] },
    { country: 'Overig',         children: ['Oostenrijk', 'Kroatië', 'Duitsland', 'Mexico', 'Portugal', 'Zweden'] },
  ],
  pt: [
    { country: 'Espanha',        children: ['Mallorca', 'Ibiza', 'Menorca', 'Ilhas Baleares', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Costas espanholas', 'Barcelona', 'Madri', 'Ilhas Canárias', 'Pirineus'] },
    { country: 'França',         children: ['Sul da França', 'Alpes Franceses', 'Paris'] },
    { country: 'Itália',         children: ['Lagos Italianos', 'Lago de Como', 'Lago de Garda', 'Ligúria', 'Sardenha'] },
    { country: 'EUA — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'EUA — Flórida',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'EUA — Califórnia', children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'] },
    { country: 'EUA — Utah',     children: ['Park City'] },
    { country: 'Reino Unido',    children: ['Londres', 'Inglaterra'] },
    { country: 'Outros',         children: ['Áustria', 'Croácia', 'Alemanha', 'México', 'Portugal', 'Suécia'] },
  ],
  sv: [
    { country: 'Spanien',        children: ['Mallorca', 'Ibiza', 'Menorca', 'Balearerna', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Spanska kusterna', 'Barcelona', 'Madrid', 'Kanarieöarna', 'Pyrenéerna'] },
    { country: 'Frankrike',      children: ['Sydfrankrike', 'Franska alperna', 'Paris'] },
    { country: 'Italien',        children: ['Italienska sjöarna', 'Comosjön', 'Gardasjön', 'Ligurien', 'Sardinien'] },
    { country: 'USA — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'USA — Florida',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'USA — Kalifornien', children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'] },
    { country: 'USA — Utah',     children: ['Park City'] },
    { country: 'Storbritannien', children: ['London', 'England'] },
    { country: 'Övrigt',         children: ['Österrike', 'Kroatien', 'Tyskland', 'Mexiko', 'Portugal', 'Sverige'] },
  ],
  da: [
    { country: 'Spanien',        children: ['Mallorca', 'Ibiza', 'Menorca', 'Balearerne', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Spanske costas', 'Barcelona', 'Madrid', 'De Kanariske Øer', 'Pyrenæerne'] },
    { country: 'Frankrig',       children: ['Sydfrankrig', 'De Franske Alper', 'Paris'] },
    { country: 'Italien',        children: ['De italienske søer', 'Comosøen', 'Gardasøen', 'Ligurien', 'Sardinien'] },
    { country: 'USA — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'USA — Florida',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'USA — Californien', children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'] },
    { country: 'USA — Utah',     children: ['Park City'] },
    { country: 'Storbritannien', children: ['London', 'England'] },
    { country: 'Andre',          children: ['Østrig', 'Kroatien', 'Tyskland', 'Mexico', 'Portugal', 'Sverige'] },
  ],
  no: [
    { country: 'Spania',         children: ['Mallorca', 'Ibiza', 'Menorca', 'Balearene', 'Costa del Sol', 'Costa Blanca', 'Costa de la Luz', 'Spanske costas', 'Barcelona', 'Madrid', 'Kanariøyene', 'Pyreneene'] },
    { country: 'Frankrike',      children: ['Sør-Frankrike', 'Franske Alper', 'Paris'] },
    { country: 'Italia',         children: ['Italienske innsjøer', 'Comosjøen', 'Gardasjøen', 'Liguria', 'Sardinia'] },
    { country: 'USA — Colorado', children: ['Aspen', 'Breckenridge', 'Vail'] },
    { country: 'USA — Florida',  children: ['Miami', 'Brickell', 'Florida Keys', '30A Emerald Coast'] },
    { country: 'USA — California', children: ['Malibu & Santa Barbara', 'Newport Beach', 'Napa & Sonoma', 'Lake Tahoe', 'Palm Springs'] },
    { country: 'USA — Utah',     children: ['Park City'] },
    { country: 'Storbritannia',  children: ['London', 'England'] },
    { country: 'Annet',          children: ['Østerrike', 'Kroatia', 'Tyskland', 'Mexico', 'Portugal', 'Sverige'] },
  ],
};

// ── Locale-specific budget options ───────────────────────────────────────────
// Values remain English keys; only the displayed labels change.
const BUDGET_OPTIONS = {
  en: [
    { value: 'under-100k', label: 'Under €100,000' },
    { value: '100-200k',   label: '€100,000 – €200,000' },
    { value: '200-350k',   label: '€200,000 – €350,000' },
    { value: '350-500k',   label: '€350,000 – €500,000' },
    { value: '500-750k',   label: '€500,000 – €750,000' },
    { value: '750k-1m',    label: '€750,000 – €1,000,000' },
    { value: '1m-plus',    label: '€1,000,000+' },
  ],
  es: [
    { value: 'under-100k', label: 'Menos de €100.000' },
    { value: '100-200k',   label: '€100.000 – €200.000' },
    { value: '200-350k',   label: '€200.000 – €350.000' },
    { value: '350-500k',   label: '€350.000 – €500.000' },
    { value: '500-750k',   label: '€500.000 – €750.000' },
    { value: '750k-1m',    label: '€750.000 – €1.000.000' },
    { value: '1m-plus',    label: '€1.000.000+' },
  ],
  fr: [
    { value: 'under-100k', label: 'Moins de 100 000 €' },
    { value: '100-200k',   label: '100 000 € – 200 000 €' },
    { value: '200-350k',   label: '200 000 € – 350 000 €' },
    { value: '350-500k',   label: '350 000 € – 500 000 €' },
    { value: '500-750k',   label: '500 000 € – 750 000 €' },
    { value: '750k-1m',    label: '750 000 € – 1 000 000 €' },
    { value: '1m-plus',    label: '1 000 000 €+' },
  ],
  de: [
    { value: 'under-100k', label: 'Unter 100.000 €' },
    { value: '100-200k',   label: '100.000 € – 200.000 €' },
    { value: '200-350k',   label: '200.000 € – 350.000 €' },
    { value: '350-500k',   label: '350.000 € – 500.000 €' },
    { value: '500-750k',   label: '500.000 € – 750.000 €' },
    { value: '750k-1m',    label: '750.000 € – 1.000.000 €' },
    { value: '1m-plus',    label: '1.000.000 €+' },
  ],
  it: [
    { value: 'under-100k', label: 'Meno di € 100.000' },
    { value: '100-200k',   label: '€ 100.000 – € 200.000' },
    { value: '200-350k',   label: '€ 200.000 – € 350.000' },
    { value: '350-500k',   label: '€ 350.000 – € 500.000' },
    { value: '500-750k',   label: '€ 500.000 – € 750.000' },
    { value: '750k-1m',    label: '€ 750.000 – € 1.000.000' },
    { value: '1m-plus',    label: '€ 1.000.000+' },
  ],
  nl: [
    { value: 'under-100k', label: 'Onder € 100.000' },
    { value: '100-200k',   label: '€ 100.000 – € 200.000' },
    { value: '200-350k',   label: '€ 200.000 – € 350.000' },
    { value: '350-500k',   label: '€ 350.000 – € 500.000' },
    { value: '500-750k',   label: '€ 500.000 – € 750.000' },
    { value: '750k-1m',    label: '€ 750.000 – € 1.000.000' },
    { value: '1m-plus',    label: '€ 1.000.000+' },
  ],
  pt: [
    { value: 'under-100k', label: 'Menos de € 100.000' },
    { value: '100-200k',   label: '€ 100.000 – € 200.000' },
    { value: '200-350k',   label: '€ 200.000 – € 350.000' },
    { value: '350-500k',   label: '€ 350.000 – € 500.000' },
    { value: '500-750k',   label: '€ 500.000 – € 750.000' },
    { value: '750k-1m',    label: '€ 750.000 – € 1.000.000' },
    { value: '1m-plus',    label: '€ 1.000.000+' },
  ],
  sv: [
    { value: 'under-100k', label: 'Under 100 000 €' },
    { value: '100-200k',   label: '100 000 € – 200 000 €' },
    { value: '200-350k',   label: '200 000 € – 350 000 €' },
    { value: '350-500k',   label: '350 000 € – 500 000 €' },
    { value: '500-750k',   label: '500 000 € – 750 000 €' },
    { value: '750k-1m',    label: '750 000 € – 1 000 000 €' },
    { value: '1m-plus',    label: '1 000 000 €+' },
  ],
  da: [
    { value: 'under-100k', label: 'Under 100 000 €' },
    { value: '100-200k',   label: '100 000 € – 200 000 €' },
    { value: '200-350k',   label: '200 000 € – 350 000 €' },
    { value: '350-500k',   label: '350 000 € – 500 000 €' },
    { value: '500-750k',   label: '500 000 € – 750 000 €' },
    { value: '750k-1m',    label: '750 000 € – 1 000 000 €' },
    { value: '1m-plus',    label: '1 000 000 €+' },
  ],
  no: [
    { value: 'under-100k', label: 'Under 100 000 €' },
    { value: '100-200k',   label: '100 000 € – 200 000 €' },
    { value: '200-350k',   label: '200 000 € – 350 000 €' },
    { value: '350-500k',   label: '350 000 € – 500 000 €' },
    { value: '500-750k',   label: '500 000 € – 750 000 €' },
    { value: '750k-1m',    label: '750 000 € – 1 000 000 €' },
    { value: '1m-plus',    label: '1 000 000 €+' },
  ],
};

function DestinationPicker({ selected, onChange, locale, t }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const wrapRef = useRef(null);

  const tree = DEST_TREES[locale] || DEST_TREES.en;

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function toggleExpand(country) {
    setExpanded(prev => ({ ...prev, [country]: !prev[country] }));
  }

  function toggleOption(val) {
    onChange(
      selected.includes(val)
        ? selected.filter(v => v !== val)
        : [...selected, val]
    );
  }

  function removeTag(val, e) {
    e.stopPropagation();
    onChange(selected.filter(v => v !== val));
  }

  return (
    <div className={`dest-multiselect${open ? ' open' : ''}`} ref={wrapRef}>
      <div
        className="dest-trigger"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o); }}
      >
        {selected.length === 0 && (
          <span className="dest-placeholder">{t.destinations_placeholder}</span>
        )}
        {selected.map(val => (
          <span key={val} className="dest-tag">
            {val}
            <span className="dest-tag-x" onMouseDown={e => removeTag(val, e)}>×</span>
          </span>
        ))}
      </div>

      <div className="dest-dropdown" role="listbox" aria-multiselectable="true">
        {tree.map(({ country, children }) => (
          <div key={country} className="dest-group">
            <div
              className={`dest-group-header${expanded[country] ? ' expanded' : ''}`}
              onClick={() => toggleExpand(country)}
            >
              <span className="dest-group-arrow">›</span>
              {country}
            </div>

            {expanded[country] && (
              <div className="dest-group-children">
                {children.map(child => {
                  const isSelected = selected.includes(child);
                  return (
                    <div
                      key={child}
                      className={`dest-option${isSelected ? ' selected' : ''}`}
                      onClick={() => toggleOption(child)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="dest-check" />
                      {child}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExpertForm({ property, hideIntro = false }) {
  const router = useRouter();
  const locale = localeFromPath(router.asPath || router.pathname);
  const t = COPY[locale] || COPY.en;
  const budgetOptions = BUDGET_OPTIONS[locale] || BUDGET_OPTIONS.en;

  const saved = getSavedUser();
  const [name, setName] = useState(saved.name);
  const [email, setEmail] = useState(saved.email);
  const [destinations, setDestinations] = useState([]);
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');
  const formRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const form = formRef.current;
    const phone    = form.querySelector('[name="phone"]').value.trim();
    const budget   = form.querySelector('[name="budget"]').value;
    const message  = form.querySelector('[name="message"]').value.trim();
    const honeypot = form.elements[HONEYPOT_FIELD]?.value || '';
    const destStr  = destinations.join('; ');

    if (!name || !email) {
      setMsg(t.msg_validation);
      setStatus('error');
      return;
    }

    setStatus('sending');
    setMsg('');

    try {
      const res = await fetch('/api/enquiry/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, budget, destination: destStr, message, property, attribution: getFirstTouch(), locale, [HONEYPOT_FIELD]: honeypot }),
      });
      const data = await res.json();
      if (data.ok) {
        saveUser({ name, email });
        setStatus('success');
        setMsg(t.msg_success);
        form.reset();
        setDestinations([]);
        trackConversion('generate_lead', 'Lead', {
          event_category: 'enquiry',
          destination: destStr || 'unspecified',
          budget,
          locale,
        });
        track('enquiry_submitted', {
          source: 'expert_form',
          destination: destStr || 'unspecified',
          budget: budget || 'unspecified',
          locale,
        });
      } else {
        setStatus('error');
        setMsg(t.msg_error);
      }
    } catch {
      setStatus('error');
      setMsg(t.msg_network);
    }
  }

  return (
    <section className="expert-section" id="speak-to-expert">
      <div className="expert-inner">
        {!hideIntro && (
          <>
            <p className="expert-eyebrow">{t.eyebrow}</p>
            <h2 className="expert-heading">{t.heading_pre} <em>{t.heading_em}</em></h2>
            <p className="expert-sub">{t.sub}</p>
          </>
        )}

        <form className="expert-form" id="expert-enquiry-form" onSubmit={handleSubmit} noValidate ref={formRef}>
          <HoneypotField />
          <div className="expert-form-grid">

            <div className="expert-form-field">
              <label htmlFor="ef-name">{t.name_label} <span>{t.required}</span></label>
              <input type="text" id="ef-name" name="name" placeholder={t.name_placeholder} required value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="expert-form-field">
              <label htmlFor="ef-email">{t.email_label} <span>{t.required}</span></label>
              <input type="email" id="ef-email" name="email" placeholder={t.email_placeholder} required value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="expert-form-field">
              <label htmlFor="ef-phone">{t.phone_label} {t.required}</label>
              <input type="tel" id="ef-phone" name="phone" placeholder={t.phone_placeholder} required />
            </div>

            <div className="expert-form-field">
              <label htmlFor="ef-budget">{t.budget_label}</label>
              <select id="ef-budget" name="budget">
                <option value="">{t.budget_select}</option>
                {budgetOptions.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>

            <div className="expert-form-field expert-form-field--wide">
              <label>{t.destinations_label}</label>
              <DestinationPicker selected={destinations} onChange={setDestinations} locale={locale} t={t} />
            </div>

            <div className="expert-form-field expert-form-field--wide">
              <label htmlFor="ef-message">{t.message_label}</label>
              <textarea id="ef-message" name="message" rows={4} placeholder={t.message_placeholder}></textarea>
            </div>

          </div>

          <button
            type="submit"
            className="expert-submit-btn"
            disabled={status === 'sending'}
          >
            {status === 'sending' ? t.btn_sending : status === 'success' ? t.btn_success : t.btn_idle}
          </button>

          {msg && (
            <p className={`expert-form-msg${status === 'success' ? ' success' : ' error'}`}>{msg}</p>
          )}
        </form>
      </div>
    </section>
  );
}
