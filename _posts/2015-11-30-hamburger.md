---
title: Hamburger icon animata senza immagini
---
La classica icona ad hamburger, quella con le tre linee parallele che potete vedere anche in questo blog in alto a destra, è ormai diventata uno standard the facto per quel che riguarda l'accesso a menu di navigazione ed opzioni.

La si può realizzare in molti modi, a partire da una semplice immagine ``png`` o ``svg``, fino all'utilizzo di CSS. Non esiste uno standard vero e proprio e anche per quanto riguarda l'animazione si possono trovare diversi esempi in giro per la rete.

Dato che non ho trovato un esempio che mi soddisfacesse appieno, ho pensato di crearne uno a mia volta, andando a pescare qualche buona idea qua e la e rifinendo il tutto come ho ritenuto opportuno. Il risultato lo potete vedere in alto a destra: un'icona ad hanburger realizzata con CSS e un pizzico di Javascript per la gestione della classe assegnata all'icona.

In pratica ho inserito un `div` all'interno di un link e ad esso ho assegnato un'altezza di 4px e un colore di background, oltre a relativi margini e un posizionamento relativo. Questo elemento costituisce la riga centrale della nostra icona. 
Ho usato gli pseudo element `:before` e `:after` relativi al `div` allo stesso modo, spostandoli sopra e sotto per dare all'icona la giusta spaziatura. 

Con poche righe di Javascript, assegno al `div` dell'icona la classe `.active`, quando viene cliccata. Questa classe altro non fa che che eliminare il colore di background dell'elemento centrale e ruotare di 45° e - 45° le linee corrispondenti agli pseudo elementi, posizionandoli di conseguenza. L'aggiunta della proprietà `transition` completa il tutto rendendo l'animazione più dolce.

Potete vedere il codice completo e la demo qui sotto. 

<p data-height="268" data-theme-id="0" data-slug-hash="xGwqeM" data-default-tab="result" data-user="jacoporabolini" class='codepen'>See the Pen <a href='http://codepen.io/jacoporabolini/pen/xGwqeM/'>Hamburger icon animated</a> by Jacopo Rabolini (<a href='http://codepen.io/jacoporabolini'>@jacoporabolini</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>