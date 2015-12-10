// Log levels
my.loglevel = 4;
Ractive.DEBUG = (my.log_level >= 4);

var Agressivites = [{
		value: 'Assureur',
		img: 'img/angel.png'
	},{
		value: 'Annonceur',
		img: 'img/thinking.png'
	},{
		value: 'Attaquant',
		img: 'img/angry.png'
	},{
		value: 'Agressif',
		img: 'img/aggressive.png'
	}], 
	robotnicknames = 'Alex Thierry Jérome Damien'.split(' '),
	locations = 'south west north est'.split (' '),
	popovers = 'top right bottom left'.split (' '),
	players = [];

for (var i = 0; i<4; i++) {
	var player = i?new CoincheRobot (i):new CoinchePlayer (i);
	player.nickname = robotnicknames[i];
	player.team = i%2; // team 0 or 1
	player.location = locations[i];
	player.popover = popovers[i];
	player.avatar = Agressivites[i].img;
	players.push (player);
}

var coinche = new Ractive({
	el: 'container',
	template: '#template',
	data: {
		cheatmode: false,
		players: players,
		deck: new CoincheDeck (),
		game: {
			teams: [{
				points: 0,
				annonce: false
			},{
				points: 0,
				annonce: false
			}],
			pli: {
				couleur: false,
				cards: []
			}, // cards on table
			nbpass: 0,
			scores: []
		},
		turn: 0,
		nbpass: 0,
		couleur: false,
		getSuitClass: function (suit) {
			return SuitLabels[suit].label;
		},
		annoncer: function (parole) {
			var player = coinche.get ('players['+coinche.get ('turn')+']'),
				stop = false;

			$('#'+player.location+'-controls').popover('destroy');
			$('#'+player.location+'-bubble').popover('destroy');

			if (parole) {
				coinche.set ('game.teams['+player.team+'].annonce', parole);
				coinche.set ('game.teneur', player.team);
				coinche.set ('game.annoncefaite', true);
				coinche.set ('game.nbpass',  0);
			} else {
				coinche.add ('game.nbpass');
				if (coinche.get ('game.annoncefaite')) {
					if (coinche.get ('game.nbpass') == 3) {
						var teneur = coinche.get ('game.teneur'),
							contrat = coinche.get ('game.teams['+teneur+'].annonce'),
							score = {
								0: {points: 0},
								1: {points: 0},
							};
						score[teneur].contrat = contrat.montant;
						score[teneur].couleur = contrat.couleur;
						coinche.set ('game.contrat', contrat);
						console.warn ('contrat établit à', contrat);
						coinche.push ('game.scores', score);
						coinche.set ('turn', 0);
						stop = true;
					}
				} else if (coinche.get ('game.nbpass') == 4) {
						console.warn ('tout le monde a passé, on redistribue');
						stop = true;
				}
			}
			setTimeout (function () {
				var $content = $('<span>');
				if (parole) {
					$content.text (parole.montant);
					$content.addClass ('annonce');
					$content.addClass (SuitLabels [parole.couleur].label);
				}
				else
					$content.text ('Passe');
				//my.debug ('content', $content);
				$('#'+player.location+'-bubble').popover({
					html: true,
					content: $content
				}).popover('show');
			}, 300);

			setTimeout (function () {
				if (stop) {
					$('.bubble').popover('destroy');
					coinche.set ('turn', 0);
					// order players hand
					$.each (coinche.get('players'), function (i, player) {
						player.hand.order (coinche.get('game.contrat.couleur'));
					});
				} else
					coinche.set ('turn', (coinche.get ('turn')+1) %4);
				coinche.fire ('play');
			}, 1000);
		},
		jouer: function (card) {
			//my.debug ('playing card '+card);
			var stop = false;
			if (coinche.get ('turn') === 0)
				coinche.set ('game.pli.couleur', card.suit);
			else if (coinche.get ('turn') === 3) {
				my.debug ('tout le monde a posé une carte');
				stop = true;
			}

			setTimeout (function () {
				if (stop) {
					coinche.fire ('collect');
					coinche.set ('game.pli.cards', []);
					coinche.set ('turn', 0);
					coinche.fire ('play');
				} else
					coinche.add ('turn');
				coinche.fire ('play');
			}, 1000);
		}
	}
});

