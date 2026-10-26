# Piano portale "smonta-trappole" per PC su Amazon.it

Versione rivista con verifiche, metriche prudenti e metodo per scegliere i PC, regole editoriali, soglie decisionali e integrazioni del documento integrativo. Aggiornato al 23 ottobre 2026.

## 1. Idea in sintesi

Un sito indipendente che analizza le inserzioni di PC fissi e portatili su Amazon.it, soprattutto assemblati e modelli poco noti con molte recensioni ma hardware discutibile. Ogni scheda dà un verdetto immediato, un'analisi dei componenti e 1-2 alternative nella stessa fascia di prezzo. Il traffico arriva da query a coda lunga ("\[modello\] opinioni e difetti", "\[CPU\] trappola o affare"), non da query generiche come "quale pc comprare per giocare", dove un dominio nuovo non può competere con Aranzulla, MediaWorld o Unieuro.

### Nicchia iniziale e posizionamento

Nella prima fase il sito analizza solo gli **assemblati economici venduti come PC gaming**, soprattutto quando l'inserzione è vaga sui componenti. Notebook, workstation e guide generaliste restano per dopo: richiedono aggiornamenti più frequenti e allargano la concorrenza.

La promessa editoriale è aiutare a capire cosa si sta comprando davvero (componenti, limiti, prestazioni attese, alternative concrete) senza fermarsi al titolo dell'inserzione. Il nome «smonta-trappole» attira attenzione, ma i giudizi riguardano specifiche e rapporto qualità/prezzo, mai le intenzioni di venditori o produttori.

**Il verdetto non è sempre negativo.** Gli esiti possibili sono:

- Sconsigliato: configurazione inadeguata all'uso dichiarato o al prezzo.
- Accettabile per uso base: navigazione, documenti e attività leggere, con limiti espliciti.
- Conveniente solo in offerta: il prezzo attuale non è interessante, ma potrebbe esserlo sotto una certa soglia.
- Buon acquisto per un uso specifico: valido per un pubblico ben definito.
- Informazioni insufficienti: dati non verificabili per un giudizio sicuro.

Sono etichette editoriali da applicare in modo coerente, non certificazioni tecniche.

**Livello delle prove.** Ogni scheda dichiara su cosa si basa il giudizio:

1. Specifiche dichiarate: dati dell'inserzione o del produttore.
2. Verifica indipendente: dati incrociati con fonti tecniche e benchmark pubblici.
3. Test diretto: prodotto provato fisicamente, con indicazione di cosa è stato testato e come.

Un'analisi basata solo sulla scheda Amazon non va mai presentata come test fisico.

## 2. Cosa è verificato e cosa no

| Punto | Stato |
| --- | --- |
| PA-API v5 sostituita dalla Creators API | Confermato: PA-API 5 è deprecata e le chiamate restituiscono errore 403 |
| Soglia Creators API | Confermato: stato Associates definitivo e almeno 10 vendite qualificate negli ultimi 30 giorni; l'accesso si sospende se le vendite scendono |
| Regola "3 vendite entro 180 giorni" | Da verificare nel contratto operativo; compare in alcune fonti, non l'ho trovata in forma ufficiale |
| Commissione informatica 3% | Non confermato per PC e portatili; in Italia le fonti indicano un intervallo 3-10% a seconda della categoria. Controlla la tabella nell'area Associates |
| Stabilità delle commissioni | A rischio: report di maggio 2026 sul mercato USA segnalano tagli anche forti senza annuncio. Non è detto che valga per l'Italia |
| "Sandbox" di Google | Ipotesi dei SEO, non un fatto. Pianifica comunque 3-6 mesi lenti |
| "10 articoli prima di aprire il sito" | Non verificato; pubblica comunque 10-15 schede prima di candidarti |

Prima di iniziare leggi tu stesso la tabella commissioni e il contratto operativo del Programma Affiliazione Amazon: sono le due fonti che contano.

**Rischio account da controllare nel contratto.** Una fonte indica che un account nuovo deve registrare vendite qualificate entro un certo periodo (3 vendite in 180 giorni) per mantenere l'accesso ai dati; non l'ho trovato in forma ufficiale. Con un sito che parte lentamente conviene leggere questa condizione prima di candidarsi e candidarsi solo quando le prime schede sono pubblicate.

