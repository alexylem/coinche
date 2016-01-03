// Settings
var user_settings = {
		game_speed: 1000,
		mode_appel: 'direct',
		cheatmode: false,
		talkative: false
	},
	Settings = {
		game_speeds: {
			500: 'Rapide',
			1000: 'Normal',
			2000: 'Lent'
		},
		game_speed: 1000,
		modes_appels: {
			direct: 'Directs',
			indirect: 'Indirects'
		},
		mode_appel: 'direct',
		cheatmode: false,
		talkative: false
	};
$.extend (Settings, user_settings);
Settings.anim_speed = Settings.game_speed/2;

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
		players: players,
		deck: new CoincheDeck (),
		settings: Settings,
		game: {
			teams: [{
				annonce: false
			},{
				annonce: false
			}],
			nbpass: 0,
			teneur: false,
			contract: false,
			manche: {
				cartes_jouees: false,
				nb_plis: 0,
			},
			pli: {
				couleur: false,
				cards: []
			}, // cards on table
			scores: [],
			totals: [0, 0]
		},
		previous_deck: false,
		turn: 0,

		getSuitClass: function (suit) {
			return SuitLabels[suit].label;
		},
		annoncer: function (annonce) {
			var player = coinche.get ('players['+coinche.get ('turn')+']'),
				stop = false;

			$('#'+player.location+'-controls').popover('destroy');
			$('#'+player.location+'-bubble').popover('destroy');

			if (annonce.montant) {
				coinche.set ('game.teams['+player.team+'].annonce', annonce);
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
						$("#scores").scrollTop(function() { return this.scrollHeight; });
						coinche.set ('game.manche.cartes_jouees', new PlayedCards(contrat.couleur));
						coinche.set ('turn', 0);
						coinche.set ('game.nbpass', 0);
						coinche.set ('game.annoncefaite', false);
						stop = true;
					}
				} else if (coinche.get ('game.nbpass') == 4) {
						console.warn ('tout le monde a passé, on redistribue');
						stop = true;
				}
			}
			setTimeout (function () {
				var $content = $('<span>');
				if (coinche.get ('settings.talkative'))
					$content.text (annonce.speech?annonce.speech+' ':'');
				if (annonce.montant) {
					console.warn (player.nickname, annonce.speech, annonce.montant, annonce.couleur);
					$content.append (annonce.montant);
					$content.addClass ('annonce');
					$content.addClass (SuitLabels [annonce.couleur].label);
				}
				else {
					console.warn (player.nickname, annonce.speech, 'Passe');
					$content.append ('Passe');
				}
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
					$.each (coinche.get('players'), function () {
						this.reset (); // reset annonce stats
						this.hand.order (coinche.get('game.contrat.couleur'));
					});
				} else
					coinche.set ('turn', (coinche.get ('turn')+1) %4);
				coinche.fire ('play');
			}, coinche.get ('settings.game_speed'));
		},
		jouer: function (card) {
			//my.debug ('playing card '+card);
			var stop = false,
				nb_cards_pli = coinche.get ('game.pli.cards').length,
				dernier_pli = false;
			if (nb_cards_pli === 1) {
				//my.debug ('le pli est à', card.suit);
				coinche.set ('game.pli.couleur', card.suit);
			}
			else if (nb_cards_pli === 4) {
				my.debug ('tout le monde a posé une carte');
				stop = true;
				dernier_pli = (coinche.get ('game.manche.nb_plis') == 7);
			}
			
			if (stop) {
				setTimeout (function () {
					coinche.fire ('collect', dernier_pli); // sets new turn (winner)
					setTimeout (function () {
						$('.bubble').popover('destroy');
						coinche.set ('game.pli.cards', []);
						coinche.set ('game.pli.couleur', false);
						if (dernier_pli) {
							coinche.set ('game.manche.nb_plis', 0);
							coinche.set ('game.contrat', false);
							coinche.set ('game.teneur', false);
							coinche.set ('game.teams', [{},{}]);
							coinche.set ('turn', 0);
							$('#deck').popover({
								html: true,
								trigger: 'manual',
								content: function() {
							      return $("#deck-popover").html();
							    }
							}).popover('show');
						} else {
							coinche.add ('game.manche.nb_plis');
							coinche.fire ('play');
						}
					}, coinche.get ('settings.anim_speed'));
				}, coinche.get ('settings.game_speed'));
			} else {
				coinche.set ('turn', (coinche.get ('turn')+1) %4);
				coinche.fire ('play');
			}
		}
	}
});

coinche.on ('reboot', function () {
	coinche.reset ();
});

coinche.on ('reload', function () {
	window.location.href = '?deck='+encodeURIComponent (coinche.get('previous_deck'));
});