$('#deck').popover({
	html: true,
	trigger: 'manual',
	content: function() {
      return $("#deck-popover").html();
    }
}).popover('show');

coinche.on ('deal', function () {
	$('#deck').popover ('hide');
	
	$.each ([3, 2, 3], function (i, nb) {
		$.each (coinche.get ('players'), function (j, player) {
			for (var k = 0; k < nb; k++) {
				player.hand.cards.push (coinche.get ('deck.deck[0]'));
				coinche.shift ('deck.deck');
			}
		});
	});

	// order players hand
	$.each (coinche.get('players'), function (i, player) {
		my.debug ('tri de la main de', player.nickname);
		player.hand.order ();
	});
});

coinche.on ('shuffle', function () {
	console.log ('shuffling deck');
	console.debug ('previous deck '+this.get ('deck'));
	var decksize = this.get ('deck.deck').length;
	for (var i = 0; i < decksize; i++) {
		randomplace = parseInt(decksize * Math.random());
		randomcard = this.get ('deck.deck['+randomplace+']');
		previouscard = this.get ('deck.deck['+i+']');
		this.set ('deck.deck['+i+']', randomcard);
		this.set ('deck.deck['+randomplace+']', previouscard);
	}
	console.debug ('new deck '+this.get ('deck'));
});

coinche.on ('play', function () {
	var pid = coinche.get ('turn'),
		player = coinche.get ('players['+pid+']'),
		game = coinche.get ('game');
	if (coinche.get ('game.contrat')) {
		if (player.isia) {
			coinche.fire ('put', false, pid, player.play (coinche.get ('game')));
		}
		else {
			coinche.set ('youplay', true);
		}
	} else {
		if (player.isia) {
			coinche.get('annoncer')(player.speak (coinche.get ('game')));
		}
		else {
			$('#'+player.location+'-bubble').popover('destroy');	
			setTimeout (function () {
				$('#'+player.location+'-controls').popover({
					html: true,
					trigger: 'manual',
					content: function() {
				      return $('#controls').html();
				    }
				}).popover ('show');
				$('#montant').val(game.teneur?game.teams[game.teneur].annonce.montant+10:80);
			}, 300);
		}
	}
});

coinche.on ('put', function (e, pid, cid) {
	//my.debug ('put invoked with pid', pid, 'cid', cid);
	coinche.set ('youplay', false);
	var player = coinche.get ('players['+pid+']'),
		card = player.hand.cards[cid];

	my.debug (player.nickname, 'plays '+card);
	coinche.splice ('players['+pid+'].hand.cards', cid, 1);
	
	card.location = player.location;
	card.team = player.team;

	coinche.push ('game.pli.cards', card); // add team for collect?
	coinche.get('jouer')(card);
});

coinche.on ('collect', function () {
	//my.debug ('checking who wins pli...');
	var atout = coinche.get ('game.contrat.couleur'),
		pli_cards = coinche.get ('game.pli.cards'),
		turn = coinche.get ('game.turn'),
		win_card = pli_cards.shift (),
		points = win_card.getPoints (atout),
		score = coinche.get ('game.scores[0]');
	//my.debug ('win_card '+win_card);
	$.each (pli_cards, function (seq, card) {
		points += card.getPoints (atout);
		if (card.beats (win_card, atout))
			win_card = card;
	});
	my.debug ('pli remporte par', win_card.location, 'de equipe', win_card.team);
	my.debug ('valeur', points, 'points');

	score[win_card.team].points += points;
	coinche.set('game.scores[0]', score);

});

$(document).on('click', '#deal-btn', function (event) { coinche.fire ('deal'); });
$(document).on('click', '#shuffle-btn', function (event) { coinche.fire ('shuffle'); });

coinche.fire ('shuffle');
coinche.fire ('deal');
coinche.fire ('play');

function increase () {
	montant = parseInt ($('#montant').val());
	if (montant && montant < 170)
		$('#montant').val(montant+10);
	else
		$('#montant').val ('Capot');
}

function decrease () {
	montant = parseInt ($('#montant').val());
	if (montant) {
		if (montant > 80)
			$('#montant').val(montant-10);
	}
	else
		$('#montant').val ('170');
}

function annoncer (couleur) {
	coinche.get ('annoncer')({
		montant: parseInt ($('#montant').val()),
		couleur: couleur
	});
}