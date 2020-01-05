---
title: "Display, opacity e visibility: facciamo chiarezza"
---
Esistono diversi modi per far scomparire un elemento dal nostro layout tramite l'uso dei CSS. A volte è facile confondersi perchè in apparenza le proprietà che andremo ad analizzare svolgono funzioni molto simili. Conoscerne le differenze però è importante, non solo per evitare effetti indesiderati, ma per poterle utilizzare al loro pieno potenziale. 

Le proprietà e relativi valori sono: 

- ``display:none``
- ``opacity:0``
- ``visibility:hidden``

Tutte queste proprietà sortiscono l'effetto di eliminare dal nostro layout l'elemento al quale sono applicate ma, nella realtà dei fatti, lo fanno in modo diverso. Per capire come si comportano iniziamo con il dare un'occhiata alla seguente tabella:

|             | Display    | Opacity | Visibility |
|-------------|------------|---------|------------|
| dimensioni  | collassate | normali | normali    |
| eventi      | no         | si      | no         |
| transizioni | no         | si      | no         |

### Display
Questa proprietà è forse la più usata quando si vuole far scomparire un elemento. Quando si applica ``display:none``, l'elemento viene praticamente eliminato dal rendering della pagina. Osservando il markup HTML il tag sarà ancora presente, ma a tutti gli effetti non occuperà spazio perchè le dimensioni dell'elemento saranno completamente collassate.

L'elemento non sarà nemmeno più target di eventi come, ad esempio, l'**hover del mouse**. Quindi per interagire con esso dovremmo ricorrere ad un po' di **Javascript**. 

In ultimo la proprietà ``display`` non è soggetta ad animazioni e trasnizioni CSS, quindi non è possibile utilizzarla per questo genere di effetti.

### Opacity
Con ``opacity:0`` la situazione è differente. Come prima cosa, al contrario della proprietà ``display``, l'elemento diventa trasparente, ma continua a mantenere le dimensioni originali, occupando il relativo spazio nella pagina. Questo vuol dire che pur non visualizzandolo, l'elemento andrà ad incidere come farebbe normalmente sul layout della pagina.

Conseguenza di quanto descritto poco sopra, è che l'elemento, pur essendo invisibile, è presente a tutti gli effetti ed è quindi soggetto ai normali eventi come, per rifarci all'esempio di prima, l'**hover del mouse**.

A differenza di ``display``, con ``opacity`` abbiamo a disposizione animazioni e transizioni. La proprietà accetta infatti come valore, un numero compreso tra 0 e 1, mettendoci a disposizione tutta una serie di valori intermedi adatti per transizioni come ad esempio il **fade-in** e il **fade-out**.

### Visibility
Questa proprietà possiamo dire che si colloca più o meno a metà strada tra le due precedenti. Andando ad applicare ``visibility:hidden``, l'elemento scomparirà ma, come per ``opacity``, continuerà ad occupare lo spazio all'interno del nostro layout. 

Al contrario di ``opacity`` però, l'elemento è completamente invisibile, ed eventi come il già citato **hover del mouse**, non potranno interagire con esso.

Per quanto riguarda animazioni e transizioni ``visibility`` si comporta in maniera un po' particolare. La proprietà è disponibile per le animazioni, ma non per le transizioni, accettando come valori ``visibility:hidden`` o ``visibility:visible`` senza possibilità di valori intermedi utili ad una transizione. Impostando quindi un tempo di transizione tra una stato e l'altro, l'elemento semplicemente scomparirà di colpo al termine del tempo impostato.

NB: la proprietà accetta anche un terzo valore, ``visibility:collapse``, che si comporta più o meno come ``display:none``, ma solo per gli elementi di una tabella. Su tutti gli altri elementi questo valore si comporta come ``visibility:hidden``.

### Demo
Di seguito potete vedere una semplice demo sul comportamento delle tre proprità. Cliccando sui pulsanti verrà applicata la proprietà del caso per nascondere l'elemento ``div``, all'interno del quale si trova un link che, come discusso sopra, per ``opacity`` rimane raggiungibile anche con l'elemento completamente trasparente.  


<p data-height="268" data-theme-id="0" data-slug-hash="KzQRaE" data-default-tab="result" data-user="jacoporabolini" class="codepen">See the Pen <a href="http://codepen.io/jacoporabolini/pen/KzQRaE/">Display-Opacity-Visibility</a> by Jacopo Rabolini (<a href="http://codepen.io/jacoporabolini">@jacoporabolini</a>) on <a href="http://codepen.io">CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>