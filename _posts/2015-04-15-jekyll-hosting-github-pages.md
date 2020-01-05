---
title: Jekyll Hosting - Github Pages
---
Una delle cose più belle di Jekyll è la sua versatilità sul fronte hosting. Ok, si tratta di un generatore di siti statici, quindi, trattandosi di file statici appunto, la versatilità è un fattore comune a quasi tutti i generatori di questo tipo. Jekyll però ha dalla sua un'arma in più. 

Una delle possibilità di hosting più comuni è quella relativa alle [Github Pages](https://pages.github.com/). Nella pratica queste pagine sono generate proprio da Jekyll, il che rende possibile eseguire l'upload del nostro codice e lasciare che sia Github a generare poi il sito per noi. Se a tutto questo aggiungete anche l'uso di **Git**, capirete come le Github Pages siano la destinazione preferita per chi usa Jekyll.

Quando decidiamo di usare una Github Pages come hosting per il nostro progetto, possiamo utilizzare due modalità:

### User or organizzation site

Questa opzione permette di creare un sito relativo al nostro account, che si tratti del nostro sito personale o di quello di una pagina che abbiamo in gestione. La procedura per potersi avvalere di questa opzione è veramente molto semplice:

1. Create un repository e nominatelo secondo la formula *vostro-nome.github.io*
2. Impostate il vostro progetto con Git (clonate il repository o createne uno nuovo impostandolo come repo remoto)
3. Caricate i vostri file

Una volta fatto, troverete il vostro sito all'indirizzo corrispondente al nome del repository.

### Project site

In questo caso il sito si riferisce ad un progetto che si può trovare sul nostro account Github, quindi potenzialmente se ne può avere più di uno. Basta seguire i seguenti step:

1. All'interno del vostro repository, create un *branch* denominato *gh-pages*
2. Copiate i file relativi al sito del vostro progetto all'interno del *branch*

Terminati questi due passaggi, troverete il sito del vostro progetto all'indirizzo *vostro-nome.github.io/nome-repository*.

### In conclusione

Nella pratica questo rende possibile lavorare in locale al proprio progetto con Jekyll e utilizzare Git per eseguire l'upload del vostro codice, senza dover generare il sito tramite il comando *Jekyll build*. Davvero molto comodo.

Di contro, tramite questa opzione, il codice del vostro progetto Jekyll sarà visibile a tutti sul vostro account. Raramente questo rappresenta un problema, ma è bene saperlo.