## 3. Come individuare i PC da verificare

Questa è la parte che decide il successo del progetto. Il sito vive di schede su modelli che molte persone guardano su Amazon e su cui hanno un dubbio. Non basta scegliere a caso: serve un metodo per trovare i candidati, filtrarli e ordinarli per priorità.

### 3.1 Dove cercare i candidati

**a) Le classifiche di Amazon.it**

- Categoria Informatica > Computer > Desktop e Portatili: guarda i "Bestseller", le "Novità più apprezzate" e i "Più regalati".
- Cerca i PC con prezzo basso e molte recensioni, ma con specifiche vaghe nel titolo ("PC Gaming", "i7", "16GB" senza modello CPU preciso).
- Per ogni PC aggiungi alla lista: titolo esatto, venditore, prezzo, numero di recensioni, voto medio, data di prima disponibilità.
- Ripeti il controllo ogni settimana: le classifiche cambiano in fretta e un modello che sale è un candidato ideale.

**b) La ricerca interna di Amazon**

- Digita nella barra di ricerca "pc gaming", "pc fisso i7", "pc ufficio", "portatile 16gb" e annota i suggerimenti del completamento automatico.
- Ordina i risultati per "Più venduti" e per fascia di prezzo (200-400, 400-600, 600-800 euro).
- Annota i brand ripetuti: gli assemblatori meno noti che compaiono spesso sono un filone di query.

**c) Le domande e le recensioni su Amazon**

- Leggi le recensioni da 1 a 3 stelle degli ultimi mesi: parlano di rumore, temperature, crash, Windows non attivato, componenti diversi da quelli annunciati.
- Leggi le domande dei clienti: "Si può giocare a \[titolo\]?", "Supporta Windows 11?", "Che scheda video ha davvero?". Sono già query potenziali.
- Le recensioni che citano il prodotto dopo settimane o mesi d'uso valgono più di quelle scritte il giorno dell'apertura della scatola.

**d) Google e le community**

- Cerca "\[assemblatore\] recensioni" e "\[modello\] opinioni" e guarda chi si posiziona. Se in prima pagina trovi solo forum, thread vecchi o video senza analisi, la query è libera.
- Il suggerimento automatico di Google e la sezione "Altre domande" mostrano le formulazioni vere che usa la gente.
- Leggi r/ItalyHardware, r/italygames e altre community: gli utenti incollano link Amazon e chiedono "conviene?". Segna i modelli che ricorrono.
- YouTube: controlla se esiste già una recensione seria del modello. Se ci sono solo unboxing, c'è spazio.

**e) Il tuo traffico**

- Quando il sito ha le prime impressioni, Google Search Console mostra le query vere che portano visite o impressioni. Le schede nuove devono partire da lì: sono la fonte più affidabile.

### 3.2 Filtro rapido: i segnali d'allarme nell'inserzione

Un PC diventa candidato se nel titolo, nelle immagini o nella scheda tecnica compare almeno uno di questi segnali:

1. **CPU vecchia**: Intel Core di 4ª-8ª generazione (i7-4770, i5-6500, ecc.) o AMD molto datati venduti come "nuovi" o "gaming".
2. **Nessuna scheda video dedicata** nonostante la dicitura "gaming" (grafica integrata, APU).
3. **Scheda video citata male**: solo il nome della serie senza modello ("GTX", "RTX") o modelli molto vecchi/economici.
4. **RAM in singolo canale** o capacità dichiarata senza frequenza e configurazione.
5. **SSD generico** senza marca né modello, o "256GB" con grande volume di vendite a prezzo troppo basso.
6. **Alimentatore non specificato** o senza certificazione 80 Plus; case con ventilazione scarsa.
7. **Sistema operativo non chiaro**: Windows non attivato, licenza non specificata, "Windows 11" su CPU non supportata.
8. **Venditore terzo** con pochi anni di storico, nome che cambia, o inserzioni quasi identiche con prezzi diversi.
9. **Recensioni anomale**: molte da 5 stelle in poco tempo, testo generico, poche con foto reali.
10. **Prezzo che crolla/varia in modo strano** nello storico (usa uno strumento di tracciamento prezzi come Keepa per controllarlo).

