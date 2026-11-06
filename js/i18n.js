/*
 * Translations (English, German, Dutch, Turkish, Spanish).
 *
 * Keys are the English texts, so untranslated strings fall back to English.
 * t(text, params) fills {name} placeholders; string parameters that are
 * themselves dictionary keys (material names, …) are translated too.
 * Static page text is translated by walking the DOM once and remembering the
 * English originals; dynamic text is produced through t().
 */
(function (root) {
  'use strict';

  const LANGS = {
    en: { name: 'English', locale: 'en-US' },
    de: { name: 'Deutsch', locale: 'de-DE' },
    nl: { name: 'Nederlands', locale: 'nl-NL' },
    tr: { name: 'Türkçe', locale: 'tr-TR' },
    es: { name: 'Español', locale: 'es-ES' },
  };
  const STORE_KEY = 'vacuum.lang';

  // [English, German, Dutch, Turkish, Spanish]
  const ROWS = [
    // ----- Page, toolbar -----
    ["Vacuum Chamber Calculator", "Vakuumkammer-Rechner", "Vacuümkamer-calculator", "Vakum Odası Hesaplayıcı", "Calculadora de cámaras de vacío"],
    ["Gas load · conductance · pump-down · wall check · v1.0", "Gaslast · Leitwert · Auspumpen · Wandprüfung · v1.0", "Gaslast · geleiding · afpompen · wandcontrole · v1.0", "Gaz yükü · iletkenlik · boşaltma · duvar kontrolü · v1.0", "Carga de gas · conductancia · evacuación · comprobación de pared · v1.0"],
    ["Application example", "Anwendungsbeispiel", "Toepassingsvoorbeeld", "Uygulama örneği", "Ejemplo de aplicación"],
    ["Load application example…", "Anwendungsbeispiel laden…", "Toepassingsvoorbeeld laden…", "Uygulama örneği yükle…", "Cargar ejemplo de aplicación…"],
    ["Unit system", "Einheitensystem", "Eenhedenstelsel", "Birim sistemi", "Sistema de unidades"],
    ["Metric", "Metrisch", "Metrisch", "Metrik", "Métrico"],
    ["US", "US", "VS", "ABD", "EE. UU."],
    ["Pressure unit", "Druckeinheit", "Drukeenheid", "Basınç birimi", "Unidad de presión"],
    ["Language", "Sprache", "Taal", "Dil", "Idioma"],
    ["Open the unit converter", "Einheitenumrechner öffnen", "Eenhedenomrekenaar openen", "Birim dönüştürücüyü aç", "Abrir el conversor de unidades"],
    ["Unit converter", "Einheitenumrechner", "Eenhedenomrekenaar", "Birim dönüştürücü", "Conversor de unidades"],
    ["Copy a link containing this design", "Link mit dieser Auslegung kopieren", "Link met dit ontwerp kopiëren", "Bu tasarımı içeren bağlantıyı kopyala", "Copiar un enlace con este diseño"],
    ["Copy link", "Link kopieren", "Link kopiëren", "Bağlantıyı kopyala", "Copiar enlace"],
    ["Download a PDF design report", "PDF-Auslegungsbericht herunterladen", "PDF-ontwerprapport downloaden", "PDF tasarım raporunu indir", "Descargar un informe de diseño en PDF"],
    ["PDF report", "PDF-Bericht", "PDF-rapport", "PDF rapor", "Informe PDF"],
    ["Print this page", "Diese Seite drucken", "Deze pagina afdrukken", "Bu sayfayı yazdır", "Imprimir esta página"],
    ["Print", "Drucken", "Afdrukken", "Yazdır", "Imprimir"],
    ["How to use this calculator", "So verwenden Sie diesen Rechner", "Hoe u deze calculator gebruikt", "Bu hesaplayıcı nasıl kullanılır", "Cómo usar esta calculadora"],
    ["Help", "Hilfe", "Help", "Yardım", "Ayuda"],
    ["About this calculator", "Über diesen Rechner", "Over deze calculator", "Bu hesaplayıcı hakkında", "Acerca de esta calculadora"],
    ["About", "Über", "Over", "Hakkında", "Acerca de"],
    ["Toggle light/dark theme", "Helles/dunkles Design umschalten", "Licht/donker thema wisselen", "Açık/koyu temayı değiştir", "Cambiar tema claro/oscuro"],
    ["Toggle theme", "Design umschalten", "Thema wisselen", "Temayı değiştir", "Cambiar tema"],
    ["Close", "Schließen", "Sluiten", "Kapat", "Cerrar"],
    ["Quantity", "Größe", "Grootheid", "Büyüklük", "Magnitud"],

    // ----- Form: chamber -----
    ["Chamber", "Kammer", "Kamer", "Oda", "Cámara"],
    ["Chamber shape", "Kammerform", "Kamervorm", "Oda şekli", "Forma de la cámara"],
    ["Cylinder", "Zylinder", "Cilinder", "Silindir", "Cilindro"],
    ["Box", "Quader", "Rechthoekig", "Kutu", "Caja"],
    ["Sphere", "Kugel", "Bol", "Küre", "Esfera"],
    ["Inner diameter", "Innendurchmesser", "Binnendiameter", "İç çap", "Diámetro interior"],
    ["Inside diameter of the shell.", "Innendurchmesser des Mantels.", "Binnendiameter van de mantel.", "Gövdenin iç çapı.", "Diámetro interior de la envolvente."],
    ["Length", "Länge", "Lengte", "Uzunluk", "Longitud"],
    ["Width", "Breite", "Breedte", "Genişlik", "Anchura"],
    ["Height", "Höhe", "Hoogte", "Yükseklik", "Altura"],
    ["Wall material", "Wandwerkstoff", "Wandmateriaal", "Duvar malzemesi", "Material de la pared"],
    ["Wall thickness", "Wanddicke", "Wanddikte", "Duvar kalınlığı", "Espesor de pared"],
    ["Thickness of the shell (cylinder, sphere) or of the side walls and bottom (box).", "Dicke des Mantels (Zylinder, Kugel) bzw. der Seitenwände und des Bodens (Quader).", "Dikte van de mantel (cilinder, bol) of van de zijwanden en bodem (rechthoekig).", "Gövdenin (silindir, küre) veya yan duvarların ve tabanın (kutu) kalınlığı.", "Espesor de la envolvente (cilindro, esfera) o de las paredes laterales y el fondo (caja)."],
    ["End-plate thickness", "Dicke der Stirnplatten", "Dikte van de eindplaten", "Uç plaka kalınlığı", "Espesor de las tapas"],
    ["Lid thickness", "Deckeldicke", "Dekseldikte", "Kapak kalınlığı", "Espesor de la tapa"],
    ["Plate edges", "Plattenränder", "Plaatranden", "Plaka kenarları", "Bordes de placa"],
    ["Welded or thick flanged edges act as clamped; bolted covers on an O-ring are closer to simply supported.", "Geschweißte oder dicke geflanschte Ränder wirken eingespannt; verschraubte Deckel auf einem O-Ring sind eher frei aufgelagert.", "Gelaste of dikke geflensde randen werken als ingeklemd; geboute deksels op een O-ring liggen dichter bij vrij opgelegd.", "Kaynaklı veya kalın flanşlı kenarlar ankastre davranır; O-ring üzerine cıvatalı kapaklar basit mesnetliye daha yakındır.", "Los bordes soldados o con brida gruesa actúan como empotrados; las tapas atornilladas sobre una junta tórica se acercan más a simplemente apoyadas."],
    ["Clamped (welded)", "Eingespannt (geschweißt)", "Ingeklemd (gelast)", "Ankastre (kaynaklı)", "Empotrado (soldado)"],
    ["Simply supported (bolted)", "Frei aufgelagert (verschraubt)", "Vrij opgelegd (gebout)", "Basit mesnetli (cıvatalı)", "Simplemente apoyado (atornillado)"],
    ["Stiffening-ring spacing", "Abstand der Versteifungsringe", "Afstand verstijvingsringen", "Takviye halkası aralığı", "Separación de anillos rigidizadores"],
    ["Distance between circumferential stiffening rings. 0 = no rings, the unsupported length is the cylinder length.", "Abstand zwischen umlaufenden Versteifungsringen. 0 = keine Ringe, die freie Länge ist die Zylinderlänge.", "Afstand tussen omtreksverstijvingsringen. 0 = geen ringen, de vrije lengte is de cilinderlengte.", "Çevresel takviye halkaları arasındaki mesafe. 0 = halka yok, desteksiz uzunluk silindir uzunluğudur.", "Distancia entre anillos rigidizadores circunferenciales. 0 = sin anillos, la longitud libre es la del cilindro."],
    ["Volume {V}, inner surface {A}.", "Volumen {V}, innere Oberfläche {A}.", "Volume {V}, binnenoppervlak {A}.", "Hacim {V}, iç yüzey {A}.", "Volumen {V}, superficie interior {A}."],

    // ----- Form: pressure & gas -----
    ["Pressure & gas", "Druck & Gas", "Druk & gas", "Basınç ve gaz", "Presión y gas"],
    ["Target base pressure", "Ziel-Enddruck", "Beoogde einddruk", "Hedef taban basıncı", "Presión base objetivo"],
    ["Pressure the chamber must reach (without process gas). Its vacuum range decides the pump type and the seals.", "Druck, den die Kammer erreichen muss (ohne Prozessgas). Sein Vakuumbereich bestimmt Pumpentyp und Dichtungen.", "Druk die de kamer moet bereiken (zonder procesgas). Het vacuümgebied bepaalt het pomptype en de afdichtingen.", "Odanın ulaşması gereken basınç (proses gazı olmadan). Vakum aralığı pompa tipini ve contaları belirler.", "Presión que debe alcanzar la cámara (sin gas de proceso). Su rango de vacío decide el tipo de bomba y las juntas."],
    ["Pumping time", "Pumpzeit", "Pomptijd", "Pompalama süresi", "Tiempo de bombeo"],
    ["Time after the start of pumping at which the pressure and the outgassing load are evaluated. Outgassing falls roughly as 1/t, so a longer pumping time gives a lower pressure.", "Zeit nach dem Pumpbeginn, zu der Druck und Ausgasungslast bewertet werden. Die Ausgasung sinkt etwa mit 1/t, eine längere Pumpzeit ergibt also einen niedrigeren Druck.", "Tijd na het begin van het pompen waarop druk en ontgassingslast worden bepaald. Ontgassing daalt ongeveer met 1/t, dus een langere pomptijd geeft een lagere druk.", "Basıncın ve gaz salınımı yükünün değerlendirildiği, pompalamanın başlangıcından sonraki süre. Gaz salınımı yaklaşık 1/t ile düşer; daha uzun pompalama daha düşük basınç verir.", "Tiempo desde el inicio del bombeo en el que se evalúan la presión y la carga de desgasificación. La desgasificación cae aproximadamente como 1/t, así que un tiempo mayor da una presión menor."],
    ["Start pressure", "Anfangsdruck", "Begindruk", "Başlangıç basıncı", "Presión inicial"],
    ["Temperature", "Temperatur", "Temperatuur", "Sıcaklık", "Temperatura"],
    ["Gas", "Gas", "Gas", "Gaz", "Gas"],
    ["Gas used for the conductances, mean free path and flow regime. Outgassing of unbaked systems is mostly water vapour, air leaks are air.", "Gas für Leitwerte, mittlere freie Weglänge und Strömungsart. Die Ausgasung nicht ausgeheizter Systeme ist überwiegend Wasserdampf, Luftlecks sind Luft.", "Gas voor de geleidingen, gemiddelde vrije weglengte en stromingsgebied. Ontgassing van niet-uitgestookte systemen is vooral waterdamp, luchtlekken zijn lucht.", "İletkenlikler, ortalama serbest yol ve akış rejimi için kullanılan gaz. Fırınlanmamış sistemlerde gaz salınımı çoğunlukla su buharıdır, hava kaçakları havadır.", "Gas usado para las conductancias, el recorrido libre medio y el régimen de flujo. La desgasificación de sistemas sin hornear es sobre todo vapor de agua; las fugas de aire son aire."],

    // ----- Form: gas loads -----
    ["Gas loads", "Gaslasten", "Gaslasten", "Gaz yükleri", "Cargas de gas"],
    ["Wall surface", "Wandoberfläche", "Wandoppervlak", "Duvar yüzeyi", "Superficie de la pared"],
    ["Outgassing of metal walls after 1 h of pumping (figure 10.1): ultraclean 10⁻⁶, normally cleaned 10⁻⁵, rusty 10⁻⁴ Pa·m³/(s·m²), falling as 1/t.", "Ausgasung von Metallwänden nach 1 h Pumpen (Bild 10.1): ultrarein 10⁻⁶, normal gereinigt 10⁻⁵, rostig 10⁻⁴ Pa·m³/(s·m²), fallend mit 1/t.", "Ontgassing van metalen wanden na 1 h pompen (figuur 10.1): ultraschoon 10⁻⁶, normaal gereinigd 10⁻⁵, roestig 10⁻⁴ Pa·m³/(s·m²), dalend met 1/t.", "1 saat pompalamadan sonra metal duvarların gaz salınımı (şekil 10.1): ultra temiz 10⁻⁶, normal temizlenmiş 10⁻⁵, paslı 10⁻⁴ Pa·m³/(s·m²), 1/t ile azalır.", "Desgasificación de paredes metálicas tras 1 h de bombeo (figura 10.1): ultralimpia 10⁻⁶, limpieza normal 10⁻⁵, oxidada 10⁻⁴ Pa·m³/(s·m²), decreciendo como 1/t."],
    ["Ultraclean", "Ultrarein", "Ultraschoon", "Ultra temiz", "Ultralimpia"],
    ["Normally cleaned", "Normal gereinigt", "Normaal gereinigd", "Normal temizlenmiş", "Limpieza normal"],
    ["Rusty / dirty", "Rostig / verschmutzt", "Roestig / vuil", "Paslı / kirli", "Oxidada / sucia"],
    ["Ignore outgassing", "Ausgasung vernachlässigen", "Ontgassing negeren", "Gaz salınımını yok say", "Ignorar la desgasificación"],
    ["Bakeout", "Ausheizen", "Uitstoken", "Fırınlama", "Horneado"],
    ["After the bakeout the outgassing drops to the baked values of appendix D (10⁻⁹–10⁻¹¹ Pa·m³/(s·m²) for stainless steel).", "Nach dem Ausheizen sinkt die Ausgasung auf die Werte von Anhang D (10⁻⁹–10⁻¹¹ Pa·m³/(s·m²) für Edelstahl).", "Na het uitstoken daalt de ontgassing tot de waarden van bijlage D (10⁻⁹–10⁻¹¹ Pa·m³/(s·m²) voor roestvast staal).", "Fırınlamadan sonra gaz salınımı Ek D'deki fırınlanmış değerlere düşer (paslanmaz çelik için 10⁻⁹–10⁻¹¹ Pa·m³/(s·m²)).", "Tras el horneado la desgasificación baja a los valores del apéndice D (10⁻⁹–10⁻¹¹ Pa·m³/(s·m²) para acero inoxidable)."],
    ["Bakeout temperature", "Ausheiztemperatur", "Uitstooktemperatuur", "Fırınlama sıcaklığı", "Temperatura de horneado"],
    ["Bakeout ends after", "Ausheizen endet nach", "Uitstoken eindigt na", "Fırınlamanın bitişi", "El horneado termina tras"],
    ["Time from the start of pumping until the bakeout has finished and the chamber is back at room temperature. Before that the unbaked outgassing applies.", "Zeit vom Pumpbeginn, bis das Ausheizen beendet und die Kammer wieder auf Raumtemperatur ist. Davor gilt die Ausgasung ohne Ausheizen.", "Tijd vanaf het begin van het pompen tot het uitstoken klaar is en de kamer weer op kamertemperatuur is. Daarvoor geldt de ontgassing zonder uitstoken.", "Pompalamanın başlangıcından fırınlama bitip oda yeniden oda sıcaklığına gelene kadar geçen süre. Bundan önce fırınlanmamış gaz salınımı geçerlidir.", "Tiempo desde el inicio del bombeo hasta que termina el horneado y la cámara vuelve a temperatura ambiente. Antes se aplica la desgasificación sin hornear."],
    ["Internal parts", "Einbauten", "Interne onderdelen", "İç parçalar", "Piezas internas"],
    ["Fixtures, cables, insulation, samples inside the chamber: their surface outgasses as well. Choose Custom to enter your own rate.", "Halterungen, Kabel, Isolierung, Proben in der Kammer: auch ihre Oberfläche gast aus. Mit Benutzerdefiniert geben Sie eine eigene Rate ein.", "Opspanningen, kabels, isolatie, monsters in de kamer: ook hun oppervlak ontgast. Kies Aangepast om een eigen waarde in te voeren.", "Odanın içindeki fikstürler, kablolar, yalıtım, numuneler: yüzeyleri de gaz salar. Kendi değerinizi girmek için Özel'i seçin.", "Utillajes, cables, aislamiento, muestras dentro de la cámara: su superficie también desgasifica. Elija Personalizado para introducir su propio valor."],
    ["+ Add part", "+ Teil hinzufügen", "+ Onderdeel toevoegen", "+ Parça ekle", "+ Añadir pieza"],
    ["Elastomer seals", "Elastomerdichtungen", "Elastomeer-afdichtingen", "Elastomer contalar", "Juntas de elastómero"],
    ["O-rings: gas permeates through the rubber from the atmosphere (permeation ∝ length), and the exposed rubber outgasses. A double O-ring with a pumped interspace lowers the pressure difference.", "O-Ringe: Gas permeiert aus der Atmosphäre durch das Gummi (Permeation ∝ Länge), und das freiliegende Gummi gast aus. Ein doppelter O-Ring mit abgepumptem Zwischenraum senkt die Druckdifferenz.", "O-ringen: gas permeëert vanuit de atmosfeer door het rubber (permeatie ∝ lengte), en het blootliggende rubber ontgast. Een dubbele O-ring met afgepompte tussenruimte verlaagt het drukverschil.", "O-ringler: gaz atmosferden kauçuk içinden geçer (geçirgenlik ∝ uzunluk) ve açıktaki kauçuk gaz salar. Arası pompalanan çift O-ring basınç farkını azaltır.", "Juntas tóricas: el gas atraviesa el caucho desde la atmósfera (permeación ∝ longitud) y el caucho expuesto desgasifica. Una junta doble con espacio intermedio bombeado reduce la diferencia de presión."],
    ["+ Add seal", "+ Dichtung hinzufügen", "+ Afdichting toevoegen", "+ Conta ekle", "+ Añadir junta"],
    ["Leak rate (total)", "Leckrate (gesamt)", "Lekdebiet (totaal)", "Kaçak oranı (toplam)", "Tasa de fuga (total)"],
    ["Allowed total leak rate of the welds, feedthroughs and seals. A good helium leak test reaches 10⁻¹⁰ Pa·m³/s per joint.", "Zulässige Gesamtleckrate der Schweißnähte, Durchführungen und Dichtungen. Eine gute Helium-Lecksuche erreicht 10⁻¹⁰ Pa·m³/s je Verbindung.", "Toegestaan totaal lekdebiet van lassen, doorvoeren en afdichtingen. Een goede heliumlektest haalt 10⁻¹⁰ Pa·m³/s per verbinding.", "Kaynakların, geçişlerin ve contaların izin verilen toplam kaçak oranı. İyi bir helyum kaçak testi bağlantı başına 10⁻¹⁰ Pa·m³/s'ye ulaşır.", "Tasa de fuga total admisible de soldaduras, pasamuros y juntas. Una buena prueba de fugas con helio llega a 10⁻¹⁰ Pa·m³/s por unión."],
    ["Process gas flow", "Prozessgasstrom", "Procesgasdebiet", "Proses gazı akışı", "Caudal de gas de proceso"],
    ["Gas let in during operation (sputter gas, leak valve). It sets the working pressure and the backing-pump size, not the base pressure.", "Im Betrieb eingelassenes Gas (Sputtergas, Dosierventil). Es bestimmt den Arbeitsdruck und die Größe der Vorpumpe, nicht den Enddruck.", "Gas dat tijdens bedrijf wordt ingelaten (sputtergas, doseerventiel). Het bepaalt de werkdruk en de grootte van de voorpomp, niet de einddruk.", "Çalışma sırasında içeri verilen gaz (püskürtme gazı, dozaj vanası). Taban basıncını değil, çalışma basıncını ve ön pompa boyutunu belirler.", "Gas admitido durante el funcionamiento (gas de pulverización, válvula dosificadora). Fija la presión de trabajo y el tamaño de la bomba primaria, no la presión base."],

    // ----- Form: pumps -----
    ["Roughing pump", "Vorpumpe", "Voorpomp", "Kaba vakum pompası", "Bomba primaria"],
    ["Pump type", "Pumpentyp", "Pomptype", "Pompa tipi", "Tipo de bomba"],
    ["Pumping speed", "Saugvermögen", "Pompsnelheid", "Pompalama hızı", "Velocidad de bombeo"],
    ["Ultimate pressure", "Enddruck", "Einddruk", "Nihai basınç", "Presión última"],
    ["Roots booster", "Wälzkolbenpumpe (Roots)", "Rootsbooster", "Roots güçlendirici", "Bomba Roots de refuerzo"],
    ["A Roots pump in series raises the speed between about 10³ and 10⁻¹ Pa (§4.6).", "Eine Wälzkolbenpumpe in Reihe erhöht das Saugvermögen zwischen etwa 10³ und 10⁻¹ Pa (§4.6).", "Een rootspomp in serie verhoogt de pompsnelheid tussen ongeveer 10³ en 10⁻¹ Pa (§4.6).", "Seri bağlı bir Roots pompası hızı yaklaşık 10³ ile 10⁻¹ Pa arasında artırır (§4.6).", "Una bomba Roots en serie aumenta la velocidad entre unos 10³ y 10⁻¹ Pa (§4.6)."],
    ["Roots speed", "Saugvermögen Roots", "Snelheid rootspomp", "Roots hızı", "Velocidad Roots"],
    ["Roots switch-on below", "Roots einschalten unter", "Roots inschakelen onder", "Roots devreye girme basıncı", "Arranque Roots por debajo de"],
    ["Roughing line (chamber → pump)", "Vorvakuumleitung (Kammer → Pumpe)", "Voorvacuümleiding (kamer → pomp)", "Kaba vakum hattı (oda → pompa)", "Línea de prevacío (cámara → bomba)"],
    ["Tubes, valves and orifices in series between the chamber and the roughing pump.", "Rohre, Ventile und Blenden in Reihe zwischen Kammer und Vorpumpe.", "Buizen, kleppen en openingen in serie tussen de kamer en de voorpomp.", "Oda ile kaba vakum pompası arasında seri borular, vanalar ve orifisler.", "Tubos, válvulas y orificios en serie entre la cámara y la bomba primaria."],
    ["+ Add element", "+ Element hinzufügen", "+ Element toevoegen", "+ Eleman ekle", "+ Añadir elemento"],
    ["High-vacuum pump", "Hochvakuumpumpe", "Hoogvacuümpomp", "Yüksek vakum pompası", "Bomba de alto vacío"],
    ["Inlet pumping speed for the selected gas, from the data sheet.", "Saugvermögen am Einlass für das gewählte Gas, aus dem Datenblatt.", "Pompsnelheid aan de inlaat voor het gekozen gas, uit het gegevensblad.", "Seçilen gaz için giriş pompalama hızı, veri sayfasından.", "Velocidad de bombeo en la entrada para el gas elegido, según la hoja de datos."],
    ["Crossover pressure", "Umschaltdruck", "Omschakeldruk", "Geçiş basıncı", "Presión de transferencia"],
    ["Pressure at which the roughing valve closes and the high-vacuum valve opens.", "Druck, bei dem das Vorvakuumventil schließt und das Hochvakuumventil öffnet.", "Druk waarbij de voorvacuümklep sluit en de hoogvacuümklep opent.", "Kaba vakum vanasının kapandığı ve yüksek vakum vanasının açıldığı basınç.", "Presión a la que se cierra la válvula de prevacío y se abre la de alto vacío."],
    ["Max. backing pressure", "Max. Vorvakuumdruck", "Max. voorvacuümdruk", "Maks. ön vakum basıncı", "Presión de apoyo máx."],
    ["Highest fore-vacuum pressure at the pump outlet: about 10 Pa for turbo pumps, the critical backing pressure (≈20 Pa) for diffusion pumps.", "Höchster Vorvakuumdruck am Pumpenauslass: etwa 10 Pa bei Turbopumpen, der kritische Vorvakuumdruck (≈20 Pa) bei Diffusionspumpen.", "Hoogste voorvacuümdruk aan de pompuitlaat: ongeveer 10 Pa voor turbopompen, de kritische voorvacuümdruk (≈20 Pa) voor diffusiepompen.", "Pompa çıkışındaki en yüksek ön vakum basıncı: turbo pompalarda yaklaşık 10 Pa, difüzyon pompalarında kritik ön vakum basıncı (≈20 Pa).", "Máxima presión de prevacío en la salida de la bomba: unos 10 Pa en turbobombas, la presión crítica (≈20 Pa) en bombas de difusión."],
    ["Inlet flange diameter", "Durchmesser Einlassflansch", "Diameter inlaatflens", "Giriş flanşı çapı", "Diámetro de la brida de entrada"],
    ["The molecular conductance of the inlet opening limits the speed that any pump on this flange can have (exercise 4-5).", "Der molekulare Leitwert der Einlassöffnung begrenzt das Saugvermögen jeder Pumpe an diesem Flansch (Aufgabe 4-5).", "De moleculaire geleiding van de inlaatopening begrenst de snelheid van elke pomp op deze flens (opgave 4-5).", "Giriş açıklığının moleküler iletkenliği, bu flanştaki herhangi bir pompanın hızını sınırlar (alıştırma 4-5).", "La conductancia molecular de la abertura de entrada limita la velocidad de cualquier bomba en esta brida (ejercicio 4-5)."],
    ["High-vacuum line (chamber → pump)", "Hochvakuumleitung (Kammer → Pumpe)", "Hoogvacuümleiding (kamer → pomp)", "Yüksek vakum hattı (oda → pompa)", "Línea de alto vacío (cámara → bomba)"],
    ["Ports, valves, baffles and traps in series between the chamber and the high-vacuum pump.", "Stutzen, Ventile, Baffles und Kühlfallen in Reihe zwischen Kammer und Hochvakuumpumpe.", "Aansluitingen, kleppen, baffles en koudevallen in serie tussen de kamer en de hoogvacuümpomp.", "Oda ile yüksek vakum pompası arasında seri portlar, vanalar, bölmeler ve tuzaklar.", "Puertos, válvulas, deflectores y trampas en serie entre la cámara y la bomba de alto vacío."],

    // ----- Form: strength -----
    ["Strength", "Festigkeit", "Sterkte", "Dayanım", "Resistencia"],
    ["Safety factor, buckling", "Sicherheitsfaktor Beulen", "Veiligheidsfactor knik", "Burkulma güvenlik katsayısı", "Factor de seguridad, pandeo"],
    ["Ratio of the elastic buckling pressure to the atmospheric load. Thin shells are imperfection-sensitive: 3 to 5 is usual.", "Verhältnis des elastischen Beuldrucks zur atmosphärischen Last. Dünne Schalen sind imperfektionsempfindlich: 3 bis 5 ist üblich.", "Verhouding van de elastische knikdruk tot de atmosferische belasting. Dunne schalen zijn gevoelig voor imperfecties: 3 tot 5 is gebruikelijk.", "Elastik burkulma basıncının atmosferik yüke oranı. İnce kabuklar kusurlara duyarlıdır: 3 ila 5 olağandır.", "Relación entre la presión de pandeo elástico y la carga atmosférica. Las láminas delgadas son sensibles a imperfecciones: lo habitual es de 3 a 5."],
    ["Safety factor, yield", "Sicherheitsfaktor Fließgrenze", "Veiligheidsfactor vloeigrens", "Akma güvenlik katsayısı", "Factor de seguridad, fluencia"],
    ["Allowed stress = yield strength / safety factor.", "Zulässige Spannung = Streckgrenze / Sicherheitsfaktor.", "Toelaatbare spanning = vloeigrens / veiligheidsfactor.", "İzin verilen gerilme = akma dayanımı / güvenlik katsayısı.", "Tensión admisible = límite elástico / factor de seguridad."],
    ["External pressure 1 atm (vacuum inside). Shells: Windenburg–Trilling buckling; flat plates: Roark plate formulas.", "Außendruck 1 atm (innen Vakuum). Schalen: Beulen nach Windenburg–Trilling; ebene Platten: Plattenformeln nach Roark.", "Uitwendige druk 1 atm (vacuüm binnen). Schalen: knik volgens Windenburg–Trilling; vlakke platen: plaatformules van Roark.", "Dış basınç 1 atm (içeride vakum). Kabuklar: Windenburg–Trilling burkulması; düz plakalar: Roark plaka formülleri.", "Presión exterior 1 atm (vacío dentro). Láminas: pandeo de Windenburg–Trilling; placas planas: fórmulas de placas de Roark."],
    // ----- Results -----
    ["Pressure after the pumping time", "Druck nach der Pumpzeit", "Druk na de pomptijd", "Pompalama süresi sonundaki basınç", "Presión tras el tiempo de bombeo"],
    ["Pump-down curve", "Auspumpkurve", "Afpompcurve", "Boşaltma eğrisi", "Curva de evacuación"],
    ["Vacuum system", "Vakuumsystem", "Vacuümsysteem", "Vakum sistemi", "Sistema de vacío"],
    ["Gas load at the pumping time", "Gaslast zur Pumpzeit", "Gaslast op de pomptijd", "Pompalama süresindeki gaz yükü", "Carga de gas en el tiempo de bombeo"],
    ["Results", "Ergebnisse", "Resultaten", "Sonuçlar", "Resultados"],
    ["Pumping lines", "Pumpleitungen", "Pompleidingen", "Pompalama hatları", "Líneas de bombeo"],
    ["Pump selection", "Pumpenauswahl", "Pompkeuze", "Pompa seçimi", "Selección de bombas"],
    ["Pump types whose working range covers the target pressure (chapter 4 tables). The working range ends 5 to 10 times above the ultimate pressure.", "Pumpentypen, deren Arbeitsbereich den Zieldruck abdeckt (Tabellen in Kapitel 4). Der Arbeitsbereich endet 5- bis 10-mal über dem Enddruck.", "Pomptypes waarvan het werkgebied de beoogde druk dekt (tabellen hoofdstuk 4). Het werkgebied eindigt 5 tot 10 keer boven de einddruk.", "Çalışma aralığı hedef basıncı kapsayan pompa tipleri (bölüm 4 tabloları). Çalışma aralığı nihai basıncın 5 ila 10 katında biter.", "Tipos de bomba cuyo rango de trabajo cubre la presión objetivo (tablas del capítulo 4). El rango de trabajo termina de 5 a 10 veces por encima de la presión última."],
    ["Wall strength under atmospheric pressure", "Wandfestigkeit unter Atmosphärendruck", "Wandsterkte onder atmosferische druk", "Atmosfer basıncı altında duvar dayanımı", "Resistencia de la pared bajo presión atmosférica"],
    ["Step-by-step calculation", "Schritt-für-Schritt-Berechnung", "Stapsgewijze berekening", "Adım adım hesaplama", "Cálculo paso a paso"],
    ["Outgassing and seal library", "Bibliothek Ausgasung und Dichtungen", "Bibliotheek ontgassing en afdichtingen", "Gaz salınımı ve conta kütüphanesi", "Biblioteca de desgasificación y juntas"],
    ["Typical values from the book (figures 10.1–10.3, tables 10.1–10.2, appendix D). Real rates depend on cleaning, history and pumping time; measure for critical systems.", "Typische Werte aus dem Buch (Bilder 10.1–10.3, Tabellen 10.1–10.2, Anhang D). Reale Raten hängen von Reinigung, Vorgeschichte und Pumpzeit ab; für kritische Systeme messen.", "Typische waarden uit het boek (figuren 10.1–10.3, tabellen 10.1–10.2, bijlage D). Werkelijke waarden hangen af van reiniging, voorgeschiedenis en pomptijd; meet voor kritische systemen.", "Kitaptan tipik değerler (şekil 10.1–10.3, tablo 10.1–10.2, Ek D). Gerçek değerler temizliğe, geçmişe ve pompalama süresine bağlıdır; kritik sistemlerde ölçün.", "Valores típicos del libro (figuras 10.1–10.3, tablas 10.1–10.2, apéndice D). Los valores reales dependen de la limpieza, el historial y el tiempo de bombeo; mida en sistemas críticos."],
    ["Gas library", "Gasbibliothek", "Gasbibliotheek", "Gaz kütüphanesi", "Biblioteca de gases"],
    ["Method, assumptions & sources", "Methode, Annahmen & Quellen", "Methode, aannames & bronnen", "Yöntem, varsayımlar ve kaynaklar", "Método, supuestos y fuentes"],
    ["not reached", "nicht erreicht", "niet bereikt", "ulaşılamadı", "no alcanzada"],
    ["Remove", "Entfernen", "Verwijderen", "Kaldır", "Quitar"],
    ["Material", "Werkstoff", "Materiaal", "Malzeme", "Material"],
    ["Surface area", "Oberfläche", "Oppervlak", "Yüzey alanı", "Superficie"],
    ["Outgassing after 1 h", "Ausgasung nach 1 h", "Ontgassing na 1 h", "1 saat sonra gaz salınımı", "Desgasificación tras 1 h"],
    ["Decay exponent α", "Abklingexponent α", "Afnamexponent α", "Azalma üssü α", "Exponente de caída α"],
    ["Seal diameter", "Dichtungsdurchmesser", "Afdichtingsdiameter", "Conta çapı", "Diámetro de la junta"],
    ["Cord Ø", "Schnur-Ø", "Koord-Ø", "Kesit Ø", "Ø de cordón"],
    ["Count", "Anzahl", "Aantal", "Adet", "Cantidad"],
    ["Double, pumped interspace", "Doppelt, Zwischenraum abgepumpt", "Dubbel, tussenruimte afgepompt", "Çift, arası pompalanan", "Doble, espacio intermedio bombeado"],
    ["Interspace pressure", "Druck im Zwischenraum", "Druk in de tussenruimte", "Ara boşluk basıncı", "Presión intermedia"],
    ["No internal parts.", "Keine Einbauten.", "Geen interne onderdelen.", "İç parça yok.", "Sin piezas internas."],
    ["No elastomer seals (metal seals only).", "Keine Elastomerdichtungen (nur Metalldichtungen).", "Geen elastomeer-afdichtingen (alleen metalen afdichtingen).", "Elastomer conta yok (yalnızca metal contalar).", "Sin juntas de elastómero (solo juntas metálicas)."],
    ["Element", "Element", "Element", "Eleman", "Elemento"],
    ["Pump directly on the chamber (no line).", "Pumpe direkt an der Kammer (keine Leitung).", "Pomp direct op de kamer (geen leiding).", "Pompa doğrudan odada (hat yok).", "Bomba directamente en la cámara (sin línea)."],
    ["Check the inputs: dimensions, speeds and pressures must be positive.", "Eingaben prüfen: Abmessungen, Saugvermögen und Drücke müssen positiv sein.", "Controleer de invoer: afmetingen, snelheden en drukken moeten positief zijn.", "Girdileri kontrol edin: boyutlar, hızlar ve basınçlar pozitif olmalıdır.", "Revise los datos: dimensiones, velocidades y presiones deben ser positivas."],
    ["Pressure after {t} of pumping", "Druck nach {t} Pumpzeit", "Druk na {t} pompen", "{t} pompalamadan sonraki basınç", "Presión tras {t} de bombeo"],
    ["Target {p} reached after {t} · {range}", "Ziel {p} erreicht nach {t} · {range}", "Doel {p} bereikt na {t} · {range}", "Hedef {p}, {t} sonra ulaşıldı · {range}", "Objetivo {p} alcanzado tras {t} · {range}"],
    ["Target {p} not reached · {range}", "Ziel {p} nicht erreicht · {range}", "Doel {p} niet bereikt · {range}", "Hedef {p} ulaşılamadı · {range}", "Objetivo {p} no alcanzado · {range}"],
    ["Effective pumping speed", "Effektives Saugvermögen", "Effectieve pompsnelheid", "Etkin pompalama hızı", "Velocidad de bombeo efectiva"],
    ["Gas load", "Gaslast", "Gaslast", "Gaz yükü", "Carga de gas"],
    ["Time to crossover", "Zeit bis zum Umschalten", "Tijd tot omschakelen", "Geçişe kadar süre", "Tiempo hasta la transferencia"],
    ["Time constant V/S", "Zeitkonstante V/S", "Tijdconstante V/S", "Zaman sabiti V/S", "Constante de tiempo V/S"],
    ["Total (base load)", "Summe (Grundlast)", "Totaal (basislast)", "Toplam (taban yük)", "Total (carga base)"],
    ["Process gas (in operation)", "Prozessgas (im Betrieb)", "Procesgas (in bedrijf)", "Proses gazı (çalışırken)", "Gas de proceso (en funcionamiento)"],
    ["At {t} of pumping; outgassing falls with time, permeation and leaks stay constant.", "Nach {t} Pumpzeit; die Ausgasung sinkt mit der Zeit, Permeation und Lecks bleiben konstant.", "Na {t} pompen; ontgassing daalt met de tijd, permeatie en lekken blijven constant.", "{t} pompalamada; gaz salınımı zamanla azalır, geçirgenlik ve kaçaklar sabit kalır.", "Tras {t} de bombeo; la desgasificación baja con el tiempo, la permeación y las fugas se mantienen."],
    ["Volume", "Volumen", "Volume", "Hacim", "Volumen"],
    ["Inner surface area", "Innere Oberfläche", "Binnenoppervlak", "İç yüzey alanı", "Superficie interior"],
    ["Vacuum range of the target", "Vakuumbereich des Ziels", "Vacuümgebied van het doel", "Hedefin vakum aralığı", "Rango de vacío del objetivo"],
    ["Base pressure Q/Seff + pu", "Enddruck Q/Seff + pu", "Einddruk Q/Seff + pu", "Taban basıncı Q/Seff + pu", "Presión base Q/Seff + pu"],
    ["steady state at the gas load of the pumping time", "stationär bei der Gaslast der Pumpzeit", "stationair bij de gaslast van de pomptijd", "pompalama süresindeki gaz yükünde kararlı durum", "estado estacionario con la carga de gas del tiempo de bombeo"],
    ["Time to target pressure", "Zeit bis zum Zieldruck", "Tijd tot de beoogde druk", "Hedef basınca kadar süre", "Tiempo hasta la presión objetivo"],
    ["{pct} of the pump speed", "{pct} des Saugvermögens der Pumpe", "{pct} van de pompsnelheid", "pompa hızının {pct} kadarı", "{pct} de la velocidad de la bomba"],
    ["Line conductance (molecular)", "Leitwert der Leitung (molekular)", "Geleiding van de leiding (moleculair)", "Hat iletkenliği (moleküler)", "Conductancia de la línea (molecular)"],
    ["Required effective speed", "Erforderliches effektives Saugvermögen", "Vereiste effectieve snelheid", "Gerekli etkin hız", "Velocidad efectiva necesaria"],
    ["Q / (p_target − p_u)", "Q / (p_Ziel − p_u)", "Q / (p_doel − p_u)", "Q / (p_hedef − p_u)", "Q / (p_objetivo − p_u)"],
    ["Required pump speed", "Erforderliches Saugvermögen der Pumpe", "Vereiste pompsnelheid", "Gerekli pompa hızı", "Velocidad de bomba necesaria"],
    ["not possible", "nicht möglich", "niet mogelijk", "mümkün değil", "no es posible"],
    ["behind this line", "hinter dieser Leitung", "achter deze leiding", "bu hattın arkasında", "detrás de esta línea"],
    ["Roughing time constant V/S", "Zeitkonstante Vorpumpen V/S", "Tijdconstante voorpompen V/S", "Kaba vakum zaman sabiti V/S", "Constante de tiempo de prevacío V/S"],
    ["Working pressure with process gas", "Arbeitsdruck mit Prozessgas", "Werkdruk met procesgas", "Proses gazıyla çalışma basıncı", "Presión de trabajo con gas de proceso"],
    ["Min. backing pump speed", "Min. Saugvermögen der Vorpumpe", "Min. snelheid voorpomp", "Min. ön pompa hızı", "Velocidad mín. de la bomba primaria"],
    ["to keep the outlet below {p}", "damit der Auslass unter {p} bleibt", "om de uitlaat onder {p} te houden", "çıkışı {p} altında tutmak için", "para mantener la salida por debajo de {p}"],
    ["Mean free path at the target", "Mittlere freie Weglänge beim Ziel", "Gemiddelde vrije weglengte bij het doel", "Hedefte ortalama serbest yol", "Recorrido libre medio en el objetivo"],
    ["λ = {k}/p", "λ = {k}/p", "λ = {k}/p", "λ = {k}/p", "λ = {k}/p"],
    ["Knudsen number in the line", "Knudsen-Zahl in der Leitung", "Knudsengetal in de leiding", "Hattaki Knudsen sayısı", "Número de Knudsen en la línea"],
    ["Molecular flow", "Molekularströmung", "Moleculaire stroming", "Moleküler akış", "Flujo molecular"],
    ["Transition flow", "Übergangsströmung", "Overgangsstroming", "Geçiş akışı", "Flujo de transición"],
    ["Viscous flow", "Viskose Strömung", "Viskeuze stroming", "Viskoz akış", "Flujo viscoso"],
    ["Particle density at the target", "Teilchendichte beim Ziel", "Deeltjesdichtheid bij het doel", "Hedefte parçacık yoğunluğu", "Densidad de partículas en el objetivo"],
    ["Monolayer formation time", "Monolagen-Bildungszeit", "Vormingstijd monolaag", "Tek katman oluşma süresi", "Tiempo de formación de una monocapa"],
    ["sticking probability 1", "Haftwahrscheinlichkeit 1", "plakkans 1", "yapışma olasılığı 1", "probabilidad de adherencia 1"],
    ["Mean molecular speed", "Mittlere Molekülgeschwindigkeit", "Gemiddelde molecuulsnelheid", "Ortalama molekül hızı", "Velocidad molecular media"],
    ["Tube Ø{d} × {l}", "Rohr Ø{d} × {l}", "Buis Ø{d} × {l}", "Boru Ø{d} × {l}", "Tubo Ø{d} × {l}"],
    ["{n} bends", "{n} Bögen", "{n} bochten", "{n} dirsek", "{n} codos"],
    ["Orifice Ø{d}", "Blende Ø{d}", "Opening Ø{d}", "Orifis Ø{d}", "Orificio Ø{d}"],
    ["in tube Ø{d}", "in Rohr Ø{d}", "in buis Ø{d}", "Ø{d} boru içinde", "en tubo Ø{d}"],
    ["Duct {a} × {b} × {l}", "Kanal {a} × {b} × {l}", "Kanaal {a} × {b} × {l}", "Kanal {a} × {b} × {l}", "Conducto {a} × {b} × {l}"],
    ["Annulus Ø{a}/Ø{b} × {l}", "Ringspalt Ø{a}/Ø{b} × {l}", "Ringspleet Ø{a}/Ø{b} × {l}", "Halka aralık Ø{a}/Ø{b} × {l}", "Anular Ø{a}/Ø{b} × {l}"],
    ["Valve / baffle", "Ventil / Baffle", "Klep / baffle", "Vana / bölme", "Válvula / deflector"],
    ["No line, pump on the chamber", "Keine Leitung, Pumpe an der Kammer", "Geen leiding, pomp op de kamer", "Hat yok, pompa odada", "Sin línea, bomba en la cámara"],
    ["limiting", "begrenzend", "begrenzend", "sınırlayıcı", "limitante"],
    ["Line (series, 3.73)", "Leitung (Reihe, 3.73)", "Leiding (serie, 3.73)", "Hat (seri, 3.73)", "Línea (serie, 3.73)"],
    ["Pump {S} → effective speed (3.126)", "Pumpe {S} → effektives Saugvermögen (3.126)", "Pomp {S} → effectieve snelheid (3.126)", "Pompa {S} → etkin hız (3.126)", "Bomba {S} → velocidad efectiva (3.126)"],
    ["C molecular", "C molekular", "C moleculair", "C moleküler", "C molecular"],
    ["C at working pressure", "C bei Arbeitsdruck", "C bij werkdruk", "Çalışma basıncında C", "C a presión de trabajo"],
    ["Eq.", "Gl.", "Vgl.", "Denk.", "Ec."],
    ["Working pressure: the target pressure for the high-vacuum line, {p} mean pressure for the roughing line. Gas: {gas}, {T}.", "Arbeitsdruck: der Zieldruck für die Hochvakuumleitung, {p} mittlerer Druck für die Vorvakuumleitung. Gas: {gas}, {T}.", "Werkdruk: de beoogde druk voor de hoogvacuümleiding, {p} gemiddelde druk voor de voorvacuümleiding. Gas: {gas}, {T}.", "Çalışma basıncı: yüksek vakum hattı için hedef basınç, kaba vakum hattı için {p} ortalama basınç. Gaz: {gas}, {T}.", "Presión de trabajo: la presión objetivo para la línea de alto vacío, {p} de presión media para la línea de prevacío. Gas: {gas}, {T}."],
    ["High-vacuum line", "Hochvakuumleitung", "Hoogvacuümleiding", "Yüksek vakum hattı", "Línea de alto vacío"],
    ["Roughing line", "Vorvakuumleitung", "Voorvacuümleiding", "Kaba vakum hattı", "Línea de prevacío"],
    ["High-vacuum pumps", "Hochvakuumpumpen", "Hoogvacuümpompen", "Yüksek vakum pompaları", "Bombas de alto vacío"],
    ["Roughing pumps", "Vorpumpen", "Voorpompen", "Kaba vakum pompaları", "Bombas primarias"],
    ["Pump", "Pumpe", "Pomp", "Pompa", "Bomba"],
    ["Working range", "Arbeitsbereich", "Werkgebied", "Çalışma aralığı", "Rango de trabajo"],
    ["Typical speed", "Typisches Saugvermögen", "Typische snelheid", "Tipik hız", "Velocidad típica"],
    ["Target", "Ziel", "Doel", "Hedef", "Objetivo"],
    ["Click a row to use that pump type.", "Klicken Sie auf eine Zeile, um diesen Pumpentyp zu verwenden.", "Klik op een rij om dat pomptype te gebruiken.", "O pompa tipini kullanmak için bir satıra tıklayın.", "Haga clic en una fila para usar ese tipo de bomba."],
    ["Part", "Bauteil", "Onderdeel", "Parça", "Pieza"],
    ["Thickness", "Dicke", "Dikte", "Kalınlık", "Espesor"],
    ["Stress", "Spannung", "Spanning", "Gerilme", "Tensión"],
    ["Deflection", "Durchbiegung", "Doorbuiging", "Sehim", "Flecha"],
    ["Buckling p/atm", "Beulen p/atm", "Knik p/atm", "Burkulma p/atm", "Pandeo p/atm"],
    ["Min. thickness", "Min. Dicke", "Min. dikte", "Min. kalınlık", "Espesor mín."],
    ["Utilisation", "Auslastung", "Benutting", "Kullanım oranı", "Utilización"],
    ["{mat}: E = {E}, yield {Rp}; allowed stress {a}. Not from the book: Roark plate formulas and Windenburg–Trilling shell buckling; ports and flanges need reinforcement checks.", "{mat}: E = {E}, Streckgrenze {Rp}; zulässige Spannung {a}. Nicht aus dem Buch: Plattenformeln nach Roark und Schalenbeulen nach Windenburg–Trilling; Stutzen und Flansche brauchen eine Verstärkungsprüfung.", "{mat}: E = {E}, vloeigrens {Rp}; toelaatbare spanning {a}. Niet uit het boek: plaatformules van Roark en schaalknik volgens Windenburg–Trilling; aansluitingen en flenzen vragen een versterkingscontrole.", "{mat}: E = {E}, akma {Rp}; izin verilen gerilme {a}. Kitaptan değil: Roark plaka formülleri ve Windenburg–Trilling kabuk burkulması; portlar ve flanşlar için takviye kontrolü gerekir.", "{mat}: E = {E}, límite elástico {Rp}; tensión admisible {a}. No procede del libro: fórmulas de placas de Roark y pandeo de láminas de Windenburg–Trilling; puertos y bridas requieren comprobar refuerzos."],
    ["Too weak", "Zu schwach", "Te zwak", "Çok zayıf", "Demasiado débil"],
    ["OK", "OK", "OK", "Uygun", "OK"],
    ["After 1 h", "Nach 1 h", "Na 1 h", "1 saat sonra", "Tras 1 h"],
    ["After bakeout", "Nach dem Ausheizen", "Na uitstoken", "Fırınlamadan sonra", "Tras el horneado"],
    ["Max. bakeout", "Max. Ausheizen", "Max. uitstoken", "Maks. fırınlama", "Horneado máx."],
    ["Source", "Quelle", "Bron", "Kaynak", "Fuente"],
    ["Metals: normally cleaned surface; q(t) = q₁ₕ·(1 h/t)^α.", "Metalle: normal gereinigte Oberfläche; q(t) = q₁ₕ·(1 h/t)^α.", "Metalen: normaal gereinigd oppervlak; q(t) = q₁ₕ·(1 h/t)^α.", "Metaller: normal temizlenmiş yüzey; q(t) = q₁ₕ·(1 h/t)^α.", "Metales: superficie con limpieza normal; q(t) = q₁ₕ·(1 h/t)^α."],
    ["Seal material", "Dichtungswerkstoff", "Afdichtingsmateriaal", "Conta malzemesi", "Material de la junta"],
    ["Permeability [m²/s]", "Permeabilität [m²/s]", "Permeabiliteit [m²/s]", "Geçirgenlik [m²/s]", "Permeabilidad [m²/s]"],
    ["Permeation per metre", "Permeation je Meter", "Permeatie per meter", "Metre başına geçirgenlik", "Permeación por metro"],
    ["Max. temperature", "Max. Temperatur", "Max. temperatuur", "Maks. sıcaklık", "Temperatura máx."],
    ["Air at 25 °C, 1 atm across the seal.", "Luft bei 25 °C, 1 atm über der Dichtung.", "Lucht bij 25 °C, 1 atm over de afdichting.", "25 °C'de hava, conta boyunca 1 atm.", "Aire a 25 °C, 1 atm a través de la junta."],
    ["Orifice C [L/(s·cm²)]", "Blenden-C [L/(s·cm²)]", "Openings-C [L/(s·cm²)]", "Orifis C [L/(s·cm²)]", "C de orificio [L/(s·cm²)]"],
    ["At {T}. Click a row to use that gas.", "Bei {T}. Klicken Sie auf eine Zeile, um dieses Gas zu verwenden.", "Bij {T}. Klik op een rij om dat gas te gebruiken.", "{T} sıcaklıkta. O gazı kullanmak için bir satıra tıklayın.", "A {T}. Haga clic en una fila para usar ese gas."],
    ["Loaded example: {name}", "Beispiel geladen: {name}", "Voorbeeld geladen: {name}", "Örnek yüklendi: {name}", "Ejemplo cargado: {name}"],
    ["Link copied to clipboard", "Link in die Zwischenablage kopiert", "Link naar het klembord gekopieerd", "Bağlantı panoya kopyalandı", "Enlace copiado al portapapeles"],
    ["Link updated in the address bar", "Link in der Adressleiste aktualisiert", "Link bijgewerkt in de adresbalk", "Bağlantı adres çubuğunda güncellendi", "Enlace actualizado en la barra de direcciones"],
    ["Creating PDF…", "PDF wird erstellt…", "PDF maken…", "PDF oluşturuluyor…", "Creando PDF…"],
    ["PDF export failed: {msg}", "PDF-Export fehlgeschlagen: {msg}", "PDF-export mislukt: {msg}", "PDF dışa aktarma başarısız: {msg}", "Error al exportar el PDF: {msg}"],
    ["Wall outgassing", "Ausgasung der Wand", "Ontgassing van de wand", "Duvar gaz salınımı", "Desgasificación de la pared"],
    ["Seal permeation", "Permeation durch Dichtungen", "Permeatie door afdichtingen", "Conta geçirgenliği", "Permeación de juntas"],
    ["Seal outgassing", "Ausgasung der Dichtungen", "Ontgassing van afdichtingen", "Conta gaz salınımı", "Desgasificación de juntas"],
    ["Leaks", "Lecks", "Lekken", "Kaçaklar", "Fugas"],
    ["Diameter", "Durchmesser", "Diameter", "Çap", "Diámetro"],
    ["Bends", "Bögen", "Bochten", "Dirsekler", "Codos"],
    ["Bend type", "Bogenart", "Type bocht", "Dirsek tipi", "Tipo de codo"],
    ["Entrance from chamber", "Eintritt aus der Kammer", "Ingang vanuit de kamer", "Odadan giriş", "Entrada desde la cámara"],
    ["Upstream tube Ø (0 = wall)", "Rohr-Ø davor (0 = Wand)", "Buis-Ø ervoor (0 = wand)", "Önceki boru Ø (0 = duvar)", "Ø del tubo anterior (0 = pared)"],
    ["Width a", "Breite a", "Breedte a", "Genişlik a", "Anchura a"],
    ["Height b", "Höhe b", "Hoogte b", "Yükseklik b", "Altura b"],
    ["Outer diameter", "Außendurchmesser", "Buitendiameter", "Dış çap", "Diámetro exterior"],
    ["Conductance (air, 20 °C)", "Leitwert (Luft, 20 °C)", "Geleiding (lucht, 20 °C)", "İletkenlik (hava, 20 °C)", "Conductancia (aire, 20 °C)"],
    ["Tube", "Rohr", "Buis", "Boru", "Tubo"],
    ["Orifice / aperture", "Blende / Öffnung", "Opening / diafragma", "Orifis / açıklık", "Orificio / abertura"],
    ["Rectangular duct", "Rechteckkanal", "Rechthoekig kanaal", "Dikdörtgen kanal", "Conducto rectangular"],
    ["Annular gap", "Ringspalt", "Ringspleet", "Halka aralık", "Ranura anular"],
    ["Valve / baffle (given C)", "Ventil / Baffle (C gegeben)", "Klep / baffle (C gegeven)", "Vana / bölme (C verilmiş)", "Válvula / deflector (C dada)"],
    ["Smooth", "Glatt", "Glad", "Yumuşak", "Suave"],
    ["Normal", "Normal", "Normaal", "Normal", "Normal"],
    ["Sharp (mitred)", "Scharf (Gehrung)", "Scherp (verstek)", "Keskin (gönye)", "Brusco (a inglete)"],
    ["Rough vacuum: a roughing pump alone is enough.", "Grobvakuum: eine Vorpumpe allein genügt.", "Grof vacuüm: een voorpomp alleen is genoeg.", "Kaba vakum: tek başına bir kaba vakum pompası yeterlidir.", "Vacío grosero: basta con una bomba primaria."],
    ["Fine vacuum: a two-stage roughing pump or a Roots pump combination.", "Feinvakuum: eine zweistufige Vorpumpe oder eine Kombination mit Wälzkolbenpumpe.", "Fijn vacuüm: een tweetraps voorpomp of een combinatie met rootspomp.", "İnce vakum: iki kademeli bir kaba vakum pompası veya Roots pompası kombinasyonu.", "Vacío medio: una bomba primaria de dos etapas o una combinación con bomba Roots."],
    ["High vacuum: a turbomolecular, diffusion or cryopump with a roughing pump; elastomer seals are fine.", "Hochvakuum: eine Turbomolekular-, Diffusions- oder Kryopumpe mit Vorpumpe; Elastomerdichtungen sind geeignet.", "Hoog vacuüm: een turbomoleculaire, diffusie- of cryopomp met voorpomp; elastomeer-afdichtingen zijn prima.", "Yüksek vakum: kaba vakum pompalı bir turbomoleküler, difüzyon veya kriyo pompa; elastomer contalar uygundur.", "Alto vacío: una bomba turbomolecular, de difusión o criogénica con bomba primaria; las juntas de elastómero sirven."],
    ["Ultra-high vacuum: bakeable all-metal system, metal seals, ion/NEG/turbo pumps (§4.11.7).", "Ultrahochvakuum: ausheizbares Ganzmetallsystem, Metalldichtungen, Ionen-/NEG-/Turbopumpen (§4.11.7).", "Ultrahoog vacuüm: uitstookbaar volledig metalen systeem, metalen afdichtingen, ionen-/NEG-/turbopompen (§4.11.7).", "Ultra yüksek vakum: fırınlanabilir tamamen metal sistem, metal contalar, iyon/NEG/turbo pompalar (§4.11.7).", "Ultra alto vacío: sistema totalmente metálico horneable, juntas metálicas, bombas iónicas/NEG/turbo (§4.11.7)."],
    ["Extreme-high vacuum: special materials and cryogenic surfaces, beyond the scope of this tool.", "Extremes Hochvakuum: Spezialwerkstoffe und kryogene Flächen, außerhalb des Umfangs dieses Werkzeugs.", "Extreem hoog vacuüm: speciale materialen en cryogene oppervlakken, buiten het bereik van deze tool.", "Aşırı yüksek vakum: özel malzemeler ve kriyojenik yüzeyler, bu aracın kapsamı dışında.", "Vacío extremo: materiales especiales y superficies criogénicas, fuera del alcance de esta herramienta."],
    ["sccm and slm at 0 °C, 1 atm (standard conditions). 1 Pa·m³/s = 1 W.", "sccm und slm bei 0 °C, 1 atm (Normbedingungen). 1 Pa·m³/s = 1 W.", "sccm en slm bij 0 °C, 1 atm (normaalcondities). 1 Pa·m³/s = 1 W.", "sccm ve slm 0 °C, 1 atm'de (standart koşullar). 1 Pa·m³/s = 1 W.", "sccm y slm a 0 °C, 1 atm (condiciones normales). 1 Pa·m³/s = 1 W."],
    ["1 Pa·m³/(s·m²) = 1 W/m².", "1 Pa·m³/(s·m²) = 1 W/m².", "1 Pa·m³/(s·m²) = 1 W/m².", "1 Pa·m³/(s·m²) = 1 W/m².", "1 Pa·m³/(s·m²) = 1 W/m²."],
    ["s", "s", "s", "sn", "s"],
    ["min", "min", "min", "dk", "min"],
    ["h", "h", "u", "sa", "h"],
    ["days", "Tage", "dagen", "gün", "días"],
    ["d", "d", "d", "g", "d"],

    // ----- Chart, schematic -----
    ["Pressure", "Druck", "Druk", "Basınç", "Presión"],
    ["Roughing", "Vorpumpen", "Voorpompen", "Kaba vakum", "Prevacío"],
    ["High vacuum", "Hochvakuum", "Hoog vacuüm", "Yüksek vakum", "Alto vacío"],
    ["Crossover", "Umschalten", "Omschakelen", "Geçiş", "Transferencia"],
    // ----- Steps -----
    ["Gas properties ({gas}, {T})", "Gaseigenschaften ({gas}, {T})", "Gaseigenschappen ({gas}, {T})", "Gaz özellikleri ({gas}, {T})", "Propiedades del gas ({gas}, {T})"],
    ["Mean free path", "Mittlere freie Weglänge", "Gemiddelde vrije weglengte", "Ortalama serbest yol", "Recorrido libre medio"],
    ["at the target", "beim Ziel", "bij het doel", "hedefte", "en el objetivo"],
    ["Impingement rate", "Stoßrate", "Botsingsdebiet", "Çarpma hızı", "Tasa de impacto"],
    ["table 3.1", "Tabelle 3.1", "tabel 3.1", "tablo 3.1", "tabla 3.1"],
    ["Volume and inner surface", "Volumen und innere Oberfläche", "Volume en binnenoppervlak", "Hacim ve iç yüzey", "Volumen y superficie interior"],
    ["fig. 10.1, table 10.1", "Bild 10.1, Tabelle 10.1", "fig. 10.1, tabel 10.1", "şek. 10.1, tablo 10.1", "fig. 10.1, tabla 10.1"],
    ["fig. 10.2", "Bild 10.2", "fig. 10.2", "şek. 10.2", "fig. 10.2"],
    ["Total gas load", "Gesamte Gaslast", "Totale gaslast", "Toplam gaz yükü", "Carga de gas total"],
    ["Gas load at {t} of pumping", "Gaslast nach {t} Pumpzeit", "Gaslast na {t} pompen", "{t} pompalamadaki gaz yükü", "Carga de gas tras {t} de bombeo"],
    ["Line in series", "Leitung in Reihe", "Leiding in serie", "Seri hat", "Línea en serie"],
    ["Conductance of the {line} (molecular flow at the target)", "Leitwert der {line} (Molekularströmung beim Ziel)", "Geleiding van de {line} (moleculaire stroming bij het doel)", "{line} iletkenliği (hedefte moleküler akış)", "Conductancia de la {line} (flujo molecular en el objetivo)"],
    ["Pressure and required pumping speed", "Druck und erforderliches Saugvermögen", "Druk en vereiste pompsnelheid", "Basınç ve gerekli pompalama hızı", "Presión y velocidad de bombeo necesaria"],
    ["Base pressure", "Enddruck", "Einddruk", "Taban basıncı", "Presión base"],
    ["exercise 4-6", "Aufgabe 4-6", "opgave 4-6", "alıştırma 4-6", "ejercicio 4-6"],
    ["Pump-down", "Auspumpen", "Afpompen", "Boşaltma", "Evacuación"],
    ["Pressure balance", "Druckbilanz", "Drukbalans", "Basınç dengesi", "Balance de presión"],
    ["integrated numerically", "numerisch integriert", "numeriek geïntegreerd", "sayısal olarak integre edildi", "integrado numéricamente"],
    ["Pump speed near the ultimate pressure", "Saugvermögen nahe dem Enddruck", "Pompsnelheid nabij de einddruk", "Nihai basınca yakın pompa hızı", "Velocidad cerca de la presión última"],
    ["Without gas load", "Ohne Gaslast", "Zonder gaslast", "Gaz yükü olmadan", "Sin carga de gas"],
    ["Choked flow limit", "Grenze kritische Strömung", "Grens gesmoorde stroming", "Tıkanmış akış sınırı", "Límite de flujo bloqueado"],
    ["active during roughing", "beim Vorpumpen aktiv", "actief tijdens voorpompen", "kaba vakumda etkin", "activo durante el prevacío"],
    ["Time to crossover / target", "Zeit bis Umschalten / Ziel", "Tijd tot omschakelen / doel", "Geçiş / hedefe kadar süre", "Tiempo hasta transferencia / objetivo"],
    ["Wall strength (not from the book)", "Wandfestigkeit (nicht aus dem Buch)", "Wandsterkte (niet uit het boek)", "Duvar dayanımı (kitaptan değil)", "Resistencia de la pared (no procede del libro)"],
    ["Equation numbers refer to Vacuum Science and Technology (Suurmeijer, Mulder, Verhoeven).", "Gleichungsnummern beziehen sich auf Vacuum Science and Technology (Suurmeijer, Mulder, Verhoeven).", "Vergelijkingsnummers verwijzen naar Vacuum Science and Technology (Suurmeijer, Mulder, Verhoeven).", "Denklem numaraları Vacuum Science and Technology (Suurmeijer, Mulder, Verhoeven) kitabına aittir.", "Los números de ecuación remiten a Vacuum Science and Technology (Suurmeijer, Mulder, Verhoeven)."],

    // ----- Report -----
    ["Resolve the input errors before exporting.", "Beheben Sie vor dem Export die Eingabefehler.", "Los de invoerfouten op voordat u exporteert.", "Dışa aktarmadan önce girdi hatalarını giderin.", "Corrija los errores de entrada antes de exportar."],
    ["Vacuum chamber design report", "Auslegungsbericht Vakuumkammer", "Ontwerprapport vacuümkamer", "Vakum odası tasarım raporu", "Informe de diseño de la cámara de vacío"],
    ["Design checks", "Auslegungsprüfungen", "Ontwerpcontroles", "Tasarım kontrolleri", "Comprobaciones de diseño"],
    ["Design inputs", "Auslegungsdaten", "Ontwerpinvoer", "Tasarım girdileri", "Datos de diseño"],
    ["ends after", "endet nach", "eindigt na", "bitiş", "termina tras"],
    ["No", "Nein", "Nee", "Hayır", "No"],
    ["Share", "Anteil", "Aandeel", "Pay", "Proporción"],
    ["Appendix: step-by-step calculation", "Anhang: Schritt-für-Schritt-Berechnung", "Bijlage: stapsgewijze berekening", "Ek: adım adım hesaplama", "Anexo: cálculo paso a paso"],
    ["Open this design in the calculator:", "Diese Auslegung im Rechner öffnen:", "Open dit ontwerp in de calculator:", "Bu tasarımı hesaplayıcıda açın:", "Abrir este diseño en la calculadora:"],
    ["Vacuum Chamber Calculator (link with all inputs)", "Vakuumkammer-Rechner (Link mit allen Eingaben)", "Vacuümkamer-calculator (link met alle invoer)", "Vakum Odası Hesaplayıcı (tüm girdileri içeren bağlantı)", "Calculadora de cámaras de vacío (enlace con todos los datos)"],
    ["Vacuum Chamber Calculator · ehcrea.com · engineering estimate, verify critical designs", "Vakuumkammer-Rechner · ehcrea.com · technische Abschätzung, kritische Auslegungen prüfen", "Vacuümkamer-calculator · ehcrea.com · technische schatting, controleer kritische ontwerpen", "Vakum Odası Hesaplayıcı · ehcrea.com · mühendislik tahmini, kritik tasarımları doğrulayın", "Calculadora de cámaras de vacío · ehcrea.com · estimación de ingeniería, verifique los diseños críticos"],
    ["Page {i} of {n}", "Seite {i} von {n}", "Pagina {i} van {n}", "Sayfa {i} / {n}", "Página {i} de {n}"],
    ["Problem", "Problem", "Probleem", "Sorun", "Problema"],
    ["Check", "Prüfen", "Controleren", "Kontrol", "Revisar"],
    ["Note", "Hinweis", "Opmerking", "Not", "Nota"],

    // ----- Design checks -----
    ["The roughing pump cannot reach the crossover pressure of the high-vacuum pump ({p}). Use a roughing pump with a lower ultimate pressure, a Roots booster, or raise the crossover pressure.", "Die Vorpumpe erreicht den Umschaltdruck der Hochvakuumpumpe ({p}) nicht. Verwenden Sie eine Vorpumpe mit niedrigerem Enddruck, eine Wälzkolbenpumpe, oder erhöhen Sie den Umschaltdruck.", "De voorpomp haalt de omschakeldruk van de hoogvacuümpomp ({p}) niet. Gebruik een voorpomp met een lagere einddruk, een rootsbooster, of verhoog de omschakeldruk.", "Kaba vakum pompası yüksek vakum pompasının geçiş basıncına ({p}) ulaşamıyor. Daha düşük nihai basınçlı bir kaba vakum pompası veya Roots güçlendirici kullanın ya da geçiş basıncını yükseltin.", "La bomba primaria no alcanza la presión de transferencia de la bomba de alto vacío ({p}). Use una bomba primaria con menor presión última, una bomba Roots o suba la presión de transferencia."],
    ["The target pressure is not reached within the simulated time. Increase the effective pumping speed or reduce the gas load.", "Der Zieldruck wird in der simulierten Zeit nicht erreicht. Erhöhen Sie das effektive Saugvermögen oder senken Sie die Gaslast.", "De beoogde druk wordt binnen de gesimuleerde tijd niet bereikt. Verhoog de effectieve pompsnelheid of verlaag de gaslast.", "Hedef basınca simüle edilen süre içinde ulaşılamıyor. Etkin pompalama hızını artırın veya gaz yükünü azaltın.", "La presión objetivo no se alcanza en el tiempo simulado. Aumente la velocidad de bombeo efectiva o reduzca la carga de gas."],
    ["The target pressure is reached only after {t}, later than the evaluation time.", "Der Zieldruck wird erst nach {t} erreicht, später als die Pumpzeit.", "De beoogde druk wordt pas na {t} bereikt, later dan de pomptijd.", "Hedef basınca ancak {t} sonra, değerlendirme süresinden geç ulaşılıyor.", "La presión objetivo solo se alcanza tras {t}, después del tiempo de evaluación."],
    ["During the first part of the roughing the flow in the roughing line is choked (sonic); the throughput is limited to the choked flow through its narrowest section (§3.7).", "Im ersten Teil des Vorpumpens ist die Strömung in der Vorvakuumleitung kritisch (Schallgeschwindigkeit); der Durchfluss ist auf die kritische Strömung durch den engsten Querschnitt begrenzt (§3.7).", "In het eerste deel van het voorpompen is de stroming in de voorvacuümleiding gesmoord (sonisch); het debiet is begrensd tot de gesmoorde stroming door de nauwste doorsnede (§3.7).", "Kaba vakumun ilk bölümünde hattaki akış tıkanır (ses hızında); debi en dar kesitten geçen tıkanmış akışla sınırlıdır (§3.7).", "En la primera parte del prevacío el flujo en la línea está bloqueado (sónico); el caudal se limita al flujo bloqueado por su sección más estrecha (§3.7)."],
    ["The target pressure is below the working range of the high-vacuum pump: its working range ends 5 to 10 times above the ultimate pressure ({pu}) (§4.2).", "Der Zieldruck liegt unter dem Arbeitsbereich der Hochvakuumpumpe: ihr Arbeitsbereich endet 5- bis 10-mal über dem Enddruck ({pu}) (§4.2).", "De beoogde druk ligt onder het werkgebied van de hoogvacuümpomp: het werkgebied eindigt 5 tot 10 keer boven de einddruk ({pu}) (§4.2).", "Hedef basınç yüksek vakum pompasının çalışma aralığının altında: çalışma aralığı nihai basıncın ({pu}) 5 ila 10 katında biter (§4.2).", "La presión objetivo está por debajo del rango de trabajo de la bomba de alto vacío: termina de 5 a 10 veces por encima de la presión última ({pu}) (§4.2)."],
    ["The crossover pressure ({pc}) is less than 5× the ultimate pressure of the roughing pump ({pu}); its speed drops near the ultimate pressure, so roughing takes long.", "Der Umschaltdruck ({pc}) ist kleiner als das 5-Fache des Enddrucks der Vorpumpe ({pu}); ihr Saugvermögen sinkt nahe dem Enddruck, das Vorpumpen dauert daher lange.", "De omschakeldruk ({pc}) is minder dan 5× de einddruk van de voorpomp ({pu}); de snelheid daalt nabij de einddruk, dus voorpompen duurt lang.", "Geçiş basıncı ({pc}), kaba vakum pompasının nihai basıncının ({pu}) 5 katından az; hız nihai basınca yakın düştüğü için kaba vakum uzun sürer.", "La presión de transferencia ({pc}) es menor que 5× la presión última de la bomba primaria ({pu}); su velocidad cae cerca de la presión última, así que el prevacío tarda."],
    ["The backing pump is too small: at the maximum working pressure the high-vacuum pump delivers {Q} and needs at least {S} of backing speed to stay below the maximum backing pressure of {pb} (exercises 4-3, 4-6).", "Die Vorpumpe ist zu klein: beim höchsten Arbeitsdruck fördert die Hochvakuumpumpe {Q} und braucht mindestens {S} Vorpumpen-Saugvermögen, um unter dem max. Vorvakuumdruck von {pb} zu bleiben (Aufgaben 4-3, 4-6).", "De voorpomp is te klein: bij de hoogste werkdruk levert de hoogvacuümpomp {Q} en is minstens {S} voorpompsnelheid nodig om onder de max. voorvacuümdruk van {pb} te blijven (opgaven 4-3, 4-6).", "Ön pompa çok küçük: en yüksek çalışma basıncında yüksek vakum pompası {Q} iletir ve {pb} maksimum ön vakum basıncının altında kalmak için en az {S} ön pompa hızı gerekir (alıştırma 4-3, 4-6).", "La bomba primaria es demasiado pequeña: a la presión de trabajo máxima la bomba de alto vacío entrega {Q} y necesita al menos {S} de velocidad de apoyo para no superar la presión de apoyo máxima de {pb} (ejercicios 4-3, 4-6)."],
    ["Sputter-ion pumps pump noble gases and methane poorly (§4.10.3); use the pumping speed for this gas.", "Ionenzerstäuberpumpen pumpen Edelgase und Methan schlecht (§4.10.3); verwenden Sie das Saugvermögen für dieses Gas.", "Ionengetterpompen pompen edelgassen en methaan slecht (§4.10.3); gebruik de pompsnelheid voor dit gas.", "Püskürtmeli iyon pompaları soy gazları ve metanı zayıf pompalar (§4.10.3); bu gaz için pompalama hızını kullanın.", "Las bombas iónicas bombean mal los gases nobles y el metano (§4.10.3); use la velocidad de bombeo para este gas."],
    ["With the process gas flowing the chamber pressure rises to {p}, above the working range of the high-vacuum pump (up to {pm}). Throttle the pump or use a larger pump.", "Mit Prozessgas steigt der Kammerdruck auf {p}, über den Arbeitsbereich der Hochvakuumpumpe (bis {pm}). Drosseln Sie die Pumpe oder verwenden Sie eine größere Pumpe.", "Met procesgas stijgt de kamerdruk tot {p}, boven het werkgebied van de hoogvacuümpomp (tot {pm}). Smoor de pomp of gebruik een grotere pomp.", "Proses gazı akarken oda basıncı {p} değerine, yüksek vakum pompasının çalışma aralığının ({pm} değerine kadar) üstüne çıkar. Pompayı kısın veya daha büyük bir pompa kullanın.", "Con el gas de proceso la presión de la cámara sube a {p}, por encima del rango de trabajo de la bomba de alto vacío (hasta {pm}). Estrangule la bomba o use una bomba mayor."],
    ["Capture pumps store the pumped gas; a continuous process gas load limits their service life or needs regular regeneration (§4.10).", "Sorptionspumpen speichern das gepumpte Gas; eine dauernde Prozessgaslast begrenzt ihre Standzeit oder erfordert regelmäßige Regeneration (§4.10).", "Vangpompen slaan het gepompte gas op; een continue procesgaslast beperkt hun standtijd of vraagt regelmatige regeneratie (§4.10).", "Tutucu pompalar pompalanan gazı depolar; sürekli proses gazı yükü servis ömrünü sınırlar veya düzenli rejenerasyon gerektirir (§4.10).", "Las bombas de captura almacenan el gas bombeado; una carga continua de gas de proceso limita su vida útil o exige regeneraciones periódicas (§4.10)."],
    ["Turbomolecular pumps have a much lower compression ratio for light gases (H₂, He); check the backing pressure for this gas (§4.9.3).", "Turbomolekularpumpen haben für leichte Gase (H₂, He) ein viel kleineres Kompressionsverhältnis; prüfen Sie den Vorvakuumdruck für dieses Gas (§4.9.3).", "Turbomoleculaire pompen hebben een veel lagere compressieverhouding voor lichte gassen (H₂, He); controleer de voorvacuümdruk voor dit gas (§4.9.3).", "Turbomoleküler pompaların hafif gazlar (H₂, He) için sıkıştırma oranı çok daha düşüktür; bu gaz için ön vakum basıncını kontrol edin (§4.9.3).", "Las bombas turbomoleculares tienen una relación de compresión mucho menor para gases ligeros (H₂, He); revise la presión de apoyo para este gas (§4.9.3)."],
    ["Sputter-ion pumps start in the 10⁻³–10⁻⁴ Pa range; their life time is inversely proportional to the pressure (§4.11.6).", "Ionenzerstäuberpumpen starten im Bereich 10⁻³–10⁻⁴ Pa; ihre Lebensdauer ist umgekehrt proportional zum Druck (§4.11.6).", "Ionengetterpompen starten in het gebied 10⁻³–10⁻⁴ Pa; hun levensduur is omgekeerd evenredig met de druk (§4.11.6).", "Püskürtmeli iyon pompaları 10⁻³–10⁻⁴ Pa aralığında devreye girer; ömürleri basınçla ters orantılıdır (§4.11.6).", "Las bombas iónicas arrancan en el rango de 10⁻³–10⁻⁴ Pa; su vida es inversamente proporcional a la presión (§4.11.6)."],
    ["The target pressure is below the working range of the roughing pump (5 to 10 times above its ultimate pressure, §4.2). Add a high-vacuum pump.", "Der Zieldruck liegt unter dem Arbeitsbereich der Vorpumpe (5- bis 10-mal über ihrem Enddruck, §4.2). Ergänzen Sie eine Hochvakuumpumpe.", "De beoogde druk ligt onder het werkgebied van de voorpomp (5 tot 10 keer boven de einddruk, §4.2). Voeg een hoogvacuümpomp toe.", "Hedef basınç kaba vakum pompasının çalışma aralığının altında (nihai basıncının 5 ila 10 katı, §4.2). Bir yüksek vakum pompası ekleyin.", "La presión objetivo está por debajo del rango de trabajo de la bomba primaria (5 a 10 veces su presión última, §4.2). Añada una bomba de alto vacío."],
    ["The pumping line limits the pump: only {pct} of the pump speed reaches the chamber. A larger pump hardly helps; a wider, shorter line does (§3.17: choose Sp smaller than C).", "Die Pumpleitung begrenzt die Pumpe: nur {pct} des Saugvermögens kommen in der Kammer an. Eine größere Pumpe hilft kaum, eine weitere, kürzere Leitung schon (§3.17: Sp kleiner als C wählen).", "De pompleiding begrenst de pomp: slechts {pct} van de pompsnelheid bereikt de kamer. Een grotere pomp helpt nauwelijks; een wijdere, kortere leiding wel (§3.17: kies Sp kleiner dan C).", "Pompalama hattı pompayı sınırlıyor: pompa hızının yalnızca {pct} kadarı odaya ulaşıyor. Daha büyük pompa pek işe yaramaz; daha geniş, daha kısa bir hat yarar (§3.17: Sp'yi C'den küçük seçin).", "La línea de bombeo limita la bomba: solo el {pct} de su velocidad llega a la cámara. Una bomba mayor apenas ayuda; una línea más ancha y corta sí (§3.17: elija Sp menor que C)."],
    ["With this pumping line no pump can reach the target: the required effective speed ({S}) exceeds the line conductance ({C}).", "Mit dieser Pumpleitung kann keine Pumpe das Ziel erreichen: das erforderliche effektive Saugvermögen ({S}) übersteigt den Leitwert der Leitung ({C}).", "Met deze pompleiding kan geen enkele pomp het doel halen: de vereiste effectieve snelheid ({S}) is groter dan de geleiding van de leiding ({C}).", "Bu hatla hiçbir pompa hedefe ulaşamaz: gerekli etkin hız ({S}) hat iletkenliğini ({C}) aşıyor.", "Con esta línea ninguna bomba alcanza el objetivo: la velocidad efectiva necesaria ({S}) supera la conductancia de la línea ({C})."],
    ["The required pump speed ({S}) exceeds the molecular conductance of the pump inlet flange ({C}); a larger flange is needed (exercise 4-5).", "Das erforderliche Saugvermögen ({S}) übersteigt den molekularen Leitwert des Einlassflansches ({C}); ein größerer Flansch ist nötig (Aufgabe 4-5).", "De vereiste pompsnelheid ({S}) is groter dan de moleculaire geleiding van de inlaatflens ({C}); een grotere flens is nodig (opgave 4-5).", "Gerekli pompa hızı ({S}), pompa giriş flanşının moleküler iletkenliğini ({C}) aşıyor; daha büyük bir flanş gerekli (alıştırma 4-5).", "La velocidad de bomba necesaria ({S}) supera la conductancia molecular de la brida de entrada ({C}); hace falta una brida mayor (ejercicio 4-5)."],
    ["Permeation through elastomer seals dominates the gas load. A double O-ring with a pumped interspace reduces it by 10³–10⁴ (§9.2.1, exercise 4-8).", "Die Permeation durch Elastomerdichtungen dominiert die Gaslast. Ein doppelter O-Ring mit abgepumptem Zwischenraum senkt sie um 10³–10⁴ (§9.2.1, Aufgabe 4-8).", "Permeatie door elastomeer-afdichtingen domineert de gaslast. Een dubbele O-ring met afgepompte tussenruimte verlaagt die met 10³–10⁴ (§9.2.1, opgave 4-8).", "Elastomer contalardan geçirgenlik gaz yüküne hâkim. Arası pompalanan çift O-ring bunu 10³–10⁴ kat azaltır (§9.2.1, alıştırma 4-8).", "La permeación a través de las juntas de elastómero domina la carga de gas. Una junta tórica doble con espacio intermedio bombeado la reduce en 10³–10⁴ (§9.2.1, ejercicio 4-8)."],
    ["Outgassing dominates the gas load, as is usual below 10⁻² Pa (table 10.1). Unbaked surfaces mainly release water vapour; cleaner surfaces, less internal area or a bakeout help most.", "Die Ausgasung dominiert die Gaslast, wie unter 10⁻² Pa üblich (Tabelle 10.1). Nicht ausgeheizte Oberflächen geben vor allem Wasserdampf ab; sauberere Oberflächen, weniger innere Fläche oder Ausheizen helfen am meisten.", "Ontgassing domineert de gaslast, zoals gebruikelijk onder 10⁻² Pa (tabel 10.1). Niet-uitgestookte oppervlakken geven vooral waterdamp af; schonere oppervlakken, minder intern oppervlak of uitstoken helpen het meest.", "Gaz salınımı, 10⁻² Pa altında olağan olduğu gibi gaz yüküne hâkim (tablo 10.1). Fırınlanmamış yüzeyler çoğunlukla su buharı salar; daha temiz yüzeyler, daha az iç alan veya fırınlama en çok yardımcı olur.", "La desgasificación domina la carga de gas, como es habitual por debajo de 10⁻² Pa (tabla 10.1). Las superficies sin hornear liberan sobre todo vapor de agua; superficies más limpias, menos área interna o un horneado ayudan más."],
    ["The leak rate dominates the gas load; check the tightness requirement (§8.2).", "Die Leckrate dominiert die Gaslast; prüfen Sie die Dichtheitsanforderung (§8.2).", "Het lekdebiet domineert de gaslast; controleer de dichtheidseis (§8.2).", "Kaçak oranı gaz yüküne hâkim; sızdırmazlık gereksinimini kontrol edin (§8.2).", "La tasa de fuga domina la carga de gas; revise el requisito de estanqueidad (§8.2)."],
    ["Ultra-high vacuum needs metal seals (ConFlat, gold or Helicoflex): a system with a single Viton O-ring barely reaches 10⁻⁷ Pa because of outgassing and permeation (§4.11.7).", "Ultrahochvakuum erfordert Metalldichtungen (ConFlat, Gold oder Helicoflex): ein System mit einem einfachen Viton-O-Ring erreicht wegen Ausgasung und Permeation kaum 10⁻⁷ Pa (§4.11.7).", "Ultrahoog vacuüm vraagt metalen afdichtingen (ConFlat, goud of Helicoflex): een systeem met één Viton O-ring haalt door ontgassing en permeatie nauwelijks 10⁻⁷ Pa (§4.11.7).", "Ultra yüksek vakum metal conta gerektirir (ConFlat, altın veya Helicoflex): tek bir Viton O-ringli sistem gaz salınımı ve geçirgenlik nedeniyle 10⁻⁷ Pa'ya zorlukla ulaşır (§4.11.7).", "El ultra alto vacío exige juntas metálicas (ConFlat, oro o Helicoflex): un sistema con una sola junta tórica de Viton apenas llega a 10⁻⁷ Pa por la desgasificación y la permeación (§4.11.7)."],
    ["Elastomer seals limit the ultimate pressure in the 10⁻⁶–10⁻⁷ Pa range; consider metal seals (§4.11.7).", "Elastomerdichtungen begrenzen den Enddruck im Bereich 10⁻⁶–10⁻⁷ Pa; erwägen Sie Metalldichtungen (§4.11.7).", "Elastomeer-afdichtingen begrenzen de einddruk in het gebied 10⁻⁶–10⁻⁷ Pa; overweeg metalen afdichtingen (§4.11.7).", "Elastomer contalar nihai basıncı 10⁻⁶–10⁻⁷ Pa aralığında sınırlar; metal contaları değerlendirin (§4.11.7).", "Las juntas de elastómero limitan la presión última en el rango de 10⁻⁶–10⁻⁷ Pa; considere juntas metálicas (§4.11.7)."],
    ["Below about 10⁻⁵ Pa a bakeout is the only practical way to reach the pressure within a reasonable time (§4.11.1, table 10.1).", "Unter etwa 10⁻⁵ Pa ist Ausheizen der einzige praktikable Weg, den Druck in vertretbarer Zeit zu erreichen (§4.11.1, Tabelle 10.1).", "Onder ongeveer 10⁻⁵ Pa is uitstoken de enige praktische manier om de druk binnen redelijke tijd te bereiken (§4.11.1, tabel 10.1).", "Yaklaşık 10⁻⁵ Pa altında, basınca makul sürede ulaşmanın tek pratik yolu fırınlamadır (§4.11.1, tablo 10.1).", "Por debajo de unos 10⁻⁵ Pa el horneado es la única forma práctica de alcanzar la presión en un tiempo razonable (§4.11.1, tabla 10.1)."],
    ["Silicone rubber has a very high permeability; Viton is preferred for high vacuum (§9.2.1).", "Silikonkautschuk hat eine sehr hohe Permeabilität; für Hochvakuum ist Viton vorzuziehen (§9.2.1).", "Siliconenrubber heeft een zeer hoge permeabiliteit; voor hoog vacuüm heeft Viton de voorkeur (§9.2.1).", "Silikon kauçuğun geçirgenliği çok yüksektir; yüksek vakum için Viton tercih edilir (§9.2.1).", "El caucho de silicona tiene una permeabilidad muy alta; para alto vacío es preferible el Viton (§9.2.1)."],
    ["The 1/t outgassing law holds for the first tens of hours (figure 10.1); later the decay is usually slower, so long pumping times are optimistic.", "Das 1/t-Gesetz der Ausgasung gilt für die ersten zehn bis einige zehn Stunden (Bild 10.1); danach ist der Abfall meist langsamer, lange Pumpzeiten sind also optimistisch.", "De 1/t-wet voor ontgassing geldt voor de eerste tientallen uren (figuur 10.1); daarna verloopt de afname meestal trager, dus lange pomptijden zijn optimistisch.", "1/t gaz salınımı yasası ilk birkaç on saat için geçerlidir (şekil 10.1); sonrasında azalma genellikle daha yavaştır, bu yüzden uzun pompalama süreleri iyimserdir.", "La ley de desgasificación 1/t vale para las primeras decenas de horas (figura 10.1); después la caída suele ser más lenta, así que los tiempos largos son optimistas."],
    ["The bakeout temperature exceeds the limit of {mat} (about {t}).", "Die Ausheiztemperatur übersteigt die Grenze von {mat} (etwa {t}).", "De uitstooktemperatuur overschrijdt de grens van {mat} (ongeveer {t}).", "Fırınlama sıcaklığı {mat} sınırını (yaklaşık {t}) aşıyor.", "La temperatura de horneado supera el límite de {mat} (unos {t})."],
    ["A bakeout below about 120 °C removes little adsorbed water; 150–250 °C is usual, 350–400 °C for the first bakeout of UHV systems (§4.11.7).", "Ausheizen unter etwa 120 °C entfernt wenig adsorbiertes Wasser; 150–250 °C ist üblich, 350–400 °C beim ersten Ausheizen von UHV-Systemen (§4.11.7).", "Uitstoken onder ongeveer 120 °C verwijdert weinig geadsorbeerd water; 150–250 °C is gebruikelijk, 350–400 °C bij het eerste uitstoken van UHV-systemen (§4.11.7).", "Yaklaşık 120 °C altındaki fırınlama az miktarda adsorbe su uzaklaştırır; 150–250 °C olağandır, UHV sistemlerin ilk fırınlamasında 350–400 °C (§4.11.7).", "Un horneado por debajo de unos 120 °C elimina poca agua adsorbida; lo habitual es 150–250 °C, y 350–400 °C en el primer horneado de sistemas UHV (§4.11.7)."],
    ["{name} may collapse: its buckling pressure is {sf}× the atmospheric load, below the required safety factor of {req}.", "{name} kann einbeulen: sein Beuldruck ist das {sf}-Fache der atmosphärischen Last, unter dem geforderten Sicherheitsfaktor von {req}.", "{name} kan bezwijken: de knikdruk is {sf}× de atmosferische belasting, onder de vereiste veiligheidsfactor van {req}.", "{name} çökebilir: burkulma basıncı atmosferik yükün {sf} katı, gerekli {req} güvenlik katsayısının altında.", "{name} puede colapsar: su presión de pandeo es {sf}× la carga atmosférica, por debajo del factor de seguridad requerido de {req}."],
    ["{name}: bending stress {s} exceeds the allowed {a} (yield / safety factor).", "{name}: Biegespannung {s} übersteigt die zulässigen {a} (Streckgrenze / Sicherheitsfaktor).", "{name}: buigspanning {s} is groter dan de toelaatbare {a} (vloeigrens / veiligheidsfactor).", "{name}: eğilme gerilmesi {s}, izin verilen {a} değerini aşıyor (akma / güvenlik katsayısı).", "{name}: la tensión de flexión {s} supera la admisible {a} (límite elástico / factor de seguridad)."],
    ["{name}: the deflection is more than half the thickness; plate theory overestimates it (membrane action), but check flange flatness and seals.", "{name}: die Durchbiegung beträgt mehr als die halbe Dicke; die Plattentheorie überschätzt sie (Membranwirkung), prüfen Sie aber Flanschebenheit und Dichtungen.", "{name}: de doorbuiging is meer dan de halve dikte; de plaattheorie overschat die (membraanwerking), maar controleer de vlakheid van flenzen en afdichtingen.", "{name}: sehim kalınlığın yarısından fazla; plaka teorisi bunu fazla tahmin eder (membran etkisi), ancak flanş düzlüğünü ve contaları kontrol edin.", "{name}: la flecha supera la mitad del espesor; la teoría de placas la sobrestima (efecto membrana), pero revise la planitud de las bridas y las juntas."],
    ["Welding lowers the strength of aluminium 6061-T6 in the heat-affected zone to about {r}; aluminium chambers also have a low collapse strength (§10.1).", "Schweißen senkt die Festigkeit von Aluminium 6061-T6 in der Wärmeeinflusszone auf etwa {r}; Aluminiumkammern haben zudem eine geringe Beulfestigkeit (§10.1).", "Lassen verlaagt de sterkte van aluminium 6061-T6 in de warmte-beïnvloede zone tot ongeveer {r}; aluminium kamers hebben bovendien een lage instortsterkte (§10.1).", "Kaynak, 6061-T6 alüminyumun ısıdan etkilenen bölgedeki dayanımını yaklaşık {r} değerine düşürür; alüminyum odaların çökme dayanımı da düşüktür (§10.1).", "La soldadura reduce la resistencia del aluminio 6061-T6 en la zona afectada térmicamente a unos {r}; las cámaras de aluminio también tienen baja resistencia al colapso (§10.1)."],
    ["Unalloyed steel corrodes; rusty surfaces outgas strongly. Use a protective coating or plating, or stainless steel for high vacuum (§10.10).", "Unlegierter Stahl korrodiert; rostige Oberflächen gasen stark aus. Verwenden Sie eine Schutzbeschichtung oder Galvanik, oder Edelstahl für Hochvakuum (§10.10).", "Ongelegeerd staal corrodeert; roestige oppervlakken ontgassen sterk. Gebruik een beschermende coating of galvanische laag, of roestvast staal voor hoog vacuüm (§10.10).", "Alaşımsız çelik korozyona uğrar; paslı yüzeyler yoğun gaz salar. Koruyucu kaplama veya galvaniz ya da yüksek vakum için paslanmaz çelik kullanın (§10.10).", "El acero sin alear se corroe; las superficies oxidadas desgasifican mucho. Use un recubrimiento protector o galvánico, o acero inoxidable para alto vacío (§10.10)."],
    // ----- Structure parts -----
    ["Front/back walls (L × H)", "Vorder-/Rückwand (L × H)", "Voor-/achterwand (L × H)", "Ön/arka duvarlar (L × H)", "Paredes frontal/trasera (L × H)"],
    ["Side walls (W × H)", "Seitenwände (B × H)", "Zijwanden (B × H)", "Yan duvarlar (W × H)", "Paredes laterales (An × Al)"],
    ["Bottom (L × W)", "Boden (L × B)", "Bodem (L × B)", "Taban (L × W)", "Fondo (L × An)"],
    ["Lid (L × W)", "Deckel (L × B)", "Deksel (L × B)", "Kapak (L × W)", "Tapa (L × An)"],
    ["Cylindrical shell", "Zylindermantel", "Cilindermantel", "Silindirik gövde", "Envolvente cilíndrica"],
    ["Spherical shell", "Kugelschale", "Bolschaal", "Küresel kabuk", "Envolvente esférica"],
    ["End plates", "Stirnplatten", "Eindplaten", "Uç plakalar", "Tapas"],

    // ----- Gases -----
    ["Air", "Luft", "Lucht", "Hava", "Aire"],
    ["Nitrogen", "Stickstoff", "Stikstof", "Azot", "Nitrógeno"],
    ["Oxygen", "Sauerstoff", "Zuurstof", "Oksijen", "Oxígeno"],
    ["Water vapour", "Wasserdampf", "Waterdamp", "Su buharı", "Vapor de agua"],
    ["Hydrogen", "Wasserstoff", "Waterstof", "Hidrojen", "Hidrógeno"],
    ["Helium", "Helium", "Helium", "Helyum", "Helio"],
    ["Neon", "Neon", "Neon", "Neon", "Neón"],
    ["Argon", "Argon", "Argon", "Argon", "Argón"],
    ["Krypton", "Krypton", "Krypton", "Kripton", "Criptón"],
    ["Xenon", "Xenon", "Xenon", "Ksenon", "Xenón"],
    ["Carbon monoxide", "Kohlenmonoxid", "Koolmonoxide", "Karbon monoksit", "Monóxido de carbono"],
    ["Carbon dioxide", "Kohlendioxid", "Kooldioxide", "Karbon dioksit", "Dióxido de carbono"],
    ["Methane", "Methan", "Methaan", "Metan", "Metano"],

    // ----- Surfaces, outgassing materials, seals -----
    ["Ultraclean surface", "Ultrareine Oberfläche", "Ultraschoon oppervlak", "Ultra temiz yüzey", "Superficie ultralimpia"],
    ["Normally cleaned surface", "Normal gereinigte Oberfläche", "Normaal gereinigd oppervlak", "Normal temizlenmiş yüzey", "Superficie con limpieza normal"],
    ["Rusty surface", "Rostige Oberfläche", "Roestig oppervlak", "Paslı yüzey", "Superficie oxidada"],
    ["Stainless steel 304/316", "Edelstahl 304/316", "Roestvast staal 304/316", "Paslanmaz çelik 304/316", "Acero inoxidable 304/316"],
    ["Aluminium", "Aluminium", "Aluminium", "Alüminyum", "Aluminio"],
    ["Copper (OFHC)", "Kupfer (OFHC)", "Koper (OFHC)", "Bakır (OFHC)", "Cobre (OFHC)"],
    ["Titanium", "Titan", "Titanium", "Titanyum", "Titanio"],
    ["Mild steel (coated)", "Baustahl (beschichtet)", "Constructiestaal (gecoat)", "Yumuşak çelik (kaplamalı)", "Acero al carbono (recubierto)"],
    ["Borosilicate glass (Pyrex)", "Borosilikatglas (Pyrex)", "Borosilicaatglas (Pyrex)", "Borosilikat cam (Pyrex)", "Vidrio de borosilicato (Pyrex)"],
    ["Quartz", "Quarz", "Kwarts", "Kuvars", "Cuarzo"],
    ["Alumina ceramic", "Aluminiumoxidkeramik", "Aluminiumoxidekeramiek", "Alümina seramik", "Cerámica de alúmina"],
    ["Viton (FKM)", "Viton (FKM)", "Viton (FKM)", "Viton (FKM)", "Viton (FKM)"],
    ["PTFE (Teflon)", "PTFE (Teflon)", "PTFE (Teflon)", "PTFE (Teflon)", "PTFE (Teflón)"],
    ["Kapton / Vespel (polyimide)", "Kapton / Vespel (Polyimid)", "Kapton / Vespel (polyimide)", "Kapton / Vespel (poliimid)", "Kapton / Vespel (poliimida)"],
    ["Epoxy (Torr Seal, Stycast)", "Epoxid (Torr Seal, Stycast)", "Epoxy (Torr Seal, Stycast)", "Epoksi (Torr Seal, Stycast)", "Epoxi (Torr Seal, Stycast)"],
    ["Perbunan (NBR)", "Perbunan (NBR)", "Perbunan (NBR)", "Perbunan (NBR)", "Perbunan (NBR)"],
    ["Silicone rubber", "Silikonkautschuk", "Siliconenrubber", "Silikon kauçuk", "Caucho de silicona"],
    ["Custom", "Benutzerdefiniert", "Aangepast", "Özel", "Personalizado"],
    ["Butyl rubber (IIR)", "Butylkautschuk (IIR)", "Butylrubber (IIR)", "Butil kauçuk (IIR)", "Caucho butílico (IIR)"],
    ["Neoprene (CR)", "Neopren (CR)", "Neopreen (CR)", "Neopren (CR)", "Neopreno (CR)"],
    ["Kalrez (FFKM)", "Kalrez (FFKM)", "Kalrez (FFKM)", "Kalrez (FFKM)", "Kalrez (FFKM)"],

    // ----- Pumps -----
    ["Rotary-vane pump, two-stage", "Drehschieberpumpe, zweistufig", "Schottenpomp, tweetraps", "Döner kanatlı pompa, iki kademeli", "Bomba rotativa de paletas, dos etapas"],
    ["Rotary-vane pump, single-stage", "Drehschieberpumpe, einstufig", "Schottenpomp, eentraps", "Döner kanatlı pompa, tek kademeli", "Bomba rotativa de paletas, una etapa"],
    ["Scroll pump", "Scrollpumpe", "Scrollpomp", "Scroll pompa", "Bomba scroll"],
    ["Screw pump", "Schraubenpumpe", "Schroefpomp", "Vidalı pompa", "Bomba de tornillo"],
    ["Roots-claw pump", "Klauenpumpe", "Klauwpomp", "Pençeli (claw) pompa", "Bomba de garras"],
    ["Multistage Roots pump", "Mehrstufige Wälzkolbenpumpe", "Meertraps rootspomp", "Çok kademeli Roots pompası", "Bomba Roots multietapa"],
    ["Piston pump, four-stage", "Kolbenpumpe, vierstufig", "Zuigerpomp, viertraps", "Pistonlu pompa, dört kademeli", "Bomba de pistón, cuatro etapas"],
    ["Diaphragm pump, four-stage", "Membranpumpe, vierstufig", "Membraanpomp, viertraps", "Diyafram pompa, dört kademeli", "Bomba de membrana, cuatro etapas"],
    ["Liquid ring pump", "Flüssigkeitsringpumpe", "Vloeistofringpomp", "Sıvı halkalı pompa", "Bomba de anillo líquido"],
    ["Turbo pumping station (TMP + backing pump)", "Turbopumpstand (TMP + Vorpumpe)", "Turbopompstation (TMP + voorpomp)", "Turbo pompa istasyonu (TMP + ön pompa)", "Grupo de bombeo turbo (TMP + bomba primaria)"],
    ["Custom roughing pump", "Benutzerdefinierte Vorpumpe", "Aangepaste voorpomp", "Özel kaba vakum pompası", "Bomba primaria personalizada"],
    ["Roots pump (single-stage)", "Wälzkolbenpumpe (einstufig)", "Rootspomp (eentraps)", "Roots pompası (tek kademeli)", "Bomba Roots (una etapa)"],
    ["None (roughing pump only)", "Keine (nur Vorpumpe)", "Geen (alleen voorpomp)", "Yok (yalnızca kaba vakum pompası)", "Ninguna (solo bomba primaria)"],
    ["Turbomolecular pump", "Turbomolekularpumpe", "Turbomoleculaire pomp", "Turbomoleküler pompa", "Bomba turbomolecular"],
    ["Hybrid molecular pump", "Hybrid-Molekularpumpe", "Hybride moleculaire pomp", "Hibrit moleküler pompa", "Bomba molecular híbrida"],
    ["Molecular drag pump", "Molekularpumpe (Holweck/Gaede)", "Moleculaire sleeppomp", "Moleküler sürükleme pompası", "Bomba molecular de arrastre"],
    ["Diffusion pump + LN₂ trap", "Diffusionspumpe + LN₂-Kühlfalle", "Diffusiepomp + LN₂-koudeval", "Difüzyon pompası + LN₂ tuzağı", "Bomba de difusión + trampa de LN₂"],
    ["Cryopump", "Kryopumpe", "Cryopomp", "Kriyo pompa", "Criobomba"],
    ["Sputter-ion pump", "Ionenzerstäuberpumpe", "Ionengetterpomp", "Püskürtmeli iyon pompası", "Bomba iónica"],
    ["Non-evaporable getter (NEG)", "Nicht verdampfbarer Getter (NEG)", "Niet-verdampbare getter (NEG)", "Buharlaşmayan getter (NEG)", "Getter no evaporable (NEG)"],
    ["Titanium sublimation pump", "Titansublimationspumpe", "Titaniumsublimatiepomp", "Titanyum süblimasyon pompası", "Bomba de sublimación de titanio"],
    ["Custom high-vacuum pump", "Benutzerdefinierte Hochvakuumpumpe", "Aangepaste hoogvacuümpomp", "Özel yüksek vakum pompası", "Bomba de alto vacío personalizada"],

    // ----- Vacuum ranges -----
    ["Rough vacuum", "Grobvakuum", "Grof vacuüm", "Kaba vakum", "Vacío grosero"],
    ["Fine vacuum", "Feinvakuum", "Fijn vacuüm", "İnce vakum", "Vacío medio"],
    ["Ultra-high vacuum", "Ultrahochvakuum", "Ultrahoog vacuüm", "Ultra yüksek vakum", "Ultra alto vacío"],
    ["Extreme-high vacuum", "Extremes Hochvakuum", "Extreem hoog vacuüm", "Aşırı yüksek vakum", "Vacío extremo"],

    // ----- Structural materials -----
    ["Stainless steel 304L", "Edelstahl 304L", "Roestvast staal 304L", "Paslanmaz çelik 304L", "Acero inoxidable 304L"],
    ["Stainless steel 316L", "Edelstahl 316L", "Roestvast staal 316L", "Paslanmaz çelik 316L", "Acero inoxidable 316L"],
    ["Aluminium 6061-T6", "Aluminium 6061-T6", "Aluminium 6061-T6", "Alüminyum 6061-T6", "Aluminio 6061-T6"],
    ["Aluminium 5083-O", "Aluminium 5083-O", "Aluminium 5083-O", "Alüminyum 5083-O", "Aluminio 5083-O"],
    ["Mild steel S235", "Baustahl S235", "Constructiestaal S235", "Yapı çeliği S235", "Acero S235"],
    ["Copper OFHC (annealed)", "Kupfer OFHC (weichgeglüht)", "Koper OFHC (gegloeid)", "Bakır OFHC (tavlanmış)", "Cobre OFHC (recocido)"],
    ["Titanium grade 2", "Titan Grade 2", "Titanium grade 2", "Titanyum grade 2", "Titanio grado 2"],

    // ----- Source notes -----
    ["App. D: 10⁻⁶–10⁻⁴ unbaked, 10⁻¹¹–10⁻⁸ baked; exercise 4-6 uses 10⁻⁹", "Anh. D: 10⁻⁶–10⁻⁴ nicht ausgeheizt, 10⁻¹¹–10⁻⁸ ausgeheizt; Aufgabe 4-6 verwendet 10⁻⁹", "Bijl. D: 10⁻⁶–10⁻⁴ niet uitgestookt, 10⁻¹¹–10⁻⁸ uitgestookt; opgave 4-6 gebruikt 10⁻⁹", "Ek D: fırınlanmamış 10⁻⁶–10⁻⁴, fırınlanmış 10⁻¹¹–10⁻⁸; alıştırma 4-6'da 10⁻⁹", "Ap. D: 10⁻⁶–10⁻⁴ sin hornear, 10⁻¹¹–10⁻⁸ horneado; el ejercicio 4-6 usa 10⁻⁹"],
    ["App. D: ≈10⁻⁶ unbaked, ≈10⁻¹⁰ baked", "Anh. D: ≈10⁻⁶ nicht ausgeheizt, ≈10⁻¹⁰ ausgeheizt", "Bijl. D: ≈10⁻⁶ niet uitgestookt, ≈10⁻¹⁰ uitgestookt", "Ek D: fırınlanmamış ≈10⁻⁶, fırınlanmış ≈10⁻¹⁰", "Ap. D: ≈10⁻⁶ sin hornear, ≈10⁻¹⁰ horneado"],
    ["App. D: 10⁻⁷–10⁻⁵ unbaked, 10⁻¹¹–10⁻⁸ baked", "Anh. D: 10⁻⁷–10⁻⁵ nicht ausgeheizt, 10⁻¹¹–10⁻⁸ ausgeheizt", "Bijl. D: 10⁻⁷–10⁻⁵ niet uitgestookt, 10⁻¹¹–10⁻⁸ uitgestookt", "Ek D: fırınlanmamış 10⁻⁷–10⁻⁵, fırınlanmış 10⁻¹¹–10⁻⁸", "Ap. D: 10⁻⁷–10⁻⁵ sin hornear, 10⁻¹¹–10⁻⁸ horneado"],
    ["App. D: < 10⁻⁹ baked", "Anh. D: < 10⁻⁹ ausgeheizt", "Bijl. D: < 10⁻⁹ uitgestookt", "Ek D: fırınlanmış < 10⁻⁹", "Ap. D: < 10⁻⁹ horneado"],
    ["Book §10.10: rusty steel outgasses strongly; protective coatings limit the bakeout", "Buch §10.10: rostiger Stahl gast stark aus; Schutzschichten begrenzen das Ausheizen", "Boek §10.10: roestig staal ontgast sterk; beschermlagen beperken het uitstoken", "Kitap §10.10: paslı çelik yoğun gaz salar; koruyucu kaplamalar fırınlamayı sınırlar", "Libro §10.10: el acero oxidado desgasifica mucho; los recubrimientos limitan el horneado"],
    ["Figure 10.2 curve d; App. D: ≈10⁻⁷ baked", "Bild 10.2 Kurve d; Anh. D: ≈10⁻⁷ ausgeheizt", "Figuur 10.2 curve d; bijl. D: ≈10⁻⁷ uitgestookt", "Şekil 10.2 eğri d; Ek D: fırınlanmış ≈10⁻⁷", "Figura 10.2 curva d; ap. D: ≈10⁻⁷ horneado"],
    ["App. D: 10⁻⁸–10⁻⁶ baked", "Anh. D: 10⁻⁸–10⁻⁶ ausgeheizt", "Bijl. D: 10⁻⁸–10⁻⁶ uitgestookt", "Ek D: fırınlanmış 10⁻⁸–10⁻⁶", "Ap. D: 10⁻⁸–10⁻⁶ horneado"],
    ["Figure 10.2 curve c (Degussit); App. D: 10⁻⁹–10⁻⁶ baked", "Bild 10.2 Kurve c (Degussit); Anh. D: 10⁻⁹–10⁻⁶ ausgeheizt", "Figuur 10.2 curve c (Degussit); bijl. D: 10⁻⁹–10⁻⁶ uitgestookt", "Şekil 10.2 eğri c (Degussit); Ek D: fırınlanmış 10⁻⁹–10⁻⁶", "Figura 10.2 curva c (Degussit); ap. D: 10⁻⁹–10⁻⁶ horneado"],
    ["Figure 10.2 group II; App. D: 10⁻⁵ baked; max. 150 °C under compression", "Bild 10.2 Gruppe II; Anh. D: 10⁻⁵ ausgeheizt; max. 150 °C unter Verpressung", "Figuur 10.2 groep II; bijl. D: 10⁻⁵ uitgestookt; max. 150 °C onder samendrukking", "Şekil 10.2 grup II; Ek D: fırınlanmış 10⁻⁵; sıkıştırma altında maks. 150 °C", "Figura 10.2 grupo II; ap. D: 10⁻⁵ horneado; máx. 150 °C comprimido"],
    ["Figure 10.2 group II; App. D: 10⁻⁸ baked", "Bild 10.2 Gruppe II; Anh. D: 10⁻⁸ ausgeheizt", "Figuur 10.2 groep II; bijl. D: 10⁻⁸ uitgestookt", "Şekil 10.2 grup II; Ek D: fırınlanmış 10⁻⁸", "Figura 10.2 grupo II; ap. D: 10⁻⁸ horneado"],
    ["Figure 10.2 group II", "Bild 10.2 Gruppe II", "Figuur 10.2 groep II", "Şekil 10.2 grup II", "Figura 10.2 grupo II"],
    ["Figure 10.2 group II; table 10.3: Stycast 140 °C for continuous use", "Bild 10.2 Gruppe II; Tabelle 10.3: Stycast 140 °C im Dauerbetrieb", "Figuur 10.2 groep II; tabel 10.3: Stycast 140 °C bij continu gebruik", "Şekil 10.2 grup II; tablo 10.3: sürekli kullanımda Stycast 140 °C", "Figura 10.2 grupo II; tabla 10.3: Stycast 140 °C en uso continuo"],
    ["Figure 10.2 group I; max. ≈80 °C", "Bild 10.2 Gruppe I; max. ≈80 °C", "Figuur 10.2 groep I; max. ≈80 °C", "Şekil 10.2 grup I; maks. ≈80 °C", "Figura 10.2 grupo I; máx. ≈80 °C"],
    ["Figure 10.2 group I", "Bild 10.2 Gruppe I", "Figuur 10.2 groep I", "Şekil 10.2 grup I", "Figura 10.2 grupo I"],
    ["Figure 10.3 (air, 60 % RH); §4.11.1: a Ø100 mm Viton O-ring lets ≈1.5·10⁻⁷ Pa·m³/s through", "Bild 10.3 (Luft, 60 % r. F.); §4.11.1: ein Viton-O-Ring Ø100 mm lässt ≈1,5·10⁻⁷ Pa·m³/s durch", "Figuur 10.3 (lucht, 60 % RV); §4.11.1: een Viton O-ring Ø100 mm laat ≈1,5·10⁻⁷ Pa·m³/s door", "Şekil 10.3 (hava, %60 BN); §4.11.1: Ø100 mm Viton O-ring ≈1,5·10⁻⁷ Pa·m³/s geçirir", "Figura 10.3 (aire, 60 % HR); §4.11.1: una junta tórica de Viton de Ø100 mm deja pasar ≈1,5·10⁻⁷ Pa·m³/s"],
    ["Table 10.2, figure 10.3", "Tabelle 10.2, Bild 10.3", "Tabel 10.2, figuur 10.3", "Tablo 10.2, şekil 10.3", "Tabla 10.2, figura 10.3"],
    ["Table 10.2, figure 10.3; exercise 4-8: 10⁻⁴ Pa·m³/s per metre of O-ring", "Tabelle 10.2, Bild 10.3; Aufgabe 4-8: 10⁻⁴ Pa·m³/s je Meter O-Ring", "Tabel 10.2, figuur 10.3; opgave 4-8: 10⁻⁴ Pa·m³/s per meter O-ring", "Tablo 10.2, şekil 10.3; alıştırma 4-8: O-ringin metresi başına 10⁻⁴ Pa·m³/s", "Tabla 10.2, figura 10.3; ejercicio 4-8: 10⁻⁴ Pa·m³/s por metro de junta tórica"],
    ["Table 10.2", "Tabelle 10.2", "Tabel 10.2", "Tablo 10.2", "Tabla 10.2"],
    ["Appendix D", "Anhang D", "Bijlage D", "Ek D", "Apéndice D"],
    ["Appendix D; cold flow under compression", "Anhang D; kaltes Fließen unter Verpressung", "Bijlage D; koude vloei onder samendrukking", "Ek D; sıkıştırma altında soğuk akma", "Apéndice D; fluencia en frío al comprimirse"],
    ["Appendix D: like Viton, bakeable to ≈300 °C, high water release; permeation taken as Viton", "Anhang D: wie Viton, ausheizbar bis ≈300 °C, hohe Wasserabgabe; Permeation wie Viton angenommen", "Bijlage D: als Viton, uitstookbaar tot ≈300 °C, hoge waterafgifte; permeatie gelijk aan Viton genomen", "Ek D: Viton gibi, ≈300 °C'ye kadar fırınlanabilir, yüksek su salınımı; geçirgenlik Viton olarak alındı", "Apéndice D: como el Viton, horneable hasta ≈300 °C, alta liberación de agua; permeación tomada como la del Viton"],
    ["Approximation: the station is treated as one pump; used to rough capture pumps", "Näherung: der Pumpstand wird als eine Pumpe behandelt; dient zum Vorpumpen von Sorptionspumpen", "Benadering: het station wordt als één pomp behandeld; gebruikt om vangpompen voor te pompen", "Yaklaşım: istasyon tek pompa olarak ele alınır; tutucu pompaların kaba vakumu için kullanılır", "Aproximación: el grupo se trata como una sola bomba; sirve para el prevacío de bombas de captura"],

    // ----- Presets -----
    ["Laboratory high-vacuum chamber (turbo + scroll)", "Labor-Hochvakuumkammer (Turbo + Scroll)", "Laboratorium-hoogvacuümkamer (turbo + scroll)", "Laboratuvar yüksek vakum odası (turbo + scroll)", "Cámara de alto vacío de laboratorio (turbo + scroll)"],
    ["Book §3.17: leak valve, 50 mm pump line", "Buch §3.17: Dosierventil, 50-mm-Pumpleitung", "Boek §3.17: doseerventiel, pompleiding 50 mm", "Kitap §3.17: dozaj vanası, 50 mm pompa hattı", "Libro §3.17: válvula dosificadora, línea de 50 mm"],
    ["Exercise 4-8: vessel with two silicone-sealed doors", "Aufgabe 4-8: Kessel mit zwei silikongedichteten Türen", "Opgave 4-8: vat met twee met siliconen afgedichte deuren", "Alıştırma 4-8: silikon contalı iki kapılı kap", "Ejercicio 4-8: recipiente con dos puertas con juntas de silicona"],
    ["Load-lock (fast cycling)", "Schleuse (schnelle Zyklen)", "Sluis (snelle cycli)", "Yükleme kilidi (hızlı çevrim)", "Esclusa de carga (ciclos rápidos)"],
    ["UHV surface-science sphere (ion pump, baked)", "UHV-Kugelkammer Oberflächenphysik (Ionenpumpe, ausgeheizt)", "UHV-bolkamer oppervlaktefysica (ionenpomp, uitgestookt)", "UHV yüzey bilimi küresi (iyon pompası, fırınlanmış)", "Esfera UHV de ciencia de superficies (bomba iónica, horneada)"],
    ["Sputter coater (cryopump, argon process)", "Sputteranlage (Kryopumpe, Argonprozess)", "Sputtercoater (cryopomp, argonproces)", "Püskürtme kaplama (kriyo pompa, argon prosesi)", "Recubridora por pulverización (criobomba, proceso con argón)"],
    ["Thermal-vacuum (space simulation) chamber", "Thermalvakuumkammer (Weltraumsimulation)", "Thermisch-vacuümkamer (ruimtesimulatie)", "Termal vakum (uzay simülasyonu) odası", "Cámara termovacío (simulación espacial)"],
    ["Vacuum furnace (diffusion pump + Roots)", "Vakuumofen (Diffusionspumpe + Roots)", "Vacuümoven (diffusiepomp + roots)", "Vakum fırını (difüzyon pompası + Roots)", "Horno de vacío (bomba de difusión + Roots)"],
    ["Book examples", "Beispiele aus dem Buch", "Voorbeelden uit het boek", "Kitaptaki örnekler", "Ejemplos del libro"],
    ["Lab & research", "Labor & Forschung", "Lab & onderzoek", "Laboratuvar & araştırma", "Laboratorio e investigación"],
    ["Industrial", "Industrie", "Industrieel", "Endüstriyel", "Industrial"],
    ["Hobby / maker", "Hobby / Maker", "Hobby / maker", "Hobi / maker", "Afición / maker"],
    ["Resin degassing pot (single-stage pump)", "Harz-Entgasungstopf (einstufige Pumpe)", "Hars-ontgassingspot (eentrapspomp)", "Reçine gaz alma kabı (tek kademeli pompa)", "Olla de desgasificación de resina (bomba de una etapa)"],
    ["Rough vacuum only. The process gas load stands for the air and moisture released by the resin.", "Nur Grobvakuum. Die Prozessgaslast steht für die vom Harz freigesetzte Luft und Feuchte.", "Alleen grofvacuüm. De procesgaslast staat voor de lucht en het vocht die de hars afgeeft.", "Yalnızca kaba vakum. Proses gaz yükü, reçinenin saldığı hava ve nemi temsil eder.", "Solo vacío primario. La carga de gas de proceso representa el aire y la humedad que libera la resina."],
    ["Freeze dryer (benchtop, ice condenser)", "Gefriertrockner (Tischgerät, Eiskondensator)", "Vriesdroger (tafelmodel, ijscondensor)", "Dondurarak kurutucu (masaüstü, buz kondenseri)", "Liofilizador (de sobremesa, condensador de hielo)"],
    ["The ice condenser traps the water vapour; the process load is the vapour that slips past it plus released air.", "Der Eiskondensator fängt den Wasserdampf ab; die Prozesslast ist der durchschlüpfende Dampf plus freigesetzte Luft.", "De ijscondensor vangt de waterdamp; de proceslast is de damp die erlangs glipt plus vrijgekomen lucht.", "Buz kondenseri su buharını tutar; proses yükü, ondan kaçan buhar ile açığa çıkan havadır.", "El condensador de hielo atrapa el vapor de agua; la carga de proceso es el vapor que se escapa más el aire liberado."],
    ["Glovebox antechamber (pump–purge cycle)", "Glovebox-Schleuse (Pump-Spül-Zyklus)", "Handschoenkast-sluis (pomp-spoelcyclus)", "Eldiven kutusu ön odası (pompala–süpür döngüsü)", "Antecámara de caja de guantes (ciclo de bombeo y purga)"],
    ["Only the time to pump down matters: one evacuation of the antechamber to 10 Pa before back-filling with argon.", "Nur die Auspumpzeit zählt: einmaliges Evakuieren der Schleuse auf 10 Pa vor dem Fluten mit Argon.", "Alleen de afpomptijd telt: één keer de sluis afpompen tot 10 Pa voordat met argon wordt bijgevuld.", "Yalnızca boşaltma süresi önemlidir: ön oda argonla doldurulmadan önce bir kez 10 Pa'ya boşaltılır.", "Solo importa el tiempo de evacuación: una evacuación de la antecámara a 10 Pa antes de llenarla con argón."],
    ["Electron-microscope column (ion pump)", "Elektronenmikroskop-Säule (Ionenpumpe)", "Elektronenmicroscoopkolom (ionenpomp)", "Elektron mikroskobu kolonu (iyon pompası)", "Columna de microscopio electrónico (bomba iónica)"],
    ["Small volume, metal-sealed (CF) flanges: a turbo pumping station roughs the column, then a small ion pump holds it.", "Kleines Volumen, metallgedichtete (CF-)Flansche: ein Turbopumpstand pumpt die Säule vor, dann hält eine kleine Ionenpumpe das Vakuum.", "Klein volume, metaalgedichte (CF-)flenzen: een turbopompstation pompt de kolom voor, daarna houdt een kleine ionenpomp het vacuüm.", "Küçük hacim, metal contalı (CF) flanşlar: bir turbo pompa istasyonu kolonu ön boşaltır, ardından küçük bir iyon pompası vakumu korur.", "Volumen pequeño, bridas con junta metálica (CF): una estación de bombeo turbo hace el vacío previo y luego una pequeña bomba iónica lo mantiene."],
    ["Turbo on a long, narrow pump line (conductance-limited)", "Turbo an langer, enger Pumpleitung (leitwertbegrenzt)", "Turbo aan een lange, nauwe pompleiding (geleidingsbeperkt)", "Uzun, dar pompa hattında turbo (iletkenlik sınırlı)", "Turbo en una línea de bombeo larga y estrecha (limitada por la conductancia)"],
    ["A 300 L/s turbo behind a 40 mm × 3 m line: the line, not the pump, sets the effective speed. Try a larger diameter.", "Ein 300-L/s-Turbo hinter einer Leitung 40 mm × 3 m: die Leitung, nicht die Pumpe, bestimmt das effektive Saugvermögen. Probieren Sie einen größeren Durchmesser.", "Een turbo van 300 L/s achter een leiding van 40 mm × 3 m: de leiding, niet de pomp, bepaalt de effectieve pompsnelheid. Probeer een grotere diameter.", "40 mm × 3 m hattın arkasında 300 L/s turbo: etkin hızı pompa değil hat belirler. Daha büyük bir çap deneyin.", "Un turbo de 300 L/s tras una línea de 40 mm × 3 m: la línea, no la bomba, fija la velocidad efectiva. Pruebe un diámetro mayor."],
    ["Thermal evaporation coater (diffusion pump)", "Thermische Aufdampfanlage (Diffusionspumpe)", "Thermische opdampinstallatie (diffusiepomp)", "Termal buharlaştırma kaplama sistemi (difüzyon pompası)", "Recubridora por evaporación térmica (bomba de difusión)"],
    ["Classic box coater with an LN₂-trapped diffusion pump behind a gate valve and baffle.", "Klassische Kastenanlage mit LN₂-gekühlter Diffusionspumpe hinter Schieber und Baffle.", "Klassieke kastinstallatie met een diffusiepomp met LN₂-val achter een schuifafsluiter en baffle.", "Sürgülü vana ve bafılın arkasında LN₂ tuzaklı difüzyon pompalı klasik kutu kaplama sistemi.", "Recubridora clásica de caja con bomba de difusión con trampa de LN₂ tras una válvula de compuerta y un deflector."],
    ["Helium leak-test chamber", "Helium-Lecktestkammer", "Heliumlektestkamer", "Helyum kaçak test odası", "Cámara de prueba de fugas con helio"],
    ["Gas set to helium: light gases flow faster, so conductances are about 2.7× higher than for air. Switch to air for the pump-down.", "Gas auf Helium gesetzt: leichte Gase strömen schneller, die Leitwerte sind etwa 2,7× höher als für Luft. Für das Auspumpen auf Luft umstellen.", "Gas op helium gezet: lichte gassen stromen sneller, dus de geleidingen zijn ongeveer 2,7× hoger dan voor lucht. Kies lucht voor het afpompen.", "Gaz helyum olarak seçildi: hafif gazlar daha hızlı akar, bu yüzden iletkenlikler havaya göre yaklaşık 2,7 kat yüksektir. Boşaltma için havaya geçin.", "Gas fijado en helio: los gases ligeros fluyen más rápido, así que las conductancias son unas 2,7 veces mayores que con aire. Cambie a aire para la evacuación."],
  ];

  // Blocks with inline markup, translated as a whole (static, trusted content).
  const REPO = 'https://github.com/ehcrea/vacuum-chamber-calculator';
  const HTML = {
    about: {
      en: `<div class="about-head"><img src="icons/favicon.svg" alt=""><div><h2 id="about-title">Vacuum Chamber Calculator</h2><p>Version 1.0 · by Eren Tozlu</p></div></div>
<p>A free, browser-based tool for designing a vacuum chamber and its pumping system. It adds up the gas load from outgassing, permeation through seals and leaks, calculates the conductance of the pumping lines and the effective pumping speed, simulates the pump-down from atmosphere and checks the walls against collapse. All calculations run in your browser.</p>
<p>The formulas, material data and worked examples come from the textbook <i>Vacuum Science and Technology</i> by Bart Suurmeijer, Theo Mulder and Jan Verhoeven; equation numbers in the step-by-step calculation refer to it. The wall check uses Roark's plate formulas and the Windenburg–Trilling buckling formula. Not affiliated with or endorsed by the authors or publisher.</p>
<p>Made by Eren Tozlu. More engineering tools and projects at <a href="https://ehcrea.com" target="_blank" rel="noopener">ehcrea.com</a>.</p>
<p>Open source under the <a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT License</a>; the source code is on <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>.</p>
<div class="about-support"><p><strong>Enjoying the vacuum calculator?</strong> It is free for everyone and I keep adding features in my spare time. If it saved you time on a chamber design or helped you learn, you can support its development on Patreon. Every contribution, big or small, helps me keep building new engineering tools. Thank you!</p><a class="btn-support" href="https://www.patreon.com/ehcrea" target="_blank" rel="noopener"><span aria-hidden="true">♥</span> Support me on Patreon</a></div>
<p class="about-meta">Results are engineering estimates for concept design. Outgassing rates vary by an order of magnitude with cleaning and history; verify critical systems by measurement, and have pressure-bearing parts checked to the applicable code.</p>`,
      de: `<div class="about-head"><img src="icons/favicon.svg" alt=""><div><h2 id="about-title">Vakuumkammer-Rechner</h2><p>Version 1.0 · von Eren Tozlu</p></div></div>
<p>Ein kostenloses Browser-Werkzeug zur Auslegung einer Vakuumkammer und ihres Pumpsystems. Es summiert die Gaslast aus Ausgasung, Permeation durch Dichtungen und Lecks, berechnet den Leitwert der Pumpleitungen und das effektive Saugvermögen, simuliert das Auspumpen ab Atmosphäre und prüft die Wände gegen Einbeulen. Alle Berechnungen laufen in Ihrem Browser.</p>
<p>Formeln, Werkstoffdaten und Rechenbeispiele stammen aus dem Lehrbuch <i>Vacuum Science and Technology</i> von Bart Suurmeijer, Theo Mulder und Jan Verhoeven; die Gleichungsnummern der Schritt-für-Schritt-Berechnung beziehen sich darauf. Die Wandprüfung verwendet die Plattenformeln nach Roark und die Beulformel nach Windenburg–Trilling. Keine Verbindung zu oder Empfehlung durch die Autoren oder den Verlag.</p>
<p>Erstellt von Eren Tozlu. Weitere Engineering-Werkzeuge und Projekte auf <a href="https://ehcrea.com" target="_blank" rel="noopener">ehcrea.com</a>.</p>
<p>Open Source unter der <a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT-Lizenz</a>; der Quellcode liegt auf <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>.</p>
<div class="about-support"><p><strong>Gefällt Ihnen der Vakuumrechner?</strong> Er ist für alle kostenlos, und ich erweitere ihn in meiner Freizeit. Wenn er Ihnen bei einer Kammerauslegung Zeit gespart oder beim Lernen geholfen hat, können Sie die Weiterentwicklung auf Patreon unterstützen. Jeder Beitrag, ob groß oder klein, hilft mir, neue technische Werkzeuge zu entwickeln. Vielen Dank!</p><a class="btn-support" href="https://www.patreon.com/ehcrea" target="_blank" rel="noopener"><span aria-hidden="true">♥</span> Auf Patreon unterstützen</a></div>
<p class="about-meta">Die Ergebnisse sind technische Abschätzungen für die Konzeptphase. Ausgasungsraten schwanken je nach Reinigung und Vorgeschichte um eine Größenordnung; kritische Systeme durch Messung prüfen und drucktragende Teile nach dem geltenden Regelwerk nachweisen lassen.</p>`,
      nl: `<div class="about-head"><img src="icons/favicon.svg" alt=""><div><h2 id="about-title">Vacuümkamer-calculator</h2><p>Versie 1.0 · door Eren Tozlu</p></div></div>
<p>Een gratis browsertool voor het ontwerpen van een vacuümkamer en het pompsysteem. De tool telt de gaslast op uit ontgassing, permeatie door afdichtingen en lekken, berekent de geleiding van de pompleidingen en de effectieve pompsnelheid, simuleert het afpompen vanaf atmosfeer en controleert de wanden op bezwijken. Alle berekeningen draaien in uw browser.</p>
<p>De formules, materiaalgegevens en uitgewerkte voorbeelden komen uit het leerboek <i>Vacuum Science and Technology</i> van Bart Suurmeijer, Theo Mulder en Jan Verhoeven; de vergelijkingsnummers in de stapsgewijze berekening verwijzen daarnaar. De wandcontrole gebruikt de plaatformules van Roark en de knikformule van Windenburg–Trilling. Niet gelieerd aan of goedgekeurd door de auteurs of de uitgever.</p>
<p>Gemaakt door Eren Tozlu. Meer engineeringtools en projecten op <a href="https://ehcrea.com" target="_blank" rel="noopener">ehcrea.com</a>.</p>
<p>Open source onder de <a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT-licentie</a>; de broncode staat op <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>.</p>
<div class="about-support"><p><strong>Bevalt de vacuümcalculator?</strong> Hij is gratis voor iedereen en ik voeg in mijn vrije tijd nieuwe functies toe. Heeft hij u tijd bespaard bij een kamerontwerp of geholpen bij het leren, dan kunt u de verdere ontwikkeling steunen via Patreon. Elke bijdrage, groot of klein, helpt me nieuwe technische tools te maken. Dank u wel!</p><a class="btn-support" href="https://www.patreon.com/ehcrea" target="_blank" rel="noopener"><span aria-hidden="true">♥</span> Steun mij op Patreon</a></div>
<p class="about-meta">De resultaten zijn technische schattingen voor het conceptontwerp. Ontgassingswaarden variëren een orde van grootte met reiniging en voorgeschiedenis; controleer kritische systemen door meting en laat drukdragende delen toetsen aan de geldende norm.</p>`,
      tr: `<div class="about-head"><img src="icons/favicon.svg" alt=""><div><h2 id="about-title">Vakum Odası Hesaplayıcı</h2><p>Sürüm 1.0 · Eren Tozlu</p></div></div>
<p>Bir vakum odasını ve pompalama sistemini tasarlamak için ücretsiz, tarayıcı tabanlı bir araç. Gaz salınımı, contalardan geçirgenlik ve kaçaklardan gelen gaz yükünü toplar, pompalama hatlarının iletkenliğini ve etkin pompalama hızını hesaplar, atmosferden boşaltmayı simüle eder ve duvarları çökmeye karşı kontrol eder. Tüm hesaplamalar tarayıcınızda çalışır.</p>
<p>Formüller, malzeme verileri ve çözümlü örnekler Bart Suurmeijer, Theo Mulder ve Jan Verhoeven'in <i>Vacuum Science and Technology</i> ders kitabından alınmıştır; adım adım hesaplamadaki denklem numaraları bu kitaba aittir. Duvar kontrolü Roark plaka formüllerini ve Windenburg–Trilling burkulma formülünü kullanır. Yazarlar veya yayıncıyla bağlantılı değildir ve onlar tarafından onaylanmamıştır.</p>
<p>Eren Tozlu tarafından yapılmıştır. Daha fazla mühendislik aracı ve proje için <a href="https://ehcrea.com" target="_blank" rel="noopener">ehcrea.com</a>.</p>
<p><a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">MIT Lisansı</a> ile açık kaynaklıdır; kaynak kodu <a href="${REPO}" target="_blank" rel="noopener">GitHub</a> üzerindedir.</p>
<div class="about-support"><p><strong>Vakum hesaplayıcıyı beğendiniz mi?</strong> Herkes için ücretsiz ve boş zamanlarımda yeni özellikler eklemeye devam ediyorum. Bir oda tasarımında zaman kazandırdıysa ya da öğrenmenize yardımcı olduysa, gelişimini Patreon üzerinden destekleyebilirsiniz. Büyük ya da küçük her katkı, yeni mühendislik araçları geliştirmeye devam etmeme yardımcı olur. Teşekkürler!</p><a class="btn-support" href="https://www.patreon.com/ehcrea" target="_blank" rel="noopener"><span aria-hidden="true">♥</span> Patreon'da destek olun</a></div>
<p class="about-meta">Sonuçlar kavramsal tasarım için mühendislik tahminleridir. Gaz salınımı değerleri temizlik ve geçmişe göre bir mertebe değişir; kritik sistemleri ölçümle doğrulayın ve basınç taşıyan parçaları geçerli standarda göre kontrol ettirin.</p>`,
      es: `<div class="about-head"><img src="icons/favicon.svg" alt=""><div><h2 id="about-title">Calculadora de cámaras de vacío</h2><p>Versión 1.0 · de Eren Tozlu</p></div></div>
<p>Una herramienta gratuita en el navegador para diseñar una cámara de vacío y su sistema de bombeo. Suma la carga de gas por desgasificación, permeación a través de juntas y fugas, calcula la conductancia de las líneas de bombeo y la velocidad de bombeo efectiva, simula la evacuación desde la atmósfera y comprueba las paredes frente al colapso. Todos los cálculos se hacen en su navegador.</p>
<p>Las fórmulas, los datos de materiales y los ejemplos resueltos proceden del libro de texto <i>Vacuum Science and Technology</i> de Bart Suurmeijer, Theo Mulder y Jan Verhoeven; los números de ecuación del cálculo paso a paso remiten a él. La comprobación de paredes usa las fórmulas de placas de Roark y la fórmula de pandeo de Windenburg–Trilling. Sin relación ni respaldo de los autores ni de la editorial.</p>
<p>Creado por Eren Tozlu. Más herramientas y proyectos de ingeniería en <a href="https://ehcrea.com" target="_blank" rel="noopener">ehcrea.com</a>.</p>
<p>Código abierto bajo la <a href="${REPO}/blob/main/LICENSE" target="_blank" rel="noopener">licencia MIT</a>; el código fuente está en <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>.</p>
<div class="about-support"><p><strong>¿Le resulta útil la calculadora de vacío?</strong> Es gratuita para todos y sigo añadiendo funciones en mi tiempo libre. Si le ha ahorrado tiempo en el diseño de una cámara o le ha ayudado a aprender, puede apoyar su desarrollo en Patreon. Cada aportación, grande o pequeña, me ayuda a seguir creando nuevas herramientas de ingeniería. ¡Gracias!</p><a class="btn-support" href="https://www.patreon.com/ehcrea" target="_blank" rel="noopener"><span aria-hidden="true">♥</span> Apóyeme en Patreon</a></div>
<p class="about-meta">Los resultados son estimaciones de ingeniería para el diseño conceptual. Las tasas de desgasificación varían un orden de magnitud según la limpieza y el historial; verifique los sistemas críticos midiendo y haga comprobar las piezas a presión según la norma aplicable.</p>`,
    },
    help: {
      en: `<h2 id="help-title">How to use the Vacuum Chamber Calculator</h2>
<p>New here? Pick an example from <b>Load application example…</b> in the toolbar, then change one value at a time and watch the pump-down curve.</p>
<h3>Six steps</h3>
<ol>
<li><b>Chamber</b>: shape, inner dimensions, wall material and thicknesses.</li>
<li><b>Pressure &amp; gas</b>: the base pressure you need, the pumping time at which it must be reached, the gas and the temperature.</li>
<li><b>Gas loads</b>: wall cleanliness and bakeout, internal parts with their surface area, the elastomer seals (O-rings) and the allowed leak rate. A process gas flow only counts in operation.</li>
<li><b>Roughing pump</b> and its line from the chamber, optionally with a Roots booster.</li>
<li><b>High-vacuum pump</b> with its speed, crossover and backing pressure, and the line (ports, valves, baffles) between chamber and pump.</li>
<li><b>Strength</b>: safety factors for the atmospheric load on the walls.</li>
</ol>
<h3>Key ideas</h3>
<dl>
<dt>Gas load Q</dt><dd>Gas entering the chamber per second [Pa·m³/s]. Below about 10⁻² Pa it is dominated by outgassing (mostly water vapour), which falls roughly as 1/t.</dd>
<dt>Conductance C</dt><dd>How easily gas flows through a tube or orifice. In molecular flow it depends only on geometry and gas, not on pressure. Elements in series add as 1/C = Σ1/Cᵢ.</dd>
<dt>Effective speed</dt><dd>S_eff = S·C/(S + C): the speed that actually reaches the chamber. A pump much larger than the line conductance is wasted.</dd>
<dt>Base pressure</dt><dd>p = Q/S_eff + p_u: gas load divided by the effective speed, plus the ultimate pressure of the pump.</dd>
<dt>Flow regime</dt><dd>Knudsen number Kn = λ/d: viscous below 0.01, molecular above 1. Roughing is mostly viscous, high vacuum molecular.</dd>
</dl>
<h3>Reading the results</h3>
<ul>
<li>The chip shows <b>OK</b>, <b>Check</b> or <b>Problem</b>; each message says what to change and cites the section of the book.</li>
<li>The pump-down curve shows roughing (orange) and high vacuum (blue), the crossover point, the target and the pumping time.</li>
<li><b>Pumping lines</b> lists every element; the limiting element is highlighted. <b>Pump selection</b> marks the pump types that suit the target; click a row to use one.</li>
<li><b>Step-by-step calculation</b> writes out all formulas with their equation numbers. <b>Copy link</b> saves the design in a link; <b>PDF report</b> creates a printable report.</li>
</ul>
<p class="about-meta">Pressures can be shown in Pa, mbar or Torr; throughput and outgassing follow that choice.</p>`,
      de: `<h2 id="help-title">So verwenden Sie den Vakuumkammer-Rechner</h2>
<p>Neu hier? Wählen Sie in der Werkzeugleiste unter <b>Anwendungsbeispiel laden…</b> ein Beispiel, ändern Sie dann einen Wert nach dem anderen und beobachten Sie die Auspumpkurve.</p>
<h3>Sechs Schritte</h3>
<ol>
<li><b>Kammer</b>: Form, Innenmaße, Wandwerkstoff und Dicken.</li>
<li><b>Druck &amp; Gas</b>: der benötigte Enddruck, die Pumpzeit, nach der er erreicht sein muss, das Gas und die Temperatur.</li>
<li><b>Gaslasten</b>: Sauberkeit der Wand und Ausheizen, Einbauten mit ihrer Oberfläche, die Elastomerdichtungen (O-Ringe) und die zulässige Leckrate. Ein Prozessgasstrom zählt nur im Betrieb.</li>
<li><b>Vorpumpe</b> und ihre Leitung zur Kammer, wahlweise mit Wälzkolbenpumpe.</li>
<li><b>Hochvakuumpumpe</b> mit Saugvermögen, Umschalt- und Vorvakuumdruck sowie der Leitung (Stutzen, Ventile, Baffles) zwischen Kammer und Pumpe.</li>
<li><b>Festigkeit</b>: Sicherheitsfaktoren für die atmosphärische Last auf die Wände.</li>
</ol>
<h3>Grundbegriffe</h3>
<dl>
<dt>Gaslast Q</dt><dd>Gas, das je Sekunde in die Kammer gelangt [Pa·m³/s]. Unter etwa 10⁻² Pa dominiert die Ausgasung (meist Wasserdampf), die etwa mit 1/t sinkt.</dd>
<dt>Leitwert C</dt><dd>Wie leicht Gas durch ein Rohr oder eine Blende strömt. Bei Molekularströmung hängt er nur von Geometrie und Gas ab, nicht vom Druck. In Reihe gilt 1/C = Σ1/Cᵢ.</dd>
<dt>Effektives Saugvermögen</dt><dd>S_eff = S·C/(S + C): das Saugvermögen, das tatsächlich an der Kammer ankommt. Eine Pumpe, die viel größer als der Leitwert ist, ist verschenkt.</dd>
<dt>Enddruck</dt><dd>p = Q/S_eff + p_u: Gaslast geteilt durch das effektive Saugvermögen plus der Enddruck der Pumpe.</dd>
<dt>Strömungsart</dt><dd>Knudsen-Zahl Kn = λ/d: viskos unter 0,01, molekular über 1. Vorpumpen ist meist viskos, Hochvakuum molekular.</dd>
</dl>
<h3>Ergebnisse lesen</h3>
<ul>
<li>Das Abzeichen zeigt <b>OK</b>, <b>Prüfen</b> oder <b>Problem</b>; jede Meldung sagt, was zu ändern ist, und nennt den Abschnitt im Buch.</li>
<li>Die Auspumpkurve zeigt Vorpumpen (orange) und Hochvakuum (blau), den Umschaltpunkt, das Ziel und die Pumpzeit.</li>
<li><b>Pumpleitungen</b> listet jedes Element; das begrenzende ist hervorgehoben. <b>Pumpenauswahl</b> markiert die passenden Pumpentypen; ein Klick auf eine Zeile übernimmt sie.</li>
<li><b>Schritt-für-Schritt-Berechnung</b> zeigt alle Formeln mit Gleichungsnummern. <b>Link kopieren</b> speichert die Auslegung in einem Link; <b>PDF-Bericht</b> erstellt einen druckbaren Bericht.</li>
</ul>
<p class="about-meta">Drücke lassen sich in Pa, mbar oder Torr anzeigen; Durchfluss und Ausgasung folgen dieser Wahl.</p>`,
      nl: `<h2 id="help-title">Hoe u de vacuümkamer-calculator gebruikt</h2>
<p>Nieuw hier? Kies een voorbeeld via <b>Toepassingsvoorbeeld laden…</b> in de werkbalk, verander dan één waarde tegelijk en kijk naar de afpompcurve.</p>
<h3>Zes stappen</h3>
<ol>
<li><b>Kamer</b>: vorm, binnenmaten, wandmateriaal en diktes.</li>
<li><b>Druk &amp; gas</b>: de einddruk die u nodig hebt, de pomptijd waarna die bereikt moet zijn, het gas en de temperatuur.</li>
<li><b>Gaslasten</b>: reinheid van de wand en uitstoken, interne onderdelen met hun oppervlak, de elastomeer-afdichtingen (O-ringen) en het toegestane lekdebiet. Een procesgasdebiet telt alleen in bedrijf.</li>
<li><b>Voorpomp</b> en de leiding vanaf de kamer, eventueel met rootsbooster.</li>
<li><b>Hoogvacuümpomp</b> met snelheid, omschakel- en voorvacuümdruk, en de leiding (aansluitingen, kleppen, baffles) tussen kamer en pomp.</li>
<li><b>Sterkte</b>: veiligheidsfactoren voor de atmosferische belasting op de wanden.</li>
</ol>
<h3>Kernbegrippen</h3>
<dl>
<dt>Gaslast Q</dt><dd>Gas dat per seconde de kamer binnenkomt [Pa·m³/s]. Onder ongeveer 10⁻² Pa domineert ontgassing (vooral waterdamp), die ongeveer met 1/t daalt.</dd>
<dt>Geleiding C</dt><dd>Hoe gemakkelijk gas door een buis of opening stroomt. Bij moleculaire stroming hangt die alleen af van geometrie en gas, niet van de druk. In serie geldt 1/C = Σ1/Cᵢ.</dd>
<dt>Effectieve snelheid</dt><dd>S_eff = S·C/(S + C): de snelheid die werkelijk de kamer bereikt. Een pomp die veel groter is dan de geleiding is verspild.</dd>
<dt>Einddruk</dt><dd>p = Q/S_eff + p_u: gaslast gedeeld door de effectieve snelheid plus de einddruk van de pomp.</dd>
<dt>Stromingsgebied</dt><dd>Knudsengetal Kn = λ/d: viskeus onder 0,01, moleculair boven 1. Voorpompen is meestal viskeus, hoog vacuüm moleculair.</dd>
</dl>
<h3>Resultaten lezen</h3>
<ul>
<li>Het label toont <b>OK</b>, <b>Controleren</b> of <b>Probleem</b>; elke melding zegt wat u moet veranderen en noemt de paragraaf in het boek.</li>
<li>De afpompcurve toont voorpompen (oranje) en hoog vacuüm (blauw), het omschakelpunt, het doel en de pomptijd.</li>
<li><b>Pompleidingen</b> toont elk element; het begrenzende element is gemarkeerd. <b>Pompkeuze</b> markeert de geschikte pomptypes; klik op een rij om er een te gebruiken.</li>
<li><b>Stapsgewijze berekening</b> toont alle formules met vergelijkingsnummers. <b>Link kopiëren</b> bewaart het ontwerp in een link; <b>PDF-rapport</b> maakt een afdrukbaar rapport.</li>
</ul>
<p class="about-meta">Drukken kunnen in Pa, mbar of Torr worden getoond; debiet en ontgassing volgen die keuze.</p>`,
      tr: `<h2 id="help-title">Vakum Odası Hesaplayıcı nasıl kullanılır</h2>
<p>Yeni misiniz? Araç çubuğundaki <b>Uygulama örneği yükle…</b> menüsünden bir örnek seçin, ardından değerleri tek tek değiştirip boşaltma eğrisini izleyin.</p>
<h3>Altı adım</h3>
<ol>
<li><b>Oda</b>: şekil, iç boyutlar, duvar malzemesi ve kalınlıklar.</li>
<li><b>Basınç ve gaz</b>: ihtiyaç duyulan taban basıncı, bu basınca ulaşılması gereken pompalama süresi, gaz ve sıcaklık.</li>
<li><b>Gaz yükleri</b>: duvar temizliği ve fırınlama, yüzey alanlarıyla iç parçalar, elastomer contalar (O-ringler) ve izin verilen kaçak oranı. Proses gazı akışı yalnızca çalışma sırasında hesaba katılır.</li>
<li><b>Kaba vakum pompası</b> ve odadan gelen hattı, isteğe bağlı Roots güçlendirici ile.</li>
<li><b>Yüksek vakum pompası</b>: hızı, geçiş ve ön vakum basıncı ile oda ile pompa arasındaki hat (portlar, vanalar, bölmeler).</li>
<li><b>Dayanım</b>: duvarlara etkiyen atmosferik yük için güvenlik katsayıları.</li>
</ol>
<h3>Temel kavramlar</h3>
<dl>
<dt>Gaz yükü Q</dt><dd>Saniyede odaya giren gaz [Pa·m³/s]. Yaklaşık 10⁻² Pa altında, yaklaşık 1/t ile azalan gaz salınımı (çoğunlukla su buharı) baskındır.</dd>
<dt>İletkenlik C</dt><dd>Gazın bir borudan veya orifisten ne kadar kolay aktığı. Moleküler akışta basınca değil, yalnızca geometriye ve gaza bağlıdır. Seri elemanlar için 1/C = Σ1/Cᵢ.</dd>
<dt>Etkin hız</dt><dd>S_eff = S·C/(S + C): odaya gerçekten ulaşan hız. Hat iletkenliğinden çok büyük bir pompa boşa gider.</dd>
<dt>Taban basıncı</dt><dd>p = Q/S_eff + p_u: gaz yükünün etkin hıza bölümü artı pompanın nihai basıncı.</dd>
<dt>Akış rejimi</dt><dd>Knudsen sayısı Kn = λ/d: 0,01 altında viskoz, 1 üstünde moleküler. Kaba vakum çoğunlukla viskoz, yüksek vakum moleküler akıştır.</dd>
</dl>
<h3>Sonuçları okumak</h3>
<ul>
<li>Etiket <b>Uygun</b>, <b>Kontrol</b> veya <b>Sorun</b> gösterir; her mesaj neyin değişmesi gerektiğini söyler ve kitaptaki bölümü belirtir.</li>
<li>Boşaltma eğrisi kaba vakumu (turuncu) ve yüksek vakumu (mavi), geçiş noktasını, hedefi ve pompalama süresini gösterir.</li>
<li><b>Pompalama hatları</b> her elemanı listeler; sınırlayıcı eleman vurgulanır. <b>Pompa seçimi</b> hedefe uygun pompa tiplerini işaretler; birini kullanmak için satıra tıklayın.</li>
<li><b>Adım adım hesaplama</b> tüm formülleri denklem numaralarıyla gösterir. <b>Bağlantıyı kopyala</b> tasarımı bir bağlantıya kaydeder; <b>PDF rapor</b> yazdırılabilir bir rapor oluşturur.</li>
</ul>
<p class="about-meta">Basınçlar Pa, mbar veya Torr olarak gösterilebilir; debi ve gaz salınımı bu seçimi izler.</p>`,
      es: `<h2 id="help-title">Cómo usar la calculadora de cámaras de vacío</h2>
<p>¿Es nuevo? Elija un ejemplo en <b>Cargar ejemplo de aplicación…</b> de la barra de herramientas, cambie luego un valor cada vez y observe la curva de evacuación.</p>
<h3>Seis pasos</h3>
<ol>
<li><b>Cámara</b>: forma, dimensiones interiores, material de la pared y espesores.</li>
<li><b>Presión y gas</b>: la presión base necesaria, el tiempo de bombeo en el que debe alcanzarse, el gas y la temperatura.</li>
<li><b>Cargas de gas</b>: limpieza de la pared y horneado, piezas internas con su superficie, las juntas de elastómero (juntas tóricas) y la tasa de fuga admisible. Un caudal de gas de proceso solo cuenta en funcionamiento.</li>
<li><b>Bomba primaria</b> y su línea desde la cámara, opcionalmente con bomba Roots.</li>
<li><b>Bomba de alto vacío</b> con su velocidad, presión de transferencia y de apoyo, y la línea (puertos, válvulas, deflectores) entre la cámara y la bomba.</li>
<li><b>Resistencia</b>: factores de seguridad para la carga atmosférica sobre las paredes.</li>
</ol>
<h3>Ideas clave</h3>
<dl>
<dt>Carga de gas Q</dt><dd>Gas que entra en la cámara por segundo [Pa·m³/s]. Por debajo de unos 10⁻² Pa domina la desgasificación (sobre todo vapor de agua), que cae aproximadamente como 1/t.</dd>
<dt>Conductancia C</dt><dd>Facilidad con la que el gas atraviesa un tubo u orificio. En flujo molecular solo depende de la geometría y del gas, no de la presión. En serie, 1/C = Σ1/Cᵢ.</dd>
<dt>Velocidad efectiva</dt><dd>S_eff = S·C/(S + C): la velocidad que realmente llega a la cámara. Una bomba mucho mayor que la conductancia de la línea se desaprovecha.</dd>
<dt>Presión base</dt><dd>p = Q/S_eff + p_u: carga de gas dividida por la velocidad efectiva, más la presión última de la bomba.</dd>
<dt>Régimen de flujo</dt><dd>Número de Knudsen Kn = λ/d: viscoso por debajo de 0,01, molecular por encima de 1. El prevacío es casi siempre viscoso; el alto vacío, molecular.</dd>
</dl>
<h3>Leer los resultados</h3>
<ul>
<li>La etiqueta muestra <b>OK</b>, <b>Revisar</b> o <b>Problema</b>; cada mensaje indica qué cambiar y cita la sección del libro.</li>
<li>La curva de evacuación muestra el prevacío (naranja) y el alto vacío (azul), el punto de transferencia, el objetivo y el tiempo de bombeo.</li>
<li><b>Líneas de bombeo</b> lista cada elemento; el limitante aparece resaltado. <b>Selección de bombas</b> marca los tipos adecuados para el objetivo; haga clic en una fila para usarlo.</li>
<li><b>Cálculo paso a paso</b> muestra todas las fórmulas con su número de ecuación. <b>Copiar enlace</b> guarda el diseño en un enlace; <b>Informe PDF</b> crea un informe imprimible.</li>
</ul>
<p class="about-meta">Las presiones pueden mostrarse en Pa, mbar o Torr; el caudal y la desgasificación siguen esa elección.</p>`,
    },
    notes: {
      en: `<ul>
<li><b>Source.</b> Formulas and data from <i>Vacuum Science and Technology</i> (Suurmeijer, Mulder, Verhoeven): kinetic gas theory (ch. 1), gas flow and conductance (ch. 3), pumps and pumping systems (ch. 4), seals (ch. 9), materials, outgassing and permeation (ch. 10, appendix D). The calculator reproduces the worked example of §3.17 and exercises 3-1, 3-2, 3-3, 4-5, 4-6, 4-8 and 4-17 (see the tests in the repository).</li>
<li><b>Conductance.</b> Molecular flow: orifice (3.97), short tubes with the Clausing factor 4d/(4d + 3l) (3.109–3.110), long tubes (3.107), rectangular ducts (3.112–3.114), annular gaps (3.105, 3.116) and bends as extra length α·d (3.118). Viscous flow: Poiseuille (3.89, 3.91, 3.93). Transition: the empirical f(d·p) of (3.123) written in d/λ so it applies to every gas; orifices are interpolated between molecular and choked flow (assumption). Conductances scale with √(T/M) (3.120).</li>
<li><b>Gas loads.</b> Metals: q = q₁ₕ·(1 h/t) with 10⁻⁶, 10⁻⁵ or 10⁻⁴ Pa·m³/(s·m²) at 1 h (figure 10.1, table 10.1); polymers and ceramics per figure 10.2 (≈1/t^0.6–0.85); after bakeout the values of appendix D. Permeation through O-rings Q = P(T)·Δp·F·πD with the Arrhenius fit of figure 10.3 and a seal geometry factor F = 2, which reproduces the Viton example of §4.11.1 and exercise 4-8. A double O-ring with pumped interspace sees only the interspace pressure (§9.2.1).</li>
<li><b>Pump-down.</b> V·dp/dt = Q(t) − S_eff·(p − p_u), integrated with exponential steps (7.4, 7.7); pump speed falls as S₀·(1 − p_u/p) (7.8), the throughput is limited by choked flow through the narrowest section of the line, an optional Roots pump takes over below its switch-on pressure, and the high-vacuum pump at the crossover pressure. The 1/t outgassing law is extrapolated beyond its tens of hours of validity with a warning.</li>
<li><b>Pumps.</b> Ultimate pressures, working ranges and typical speeds from the tables of chapter 4; the working range ends 5 to 10 times above the ultimate pressure. Backing pump: S_b ≥ Q_max/p_b,max (exercises 4-3, 4-6).</li>
<li><b>Wall strength (not in the book).</b> Cylinders: Windenburg–Trilling elastic buckling with the long-cylinder limit 2E/(1−ν²)·(t/D)³; spheres: 0.365·E·(t/R)²; flat plates under 1 atm: Roark's formulas for clamped or simply supported rectangular and circular plates. Ports, flanges, welds and stiffeners need a separate check to the applicable pressure-vessel code.</li>
<li><b>Not included.</b> Gas mixtures and partial pressures, pump speed curves from data sheets, compression ratio of turbo pumps, desorption peaks during bakeout, diffusion-limited outgassing, virtual leaks, conductance of complex geometries (use a fixed conductance element), thermal transpiration.</li>
</ul>`,
      de: `<ul>
<li><b>Quelle.</b> Formeln und Daten aus <i>Vacuum Science and Technology</i> (Suurmeijer, Mulder, Verhoeven): kinetische Gastheorie (Kap. 1), Gasströmung und Leitwert (Kap. 3), Pumpen und Pumpsysteme (Kap. 4), Dichtungen (Kap. 9), Werkstoffe, Ausgasung und Permeation (Kap. 10, Anhang D). Der Rechner reproduziert das Rechenbeispiel aus §3.17 sowie die Aufgaben 3-1, 3-2, 3-3, 4-5, 4-6, 4-8 und 4-17 (siehe die Tests im Repository).</li>
<li><b>Leitwert.</b> Molekularströmung: Blende (3.97), kurze Rohre mit dem Clausing-Faktor 4d/(4d + 3l) (3.109–3.110), lange Rohre (3.107), Rechteckkanäle (3.112–3.114), Ringspalte (3.105, 3.116) und Bögen als Zusatzlänge α·d (3.118). Viskose Strömung: Poiseuille (3.89, 3.91, 3.93). Übergang: das empirische f(d·p) aus (3.123), in d/λ geschrieben, damit es für jedes Gas gilt; Blenden werden zwischen molekularer und kritischer Strömung interpoliert (Annahme). Leitwerte skalieren mit √(T/M) (3.120).</li>
<li><b>Gaslasten.</b> Metalle: q = q₁ₕ·(1 h/t) mit 10⁻⁶, 10⁻⁵ oder 10⁻⁴ Pa·m³/(s·m²) nach 1 h (Bild 10.1, Tabelle 10.1); Polymere und Keramik nach Bild 10.2 (≈1/t^0,6–0,85); nach dem Ausheizen die Werte aus Anhang D. Permeation durch O-Ringe Q = P(T)·Δp·F·πD mit der Arrhenius-Anpassung an Bild 10.3 und einem Geometriefaktor F = 2, der das Viton-Beispiel aus §4.11.1 und Aufgabe 4-8 reproduziert. Ein doppelter O-Ring mit abgepumptem Zwischenraum sieht nur den Zwischenraumdruck (§9.2.1).</li>
<li><b>Auspumpen.</b> V·dp/dt = Q(t) − S_eff·(p − p_u), mit Exponentialschritten integriert (7.4, 7.7); das Saugvermögen sinkt wie S₀·(1 − p_u/p) (7.8), der Durchfluss ist durch kritische Strömung im engsten Querschnitt der Leitung begrenzt, eine optionale Wälzkolbenpumpe übernimmt unter ihrem Einschaltdruck und die Hochvakuumpumpe beim Umschaltdruck. Das 1/t-Gesetz wird über seinen Gültigkeitsbereich von einigen zehn Stunden hinaus mit Warnung extrapoliert.</li>
<li><b>Pumpen.</b> Enddrücke, Arbeitsbereiche und typisches Saugvermögen aus den Tabellen von Kapitel 4; der Arbeitsbereich endet 5- bis 10-mal über dem Enddruck. Vorpumpe: S_b ≥ Q_max/p_b,max (Aufgaben 4-3, 4-6).</li>
<li><b>Wandfestigkeit (nicht im Buch).</b> Zylinder: elastisches Beulen nach Windenburg–Trilling mit der Grenze für lange Zylinder 2E/(1−ν²)·(t/D)³; Kugeln: 0,365·E·(t/R)²; ebene Platten unter 1 atm: Formeln nach Roark für eingespannte oder frei aufgelagerte Rechteck- und Kreisplatten. Stutzen, Flansche, Schweißnähte und Versteifungen brauchen einen eigenen Nachweis nach dem geltenden Druckbehälter-Regelwerk.</li>
<li><b>Nicht enthalten.</b> Gasgemische und Partialdrücke, Saugvermögenskurven aus Datenblättern, Kompressionsverhältnis von Turbopumpen, Desorptionsspitzen beim Ausheizen, diffusionsbegrenzte Ausgasung, virtuelle Lecks, Leitwert komplexer Geometrien (ein Element mit festem Leitwert verwenden), thermische Transpiration.</li>
</ul>`,
      nl: `<ul>
<li><b>Bron.</b> Formules en gegevens uit <i>Vacuum Science and Technology</i> (Suurmeijer, Mulder, Verhoeven): kinetische gastheorie (hfst. 1), gasstroming en geleiding (hfst. 3), pompen en pompsystemen (hfst. 4), afdichtingen (hfst. 9), materialen, ontgassing en permeatie (hfst. 10, bijlage D). De calculator reproduceert het uitgewerkte voorbeeld van §3.17 en de opgaven 3-1, 3-2, 3-3, 4-5, 4-6, 4-8 en 4-17 (zie de tests in de repository).</li>
<li><b>Geleiding.</b> Moleculaire stroming: opening (3.97), korte buizen met de Clausingfactor 4d/(4d + 3l) (3.109–3.110), lange buizen (3.107), rechthoekige kanalen (3.112–3.114), ringspleten (3.105, 3.116) en bochten als extra lengte α·d (3.118). Viskeuze stroming: Poiseuille (3.89, 3.91, 3.93). Overgang: de empirische f(d·p) van (3.123), geschreven in d/λ zodat die voor elk gas geldt; openingen worden geïnterpoleerd tussen moleculaire en gesmoorde stroming (aanname). Geleidingen schalen met √(T/M) (3.120).</li>
<li><b>Gaslasten.</b> Metalen: q = q₁ₕ·(1 h/t) met 10⁻⁶, 10⁻⁵ of 10⁻⁴ Pa·m³/(s·m²) na 1 h (figuur 10.1, tabel 10.1); polymeren en keramiek volgens figuur 10.2 (≈1/t^0,6–0,85); na uitstoken de waarden van bijlage D. Permeatie door O-ringen Q = P(T)·Δp·F·πD met de Arrhenius-fit van figuur 10.3 en een geometriefactor F = 2, die het Viton-voorbeeld van §4.11.1 en opgave 4-8 reproduceert. Een dubbele O-ring met afgepompte tussenruimte ziet alleen de tussenruimtedruk (§9.2.1).</li>
<li><b>Afpompen.</b> V·dp/dt = Q(t) − S_eff·(p − p_u), geïntegreerd met exponentiële stappen (7.4, 7.7); de pompsnelheid daalt als S₀·(1 − p_u/p) (7.8), het debiet is begrensd door gesmoorde stroming in de nauwste doorsnede van de leiding, een optionele rootspomp neemt over onder zijn inschakeldruk en de hoogvacuümpomp bij de omschakeldruk. De 1/t-wet wordt met een waarschuwing voorbij zijn geldigheid van enkele tientallen uren geëxtrapoleerd.</li>
<li><b>Pompen.</b> Einddrukken, werkgebieden en typische snelheden uit de tabellen van hoofdstuk 4; het werkgebied eindigt 5 tot 10 keer boven de einddruk. Voorpomp: S_b ≥ Q_max/p_b,max (opgaven 4-3, 4-6).</li>
<li><b>Wandsterkte (niet in het boek).</b> Cilinders: elastische knik volgens Windenburg–Trilling met de grens voor lange cilinders 2E/(1−ν²)·(t/D)³; bollen: 0,365·E·(t/R)²; vlakke platen onder 1 atm: formules van Roark voor ingeklemde of vrij opgelegde rechthoekige en ronde platen. Aansluitingen, flenzen, lassen en verstijvingen vragen een aparte toets aan de geldende drukvatnorm.</li>
<li><b>Niet inbegrepen.</b> Gasmengsels en partiaaldrukken, snelheidscurves uit gegevensbladen, compressieverhouding van turbopompen, desorptiepieken bij uitstoken, diffusiebegrensde ontgassing, virtuele lekken, geleiding van complexe geometrieën (gebruik een element met vaste geleiding), thermische transpiratie.</li>
</ul>`,
      tr: `<ul>
<li><b>Kaynak.</b> Formüller ve veriler <i>Vacuum Science and Technology</i> (Suurmeijer, Mulder, Verhoeven) kitabından: kinetik gaz teorisi (bölüm 1), gaz akışı ve iletkenlik (bölüm 3), pompalar ve pompalama sistemleri (bölüm 4), contalar (bölüm 9), malzemeler, gaz salınımı ve geçirgenlik (bölüm 10, Ek D). Hesaplayıcı §3.17'deki çözümlü örneği ve 3-1, 3-2, 3-3, 4-5, 4-6, 4-8 ve 4-17 alıştırmalarını yeniden üretir (depodaki testlere bakın).</li>
<li><b>İletkenlik.</b> Moleküler akış: orifis (3.97), Clausing katsayısı 4d/(4d + 3l) ile kısa borular (3.109–3.110), uzun borular (3.107), dikdörtgen kanallar (3.112–3.114), halka aralıklar (3.105, 3.116) ve ek uzunluk α·d olarak dirsekler (3.118). Viskoz akış: Poiseuille (3.89, 3.91, 3.93). Geçiş: (3.123)'teki ampirik f(d·p), her gaza uygulanabilmesi için d/λ cinsinden yazıldı; orifisler moleküler ve tıkanmış akış arasında enterpole edilir (varsayım). İletkenlikler √(T/M) ile ölçeklenir (3.120).</li>
<li><b>Gaz yükleri.</b> Metaller: 1 saatte 10⁻⁶, 10⁻⁵ veya 10⁻⁴ Pa·m³/(s·m²) ile q = q₁ₕ·(1 h/t) (şekil 10.1, tablo 10.1); polimerler ve seramikler şekil 10.2'ye göre (≈1/t^0,6–0,85); fırınlamadan sonra Ek D değerleri. O-ringlerden geçirgenlik Q = P(T)·Δp·F·πD; şekil 10.3'e Arrhenius uydurması ve §4.11.1'deki Viton örneğini ve alıştırma 4-8'i yeniden üreten F = 2 geometri katsayısı ile. Arası pompalanan çift O-ring yalnızca ara boşluk basıncını görür (§9.2.1).</li>
<li><b>Boşaltma.</b> V·dp/dt = Q(t) − S_eff·(p − p_u), üstel adımlarla integre edilir (7.4, 7.7); pompa hızı S₀·(1 − p_u/p) gibi düşer (7.8), debi hattın en dar kesitindeki tıkanmış akışla sınırlanır, isteğe bağlı Roots pompası devreye girme basıncının altında, yüksek vakum pompası ise geçiş basıncında devralır. 1/t yasası, birkaç on saatlik geçerlilik süresinin ötesine bir uyarıyla ekstrapole edilir.</li>
<li><b>Pompalar.</b> Nihai basınçlar, çalışma aralıkları ve tipik hızlar bölüm 4 tablolarından; çalışma aralığı nihai basıncın 5 ila 10 katında biter. Ön pompa: S_b ≥ Q_max/p_b,max (alıştırma 4-3, 4-6).</li>
<li><b>Duvar dayanımı (kitapta yok).</b> Silindirler: uzun silindir sınırı 2E/(1−ν²)·(t/D)³ ile Windenburg–Trilling elastik burkulması; küreler: 0,365·E·(t/R)²; 1 atm altındaki düz plakalar: ankastre veya basit mesnetli dikdörtgen ve dairesel plakalar için Roark formülleri. Portlar, flanşlar, kaynaklar ve takviyeler geçerli basınçlı kap standardına göre ayrıca kontrol edilmelidir.</li>
<li><b>Dahil olmayanlar.</b> Gaz karışımları ve kısmi basınçlar, veri sayfalarındaki hız eğrileri, turbo pompaların sıkıştırma oranı, fırınlama sırasındaki desorpsiyon tepeleri, difüzyonla sınırlı gaz salınımı, sanal kaçaklar, karmaşık geometrilerin iletkenliği (sabit iletkenlik elemanı kullanın), termal transpirasyon.</li>
</ul>`,
      es: `<ul>
<li><b>Fuente.</b> Fórmulas y datos de <i>Vacuum Science and Technology</i> (Suurmeijer, Mulder, Verhoeven): teoría cinética de gases (cap. 1), flujo de gases y conductancia (cap. 3), bombas y sistemas de bombeo (cap. 4), juntas (cap. 9), materiales, desgasificación y permeación (cap. 10, apéndice D). La calculadora reproduce el ejemplo resuelto de §3.17 y los ejercicios 3-1, 3-2, 3-3, 4-5, 4-6, 4-8 y 4-17 (vea las pruebas del repositorio).</li>
<li><b>Conductancia.</b> Flujo molecular: orificio (3.97), tubos cortos con el factor de Clausing 4d/(4d + 3l) (3.109–3.110), tubos largos (3.107), conductos rectangulares (3.112–3.114), ranuras anulares (3.105, 3.116) y codos como longitud adicional α·d (3.118). Flujo viscoso: Poiseuille (3.89, 3.91, 3.93). Transición: la f(d·p) empírica de (3.123) escrita en d/λ para que valga para cualquier gas; los orificios se interpolan entre flujo molecular y bloqueado (supuesto). Las conductancias escalan con √(T/M) (3.120).</li>
<li><b>Cargas de gas.</b> Metales: q = q₁ₕ·(1 h/t) con 10⁻⁶, 10⁻⁵ o 10⁻⁴ Pa·m³/(s·m²) a 1 h (figura 10.1, tabla 10.1); polímeros y cerámicas según la figura 10.2 (≈1/t^0,6–0,85); tras el horneado, los valores del apéndice D. Permeación por juntas tóricas Q = P(T)·Δp·F·πD con el ajuste de Arrhenius de la figura 10.3 y un factor geométrico F = 2, que reproduce el ejemplo de Viton de §4.11.1 y el ejercicio 4-8. Una junta doble con espacio intermedio bombeado solo ve la presión intermedia (§9.2.1).</li>
<li><b>Evacuación.</b> V·dp/dt = Q(t) − S_eff·(p − p_u), integrada con pasos exponenciales (7.4, 7.7); la velocidad cae como S₀·(1 − p_u/p) (7.8), el caudal se limita por el flujo bloqueado en la sección más estrecha de la línea, una bomba Roots opcional entra por debajo de su presión de arranque y la bomba de alto vacío a la presión de transferencia. La ley 1/t se extrapola con un aviso más allá de su validez de unas decenas de horas.</li>
<li><b>Bombas.</b> Presiones últimas, rangos de trabajo y velocidades típicas de las tablas del capítulo 4; el rango de trabajo termina de 5 a 10 veces por encima de la presión última. Bomba primaria: S_b ≥ Q_max/p_b,max (ejercicios 4-3, 4-6).</li>
<li><b>Resistencia de la pared (no está en el libro).</b> Cilindros: pandeo elástico de Windenburg–Trilling con el límite de cilindro largo 2E/(1−ν²)·(t/D)³; esferas: 0,365·E·(t/R)²; placas planas bajo 1 atm: fórmulas de Roark para placas rectangulares y circulares empotradas o simplemente apoyadas. Puertos, bridas, soldaduras y rigidizadores requieren una comprobación aparte según la norma de recipientes a presión aplicable.</li>
<li><b>No incluido.</b> Mezclas de gases y presiones parciales, curvas de velocidad de hojas de datos, relación de compresión de turbobombas, picos de desorción durante el horneado, desgasificación limitada por difusión, fugas virtuales, conductancia de geometrías complejas (use un elemento de conductancia fija), transpiración térmica.</li>
</ul>`,
    },
  };

  const DICT = { de: {}, nl: {}, tr: {}, es: {} };
  for (const [en, de, nl, tr, es] of ROWS) { DICT.de[en] = de; DICT.nl[en] = nl; DICT.tr[en] = tr; DICT.es[en] = es; }

  let lang = 'en';
  const fill = (tpl, p) => (p ? tpl.replace(/\{(\w+)\}/g, (m, k) => (k in p ? String(p[k]) : m)) : tpl);

  /** Translate a text (English key) and fill {placeholders}; string parameters are translated too. */
  function t(text, params) {
    if (text === undefined || text === null) return '';
    const tr = lang === 'en' ? text : (DICT[lang][text] !== undefined ? DICT[lang][text] : text);
    if (!params) return tr;
    const p = {};
    for (const k in params) p[k] = typeof params[k] === 'string' && lang !== 'en' && DICT[lang][params[k]] !== undefined ? DICT[lang][params[k]] : params[k];
    return fill(tr, p);
  }

  // ----- Static page translation -----
  let staticNodes = null;
  function collectStatic() {
    const texts = [], attrs = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest('script,style,[data-i18n-html],[data-i18n-skip],.rows') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const raw = n.nodeValue, en = raw.trim();
      if (en && DICT.de[en] !== undefined) texts.push({ node: n, en, lead: raw.match(/^\s*/)[0], trail: raw.match(/\s*$/)[0] });
    }
    for (const el of document.querySelectorAll('[title],[aria-label],[placeholder]')) {
      if (el.closest('.rows')) continue;
      for (const attr of ['title', 'aria-label', 'placeholder']) {
        const en = el.getAttribute(attr);
        if (en && DICT.de[en] !== undefined) attrs.push({ el, attr, en });
      }
    }
    staticNodes = { texts, attrs };
  }

  function applyStatic() {
    if (!staticNodes) collectStatic();
    for (const s of staticNodes.texts) s.node.nodeValue = s.lead + t(s.en) + s.trail;
    for (const a of staticNodes.attrs) a.el.setAttribute(a.attr, t(a.en));
    for (const el of document.querySelectorAll('[data-i18n-html]')) {
      const block = HTML[el.dataset.i18nHtml];
      if (block) el.innerHTML = block[lang] || block.en; // trusted static content defined above
    }
    document.documentElement.lang = lang;
    document.title = t('Vacuum Chamber Calculator');
  }

  const I18N = {
    LANGS, t, fill,
    /** Percentage in the local style ("18 %", Turkish "%18"). */
    pct: (v) => (lang === 'tr' ? `%${v}` : lang === 'en' ? `${v}%` : `${v} %`),
    get lang() { return lang; },
    get locale() { return LANGS[lang].locale; },
    init() {
      let saved = null;
      try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* storage unavailable */ }
      const nav = (typeof navigator !== 'undefined' && navigator.language || 'en').slice(0, 2).toLowerCase();
      lang = LANGS[saved] ? saved : LANGS[nav] ? nav : 'en';
      applyStatic();
    },
    setLang(l) {
      if (!LANGS[l]) return;
      lang = l;
      try { localStorage.setItem(STORE_KEY, l); } catch (e) { /* storage unavailable */ }
      applyStatic();
    },
    has: (text) => DICT.de[text] !== undefined,
    /** Rows with a missing or empty translation. */
    missing: () => ROWS.filter((r) => r.length !== 5 || r.some((x) => typeof x !== 'string' || !x)).map((r) => r[0]),
    keys: () => ROWS.map((r) => r[0]),
    rows: () => ROWS,
    html: () => HTML,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = I18N;
  else root.I18N = I18N;
})(typeof window !== 'undefined' ? window : globalThis);