coinche.on ('deal', function () {
	$('#deck').popover ('hide');
	// On sauvegarde le deck au cas ou la manche est rejouée
	coinche.set ('previous_deck', coinche.get('deck').toString());

	var players = coinche.get ('players');
	(function deal (pattern, round, turn) {
		setTimeout (function () {
			for (var k = 0; k < pattern[round]; k++) {
				players[turn].hand.cards.push (coinche.get ('deck.deck[0]'));
				coinche.shift ('deck.deck');
			}
			if (++turn < players.length)
				deal (pattern, round, turn);
			else if (++round < pattern.length)
				deal (pattern, round, 0);
			else {
				// order players hand
				$.each (coinche.get('players'), function (i, player) {
					//my.debug ('	tri de la main de', player.nickname);
					player.hand.order ();
				});
				coinche.fire ('play');
			}
		}, coinche.get ('settings.anim_speed'));
	})([3,2,3], 0, 0);	
});

coinche.on ('shuffle', function () {
	console.log ('shuffling deck');
	//console.debug ('previous deck '+this.get ('deck'));
	var decksize = this.get ('deck.deck').length;
	for (var i = 0; i < decksize; i++) {
		randomplace = parseInt(decksize * Math.random());
		randomcard = this.get ('deck.deck['+randomplace+']');
		previouscard = this.get ('deck.deck['+i+']');
		this.set ('deck.deck['+i+']', randomcard);
		this.set ('deck.deck['+randomplace+']', previouscard);
	}
	//console.debug ('new deck '+this.get ('deck'));
});

coinche.on ('cut', function () {

});

coinche.on ('play', function () {
	var pid = coinche.get ('turn'),
		player = coinche.get ('players['+pid+']'),
		game = coinche.get ('game');
	if (coinche.get ('game.contrat')) {
		if (player.isia) {
			setTimeout (function () {
				var response = player.play (coinche.get ('game')),
					cid = response.cid,
					speech = response.speech;
				if (coinche.get ('settings.talkative'))
					$('#'+player.location+'-bubble').popover({
						content: speech
					}).popover('show');
				coinche.fire ('put', false, pid, cid);
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
				$('#montant').val((game.teneur !== false)?game.teams[game.teneur].annonce.montant+10:80);
			}, 300);
		}
	}
});

coinche.on ('put', function (e, pid, cid) {
	//my.debug ('put invoked with pid', pid, 'cid', cid);
	coinche.set ('youplay', false);
	var player = coinche.get ('players['+pid+']'),
		card = player.hand.cards[cid];

	console.warn (player.nickname, 'plays '+card);
	coinche.splice ('players['+pid+'].hand.cards', cid, 1);
	
	card.location = player.location;
	card.pid = pid;
	card.team = player.team;

	coinche.push ('game.pli.cards', card);
	coinche.get('jouer')(card);
});

coinche.on ('collect', function (dernier_pli) {
	my.debug ('checking who wins pli... last', dernier_pli);
	var atout = coinche.get ('game.contrat.couleur'),
		pli_cards = coinche.get ('game.pli.cards'),
		turn = coinche.get ('game.turn'),
		win_card = pli_cards.best (atout),
		win_team = coinche.get('players['+win_card.pid+'].team'),
		points = dernier_pli?10:0,
		last_score_id = coinche.get ('game.scores').length-1,
		score = coinche.get('game.scores['+last_score_id+']');

	$.each (pli_cards, function () {
		points += this.getPoints (atout);
		coinche.get ('game.manche.cartes_jouees').add (this);
		coinche.push ('deck.deck', this);
	});

	my.debug ('	pli remporte par', win_card.location, 'de equipe', win_team);
	my.debug ('	valeur', points, 'points');

	$('.pli').addClass('fly_'+win_card.location);
	score[win_team].points += points;

	if (dernier_pli) {
		var attaquants = coinche.get('game.teneur'),
			objectif = coinche.get('game.contrat.montant'),
			totals = coinche.get('game.totals');
		
		my.warn ('Scores finaux: '+score[0].points+' à '+score[1].points);

		if (score[attaquants].points < objectif) {
			// chuté
			score[attaquants].points = 0;
			score[(attaquants+1)%2].points = 160 + objectif;
		} else {
			// contrat fait
			score[attaquants].points = Math.round(score[attaquants].points / 10) * 10 + objectif;
			score[(attaquants+1)%2].points = Math.round(score[(attaquants+1)%2].points / 10) * 10;
		}
		$.each (totals, function (i, total) {
			coinche.add ('game.totals['+i+']', score[i].points);
		});
	} else {
		coinche.set('turn', win_card.pid);
	}
	coinche.set('game.scores['+last_score_id+']', score);
});

$(document).on('click', '#shuffle-btn', function (event) { coinche.fire ('shuffle'); });
$(document).on('click', '#cut-btn', function (event) { coinche.set ('deck', coinche.get('deck').cut()); });
$(document).on('click', '#deal-btn', function (event) { coinche.fire ('deal'); });

//coinche.fire ('shuffle');
//coinche.fire ('deal');
//

var previous_deck = getURLParameter ('deck');
if (previous_deck != 'null') {
	var deck = new CoincheDeck ();
	deck.set (previous_deck);
	coinche.set ('deck', deck);
	coinche.fire ('deal');
} else {
	$('#deck').popover({
		html: true,
		trigger: 'manual',
		content: function() {
	      return $("#deck-popover").html();
	    }
	}).popover('show');
}

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
