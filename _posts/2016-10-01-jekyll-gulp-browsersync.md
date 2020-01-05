---
title: "Usare Jekyll con Gulp e BrowserSync"
---

Durante lo sviluppo di un nuovo progetto, Jekyll mette a disposizione un server interno, che si occupa di generare il sito a partire dai nostri file e dai nostri contenuti. A seconda delle esigenze, potrebbe essere utile avere a disposizione qualche opzione più evoluta, come il live reloading. Ed è qui che ci viene in aiuto [Browser Sync](https://www.browsersync.io/). Grazie a [Gulp](http://gulpjs.com/), possiamo espandere le funzioni di base offerte da Jekyll ed includere nel nostro workflow anche Browser Sync, con il quale potremo sfruttare, oltre al live reloading, anche l'opzione di sync tra browser diversi.

Do per scontato che abbiate installato [Node.js](https://www.nodejs.org) e relativo package manager, quindi iniziamo con il setup e da terminale digitiamo:

{% highlight shell %}

~$ npm init

{% endhighlight %}

Inizializziamo il file *package.json* e rispondiamo alle domande che compariranno sul terminale, inserendo il nome del progetto, la versione, la descrizione e cose di questo genere. Una volta terminato passiamo all'installazione dei componenti che ci servono, quindi digitiamo:

{% highlight shell %}

~$ npm install --save-dev gulp gulp-shell browser-sync

{% endhighlight %}

Con questo comando andremo ad installare, in modalità sviluppo, tre componenti:

1. **Gulp**: il nostro gestore di task ovviamente
2. **Gulp Shell**: plugin per Gulp che permette di lanciare comandi da terminale
3. **Browser Sync**: che sfrutteremo per il live reloading e il sync

Una volta installati i componenti procediamo con la creazione del nostro *gulpfile.js*, in cui inserire le nostre task. Il codice è il seguente:

{% highlight javascript %}

var gulp = require('gulp');
var shell = require('gulp-shell');
var bs = require('browser-sync').create('Dev Server');

gulp.task('jekyll', shell.task(['jekyll build --watch --draft']));
gulp.task('serve', function() {
	bs.init({
		server: { 
			baseDir: '_site/' 
		}
	});
	gulp.watch('_site/**/*.*').on('change', bs.reload);
});
gulp.task('default', ['jekyll', 'serve']);

{% endhighlight %}

Il codice è piuttosto semplice. Inizialmente richiamiamo i tre componenti che abbiamo precedentemente scaricato all'interno di tre variabili. Poi nella prima riga impostiamo la task `jekyll` in cui, grazie all'utilizzo di  `gulp-shell`, lanciamo il comando `jekyll build` per generare il sito a partire dai nostri contenuti e template. Al comando passiamo i parametri `--watch`, per rigenerare il sito ogni volta che vengono effettuati dei cambiamenti e `--draft`, per poter visionare in produzione anche le bozze dei post. Ovviamente quest'ultimo parametro è opzionale.

Proseguiamo con la seconda task che si occupa in primo luogo di lanciare un server locale, tramite `browser-sync`, a partire dalla cartella di destinazione del sito generato da Jekyll. Nel nostro caso viene utilizzata l'opzione di default `_site/`. Sucessivamente viene inserita una seconda funzione che rimarrà in attesa di cambiamenti all'interno della nostra cartella (cambiamenti generati dalla task precedente) e che ricaricherà il browser ogni volta che ne rivelerà uno.

In ultimo la task `default` che ci permetterà di lanciare il tutto tramite il semplice comando `gulp`. Prima di lanciarlo però occorre un'ultima cosa. All'interno del file `_config.yml` del nostro progetto, dovremo inserire la seguente riga:

{% highlight yaml %}

exclude: [node_modules, gulpfile.js, package.json]

{% endhighlight %}

In questo modo, durante la generazione del sito, Jekyll ignorerà i file che ci servono esclusivamente durante la fase di sviluppo. 

Fatto questo possiamo finalmente lanciare il tutto:

{% highlight shell %}

~$ gulp

{% endhighlight %}

Come avrete visto il tutto è piuttosto semplice e funziona con poche righe di codice. Potreste tuttavia aver notato una certa lentezza nel live reloading, dovuta sopratutto alla parte di build di Jekyll. Ci sono alcune alternative all'utilizzo della prima task, che consistono più che altro nella compilazione dei file Sass, Coffe Script e dei template in task separate. 

A voi il compito di cercarle e implementarle, magari integrandole nel vostro attuale utilizzo di Gulp!