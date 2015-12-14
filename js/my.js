// Settings
var anim_speed = 500, //ms, to be aligned with css animation
	default_game_speed = 500; //ms => Rapide

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
		
		settings: {
			game_speeds: {
				500: 'Rapide',
				1000: 'Normal',
				2000: 'Lent'
			},
			game_speed: default_game_speed
		},

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
			manche: {
				cartes_jouees: false,
			},
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
						coinche.set ('game.manche.cartes_jouees', new PlayedCards(contrat.couleur));
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
			}, coinche.get ('settings.game_speed'));
		},
		jouer: function (card) {
			//my.debug ('playing card '+card);
			var stop = false,
				nb_cards_pli = coinche.get ('game.pli.cards').length;
			if (nb_cards_pli === 1) {
				my.debug ('le pli est à', card.suit);
				coinche.set ('game.pli.couleur', card.suit);
			}
			else if (nb_cards_pli === 4) {
				my.debug ('tout le monde a posé une carte');
				stop = true;
			}
			
			if (stop) {
				setTimeout (function () {
					coinche.fire ('collect'); // sets new turn
					setTimeout (function () {
						coinche.set ('game.pli.cards', []);
						coinche.set ('game.pli.couleur', false);
						coinche.fire ('play');
					}, anim_speed);
				}, coinche.get ('settings.game_speed'));
			} else {
				coinche.set ('turn', (coinche.get ('turn')+1) %4);
				coinche.fire ('play');
			}
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
			setTimeout (function () {
				coinche.fire ('put', false, pid, player.play (coinche.get ('game')));
			}, coinche.get ('settings.game_speed'));
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
	coinche.get ('game.manche.cartes_jouees').add (card); // for stats
	coinche.splice ('players['+pid+'].hand.cards', cid, 1);
	
	card.location = player.location;
	card.pid = pid;

	coinche.push ('game.pli.cards', card);
	coinche.get('jouer')(card);
});

coinche.on ('collect', function () {
	//my.debug ('checking who wins pli...');
	var atout = coinche.get ('game.contrat.couleur'),
		pli_cards = coinche.get ('game.pli.cards'),
		turn = coinche.get ('game.turn'),
		win_card = pli_cards[0],
		points = win_card.getPoints (atout),
		score = coinche.get ('game.scores[0]');
	//my.debug ('win_card '+win_card);
	for (var i=1; i<4; i++) {
		card = pli_cards[i];
		points += card.getPoints (atout);
		if (card.beats (win_card, atout))
			win_card = card;
	}
	var win_team = coinche.get('players['+win_card.pid+'].team');
	my.debug ('pli remporte par', win_card.location, 'de equipe', win_team);
	my.debug ('valeur', points, 'points');

	$('.pli').addClass('fly_'+win_card.location);

	score[win_team].points += points;
	coinche.set('game.scores[0]', score);

	coinche.set('turn', win_card.pid);
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