Regola pratica: da 3 segnali in su il PC entra nella lista "da verificare". Con 1-2 segnali serve un controllo più attento prima di decidere.

### 3.3 Filtro di mercato: la query ha valore?

Per ogni candidato verifica quattro cose prima di scrivere:

1. **Esiste una ricerca vera?** Controlla il suggerimento automatico di Google, "Altre domande" e, se hai accesso, il volume stimato in Google Keyword Planner o in Search Console. Non servono volumi grandi: bastano decine di ricerche al mese per un modello specifico.
2. **Chi si posiziona?** Cerca la query tra virgolette e guarda i primi 10 risultati. Cerca forum, siti obsoleti, video poco utili e pagine che citano solo la scheda del produttore. Se ci sono 3 o più recensioni serie e ben fatte, la query è occupata.
3. **Il prodotto durerà?** Un PC che sparisce dal catalogo in poche settimane rende poco. Meglio i modelli con storico lungo e disponibilità stabile. Controlla da quanto tempo è in vendita e se il listing è condiviso da più venditori.
4. **C'è un'alternativa da consigliare?** La scheda funziona solo se puoi proporre un PC migliore nella stessa fascia di prezzo. Verifica che esista, che sia disponibile e che abbia recensioni ragionevoli.

Aggiungi altri due controlli: la **verificabilità** (CPU, GPU, RAM, storage e alimentatore sono identificabili dall'inserzione o da fonti attendibili) e l'**intento commerciale** (chi cerca la query deve ancora scegliere cosa comprare). Il punteggio di priorità qui sotto non sostituisce il controllo manuale dei risultati di Google e della qualità delle alternative.

### 3.4 Punteggio di priorità

Usa un punteggio da 1 a 5 per ciascun criterio e somma. Puoi tenerlo in un foglio di calcolo.

| Criterio | Cosa misura | Peso |
| --- | --- | --- |
| Domanda | Quanto spesso la gente cerca/discute quel modello | x3 |
| Concorrenza editoriale | 5 = nessuna recensione utile, 1 = prima pagina piena | x3 |
| Gravità dei problemi | Quanti segnali d'allarme e quanto seri | x2 |
| Durata del prodotto | Resta in catalogo e a prezzo stabile | x1 |
| Qualità dell'alternativa | Esiste un PC migliore da consigliare | x2 |
| Facilità di analisi | Specifiche chiare, componenti identificabili | x1 |

Punteggio massimo: 60. Interpretazione:

- **45 o più**: priorità alta, scrivi subito.
- **30-44**: priorità media, pianificala.
- **sotto 30**: scarta o rimanda.

Esempio: un assemblato con i7 di 4ª generazione, 15 recensioni su 20 positive ma molte di 4-5 stelle "appena arrivato", nessuna analisi in italiano, alternativa chiara da 450 €: domanda 3, concorrenza 5, gravità 4, durata 3, alternativa 5, facilità 4. Punteggio: 9 + 15 + 8 + 3 + 10 + 4 = 49, quindi priorità alta.

### 3.5 Foglio di lavoro consigliato

Un foglio con queste colonne basta per gestire tutto:

| Colonna | Contenuto |
| --- | --- |
| Titolo inserzione | Testo esatto, con codice ASIN |
| Venditore | Nome e storico |
| Fascia di prezzo | Indicativa, solo come nota interna (non pubblicare cifre) |
| Segnali d'allarme | Elenco dei punti 1-10 trovati |
| Query candidate | 2-3 formulazioni reali |
| Domanda/concorrenza | Note e punteggi |
| Alternative da proporre | ASIN e motivo |
| Priorità | Punteggio totale |
| Stato | Da scrivere / In scrittura / Pubblicata / Da aggiornare |
| Data ultimo controllo | Per la manutenzione |

### 3.6 Routine settimanale (circa 3-4 ore)

1. Controlla le classifiche Amazon di categoria e annota 5-10 nuovi candidati.
2. Leggi le recensioni negative e le domande dei clienti dei candidati migliori.
3. Controlla Reddit e YouTube per capire se la domanda è reale.
4. Fai il controllo di concorrenza su Google per i 3-5 candidati principali.
5. Calcola il punteggio e aggiorna il foglio.
6. Scegli 1-2 modelli da scrivere nella settimana.
7. Una volta al mese rivedi le schede già pubblicate: modello sparito, prezzo/offerta cambiata, alternative superate.

### 3.7 Quanti PC servono e in che ordine

- Fase di lancio: 10-15 schede su modelli molto visibili e problematici.
- Crescita: 35-50 schede, con mix di assemblati, portatili economici e modelli di marca mal descritti.
- Dopo i primi risultati, dai priorità a ciò che porta impressioni e click, e aggiungi schede simili (stesso assemblatore, stessa CPU, stessa fascia).
- Scarta i modelli con un solo venditore instabile: la scheda può diventare inutile in poche settimane.

Prima di impegnarti verifica la **dimensione della nicchia**: conta quanti modelli diversi di assemblati gaming economici compaiono davvero su Amazon.it e se ne bastano 30-50 per arrivare ai volumi che ti servono. Se sono pochi, la nicchia si esaurisce prima di diventare redditizia e dovrai allargarla (per esempio ai notebook economici).

### 3.8 Errori da evitare nella scelta

- Scegliere solo i modelli più venduti: sono i più competitivi e quelli dove Amazon e i grandi siti hanno già contenuto.
- Scegliere prodotti perché sembrano "truffe": serve un'analisi basata su dati, non un'opinione. Se il PC è semplicemente economico ma onesto, la scheda può dire che è adatto a un uso base.
- Ignorare i limiti legali: ogni giudizio riguarda l'hardware e le sue specifiche, mai il venditore come persona.
- Dimenticare la manutenzione: una scheda vecchia e sbagliata danneggia la fiducia nel sito.

## 4. Struttura di ogni scheda

1. **Titolo**: recensione del modello esatto, con "affare o trappola?".
2. **Verdetto in alto**: in poche righe, per chi è adatto e per chi no.
3. **Perché ha tante recensioni positive**: cosa vedono gli acquirenti il primo giorno e cosa emerge dopo.
4. **Analisi componenti**: CPU, GPU, RAM, archiviazione, alimentatore, scheda madre, raffreddamento, compatibilità con Windows 11.
5. **Metodo e limiti**: dichiara se l'analisi è basata su specifiche e benchmark pubblici o su test diretto.
6. **Alternative**: 1-2 PC con motivo concreto, senza prezzi scritti a mano.
7. **Disclosure di affiliazione** in cima alla pagina e data di ultimo aggiornamento.

### Tabella componenti

| Componente | Cosa verificare |
| --- | --- |
| CPU | Modello esatto, generazione, prestazioni attese, compatibilità con Windows 11 |
| GPU | Modello preciso, memoria, prestazioni indicative, presenza effettiva |
| RAM | Capacità, configurazione dei moduli, espandibilità |
| SSD | Capacità, tipo e modello, se disponibili |
| Scheda madre | Modello, chipset, espandibilità |
| Alimentatore | Marca, modello, potenza, certificazioni |
| Raffreddamento e case | Ventilazione, rumorosità documentata, spazio per aggiornamenti |
| Sistema operativo | Edizione, attivazione, compatibilità dichiarata |
| Garanzia | Condizioni pubblicate e soggetto responsabile |

Se una specifica non è pubblicata, scrivila come **non verificata** e spiega il rischio pratico di comprare senza quell'informazione: non dedurre che il componente sia scadente.

### Alternative

Proponi 1-2 alternative solo dopo aver controllato configurazione, disponibilità e adeguatezza allo stesso uso, indicando la data di verifica. Se non esiste un'alternativa davvero migliore, dillo invece di inserirne una debole.

### Metodo, fonti e correzioni

Ogni pagina riporta le fonti di specifiche e benchmark, la distinzione tra dati del venditore e dati verificati, la dichiarazione di assenza di test fisico, la data dell'ultima verifica, la disclosure di affiliazione e un canale per segnalare errori. L'affiliazione non deve influenzare il verdetto.

## 5. Conformità e fisco

- Disclosure visibile: "In qualità di Affiliato Amazon, io ricevo un guadagno dagli acquisti idonei".
- Niente prezzi fissi scritti a mano; usa CTA come "Controlla il prezzo su Amazon" finché non hai accesso alle API.
- Niente link cloaking.
- Linguaggio sull'hardware, mai insulti ai venditori. Ogni critica deve poggiare su dati verificabili.
- In Italia l'affiliazione svolta con abitualità è reddito d'impresa: serve partita IVA, da definire con un commercialista prima dei primi incassi.

## 6. Roadmap

| Periodo | Attività | Segnale da controllare |
| --- | --- | --- |
| Settimane 1-2 | Ricerca di 20-30 candidati, punteggio di priorità, scelta di 10-15; dominio, CMS leggero, template scheda, pagine legali | Lista con punteggi; template pronto |
| Settimane 3-6 | Pubblicare 10-15 schede, pagina sul metodo e pagina di presentazione; candidatura Associates; Search Console; registrare le ore per scheda | Pagine indicizzate; ore per scheda |
| Settimane 7-12 | Correggere i titoli sulle query che emergono, aggiornare le schede, aggiungere 5-10 schede su query che funzionano; primi contributi utili nelle community | Impressioni, click organici, click in uscita |
| Settimana 12 | Prima decisione con le soglie della sezione 9 | Continuare, modificare o sospendere |
| Mesi 4-8 | Arrivare a 25-35 schede; questionario o canale Telegram solo se i dati mostrano interesse | 500-3.000 visite al mese; almeno 1 vendita al mese |
| Mesi 9-12 | 35-50 schede, guide per fascia, allargamento della nicchia se serve | 2.000-5.000 visite al mese; avvicinarsi a 10 vendite al mese per le API |

Sono stime ragionevoli per un dominio nuovo, non previsioni.

### Distribuzione oltre la SEO

Su un dominio nuovo Google è lento, quindi i primi segnali reali arrivano dalle community. Partecipa a r/ItalyHardware, r/italygames e forum simili con analisi tecniche utili, linkando il sito solo dove le regole lo consentono e il link aggiunge informazione. Il canale Telegram con allerte su prezzi e inserzioni ingannevoli e il questionario guidato si valutano dopo le prime 12 settimane, quando sai quali modelli interessano. Le domande ricorrenti nelle community sono anche una fonte di candidati (sezione 3).

## 7. Modello di ricavi

Ipotesi base: scontrino medio 600 euro, commissione 3% (18 euro per vendita), da verificare. Nessun cross-selling nel caso base.

| Scenario | CTR su Amazon | Conversione | Commissione per vendita | Ricavo ogni 1.000 visite |
| --- | --- | --- | --- | --- |
| Prudente | 5% | 2% | 15 € | circa 15 € |
| Realistico | 8% | 3% | 18 € | circa 43 € |
| Ottimista | 12% | 4% | 20 € | circa 96 € |

| Visite/mese | Prudente | Realistico | Ottimista |
| --- | --- | --- | --- |
| 1.000 | 15 € | 43 € | 96 € |
| 3.000 | 45 € | 130 € | 288 € |
| 5.000 | 75 € | 216 € | 480 € |
| 10.000 | 150 € | 432 € | 960 € |
| 20.000 | 300 € | 864 € | 1.920 € |

Cosa ne deriva:

- 200-600 euro al mese richiedono circa 5.000-10.000 visite qualificate nello scenario realistico.
- La soglia di 10 vendite al mese per la Creators API si raggiunge a circa 4.000 visite nello scenario realistico e a circa 10.000 in quello prudente.
- Sostituire uno stipendio (oltre 2.000 euro al mese) non è realistico con i soli preassemblati e queste commissioni.
- Nel primo anno aspettati da pochi euro a 100-200 euro al mese verso la fine, se il lavoro è costante. Metti in conto il tuo tempo e la partita IVA.

### Scenario con commissione al 2%

Se la tabella commissioni reale desse il 2% per PC e portatili, la commissione per vendita scende a 12 euro e i ricavi calano di un terzo rispetto al 3%.

| Visite/mese | Prudente (CTR 5%, conversione 2%) | Realistico (CTR 8%, conversione 3%) |
| --- | --- | --- |
| 1.000 | 12 € | 29 € |
| 3.000 | 36 € | 86 € |
| 5.000 | 60 € | 144 € |
| 10.000 | 120 € | 288 € |

Sono ipotesi illustrative, non previsioni, e non includono costi, imposte o acquisti indiretti.

### Ore per scheda e ricavo orario

Il numero decisivo è il ricavo per ora lavorata. Una scheda fatta bene (identificare i componenti, leggere recensioni e domande, controllare i benchmark, trovare l'alternativa, scrivere) può richiedere diverse ore: ipotizza 4-6 ore all'inizio e misurale sulle prime 2-3 schede. Con 5 ore per scheda, 15 schede sono circa 75 ore. Esempio: 32 ore al mese e 130 euro lordi di ricavi danno circa 4 euro all'ora, prima di costi e imposte. Se il ricavo orario resta così basso nel tempo, il progetto funziona come hobby più che come attività.

## 8. Rischi e mitigazioni

| Rischio | Mitigazione |
| --- | --- |
| Amazon taglia le commissioni o chiude l'account | Non dipendere da un solo programma; valuta altri merchant con affiliazione |
| Schede obsolete | Data di aggiornamento visibile e revisione periodica |
| Ban su Reddit | Contribuisci in modo utile per settimane prima di linkare il sito e leggi le regole |
| Contenuti troppo simili alle specifiche del produttore | Ogni scheda ha verdetto, confronto e analisi propria |
| Cause per diffamazione o concorrenza sleale | Solo fatti verificabili sull'hardware |

**Rischi aggiuntivi.** Schede troppo simili tra loro (stessa struttura, stesse frasi) possono sembrare contenuto prodotto in serie: l'automazione serve per bozze e checklist, ma verdetto, componenti e alternative vanno verificati caso per caso, senza inventare specifiche o benchmark. Un verdetto sempre negativo riduce la credibilità. Un modello che sparisce dal catalogo lascia pagine inutili: registra la data di ultimo controllo di ogni scheda.

## 9. Validazione e criteri di decisione

Scrivi le soglie prima di iniziare, non dopo: a fine periodo la tentazione è leggere tutto in positivo. Quelle sotto sono proposte da adattare, non valori statistici.

| Indicatore | Settimana 12 (10-15 schede) | Mese 6 (25-35 schede) |
| --- | --- | --- |
| Pagine indicizzate | almeno 80% delle schede | almeno 90% |
| Impressioni al mese su query di modello | almeno 300 | almeno 3.000 |
| Click organici al mese | almeno 30 | almeno 300 |
| Click in uscita verso Amazon | almeno 5 | almeno 40 |
| Vendite idonee al mese | non richieste | almeno 1 |
| Ore per scheda | al massimo 6 | al massimo 4 |

**Decisione.**

- Continuare: la maggior parte delle soglie è raggiunta e il processo è sostenibile.
- Modificare: le pagine compaiono per query diverse da quelle previste, o il lavoro per scheda è eccessivo. Rivedi prima indicizzazione, scelta delle query, concorrenza e qualità delle pagine.
- Sospendere: dopo verifiche e correzioni ragionevoli non emerge domanda e il costo in tempo non è giustificato.

Dodici settimane possono essere poche per un dominio nuovo: un risultato nullo indica di controllare le cause prima di concludere che la nicchia non funziona.

### Strumento interattivo (solo dopo i primi segnali)

Un valutatore di configurazioni (CPU, GPU, RAM, storage, prezzo, uso previsto) può distinguere il sito dai semplici articoli affiliati, ma va sviluppato solo se le schede mostrano interesse per il confronto. I principi sono: nessun punteggio apparentemente scientifico senza metodo documentato, spiegare sempre il perché del risultato, mostrare «dati insufficienti» quando i componenti non sono identificabili, separare adeguatezza tecnica e convenienza, e partire dai casi reali emersi nelle schede invece di costruire un database enorme.

Principio guida: costruire fiducia prima di costruire automazioni.
