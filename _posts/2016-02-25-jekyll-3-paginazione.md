---
title: Jekyll 3 e la paginazione dei post
---
Dalla versione 3 in poi di Jekyll, alcune delle funzionalità principali di questo **static site generator**, sono state portate all'esterno del modulo principale, il core di Jekyll e resi dei moduli indipendenti. In questo modo si semplifica lo sviluppo e la manutenzione delle diverse componenti e si rende tutto il sistema più flessibile.

Una delle funzionalità che è stata portata all'esterno del core e resa un modulo indipendente è la funzione di paginazione, molto importante per un blog. Ora questa funzione è racchiusa in un modulo specifico: **jekyll-paginate**.

Questo modulo non è altro che una gemma Ruby, da aggiungere alla configurazione del nostro progetto. L'operazione è molto semplice. Come prima cosa dobbiamo scaricare il plugin che vogliamo utilizzare, nel nostro caso quindi da terminale digitiamo:

{% highlight shell %}

~$ gem install jekyll-paginate

{% endhighlight %}

Una volta installato il plugin, nel file file _config.yml non dobiamo far altro che aggiungere, se già non l'avete, la sezione dedicata alla "gemme" (i plugin che vogliamo utilizzare con il nostro progetto Jekyll) ed elencare di seguito i plugin che voglaimo utilizzare, nel nostro caso:

{% highlight yaml %}

# Plugins
gems:
  - jekyll-paginate

{% endhighlight %}

Ora il plugin è pronto per essere utilizzato all'interno del nostro progetto come accadeva per la versione 2 di Jekyll.

Una volta in produzione con il nostro progetto, non dovremmo avere problemi di sorta se, ad esempio, decidessimo di pubblicare il nostro sito statico su Amazon S3 e mantenere la sorgente in locale. Il plugin si occupa di generare in locale le pagine e su S3 (o servizio simile), vengono pubblicate belle che pronte.

Ma per quanto riguarda la pubblicazione su Github?

Le Github Pages sono la principale e naturale destinazione di un sito creato mediante Jekyll, tanto che le stesse vengono generate proprio tramite questo static site generator. Di norma quindi sulla Github Pages non facciamo altro che caricare tutto il codice sorgente e lasciare che sia Github ha generare il sito per noi. Ne ho già parlato in un mio [precedente post su queste pagine](http://www.jacoporabolini.com/jekyll-hosting-github-pages).

Le Github Pages non accettano però tutti i plugin. Anzi, a dire il vero ne accetta solo una [ristrettisima selezione](https://help.github.com/articles/adding-jekyll-plugins-to-a-github-pages-site/), tra i quali non è presente il plugin relativo alla paginazione. 

In realtà non esiste una reale soluzione a questo problema. Certo, potreste anche in questo caso generare il sito localmente e caricare il codice risultante sulle Github Pages, ma si perderebbe molta dell'utilità e della velocità di questo sistema. Fortunatamente però, al momento Github sembra supportare la paginazione anche senza aver incluso **jekyll-paginate** nella lista dei plugin supportati. Sospetto che la cosa sia dovuta al supporto per le versioni di Jekyll antecedenti alla 3.0 e che lo stesso rimarrà tale fino a quando sarà necessario supportare le vecchie versioni di Jekyll. 

E a quel punto credo proprio vedremo comparire nella lista dei plugin supportati anche **jekyll-paginate**.