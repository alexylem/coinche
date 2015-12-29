var CoinchePoints = {
	nonatout: { J: 2, Q:3, K:4, 10:10, A:11 },
	atout:    {       Q:3, K:4, 10:10, A:11, 9:14, J:20 } 
};

var Card = Card.extend ({
	beats: function (card, atout) {
		if (this.suit == atout)
			return (card.suit != atout) || this._super (card, ['7','8','Q','K','10','A','9','J']);
		return (card.suit != atout) && (card.suit == this.suit) && this._super (card, ['7','8','9','J','Q','K','10','A']);
	},
	getPoints: function (atout) {
		if (this.suit == atout)
			return CoinchePoints.atout[this.rank] || 0;
		return CoinchePoints.nonatout[this.rank] || 0;
	}
});

Array.prototype.best = function (atout) {
	var best = false;
	$.each (this, function (cid, card) {
		if ((best === false) || card.beats (best, atout))
			best = card;
	});
	return best;
};

var CoincheDeck = Deck.extend ({
	init: function () {
		this._super (32);
	}
});

var PlayedCards = Class.extend ({
	init: function (atout) {
		this.atout = atout;
		this.bysuit = {};
		var cards = new CoincheDeck ();
		for (var i=0; i<Suits.length; i++)
			this.bysuit[Suits[i]] = [];		
		for (i=0; i<cards.deck.length; i++)
			this.bysuit[cards.deck[i].suit].push (cards.deck[i]);
	},
	add: function (card) {
		//my.debug ('	ajout de '+card+' aux cartes jouees');
		var suitcards = this.bysuit[card.suit];
		$.each (suitcards, function (i) {
			if (card.rank == this.rank)
				suitcards.splice (i, 1);
		});
	},
	est_maitre: function (card) {
		var atout = this.atout,
			est_maitre = true;
		$.each (this.bysuit[card.suit], function () {
			if (this.beats (card, atout))
				est_maitre = false;
		});
		return est_maitre;
	},
	atoutsRestants: function () {
		return this.bysuit[this.atout].length;
	},
	couleurCoupe: function (atout) {
		var coupe, min = 9;
		$.each (this.bysuit, function (suit, cards) {
			//my.debug ('suit', suit, 'nb', cards.length);
			if ((suit != atout) && cards.length < min) {
				coupe = suit;
				min = cards.length;
			}
		});
		//my.debug ('coupe', coupe);
		return coupe;
	}
});

var CoincheHand = Hand.extend ({
	order: function (atout) {
		//my.debug ('tri de la main à atout', atout);
		order = '7 8 9 J Q K 10 A'.split (' ');
		order_atout = '7 8 Q K 10 A 9 J'.split (' ');
		this.cards.sort (function (a, b) {
			if (a.suit != b.suit) {
				//my.debug (a+' et '+b+' ne sont dans la même couleur');
				return SuitLabels[a.suit].order - SuitLabels[b.suit].order;
			}
			if (a.suit == atout) {
				//my.debug (a+' et '+b+' sont atouts');
				return (order_atout.indexOf (a.rank) - order_atout.indexOf (b.rank));
			}
			//my.debug (a+' et '+b+' ne sont pas atouts');
			return (order.indexOf (a.rank) - order.indexOf (b.rank));
		});
	},
	minid: function (params) {
		params.order = params.order || (params.isatout?'7 8 Q K 10 A 9 J':'7 8 9 J Q K 10 A');
		params.above = params.tryabove || params.above;

		var min = this._super (params);
		if ((min === false) && params.tryabove) {
			params.above = false;
			min = this._super (params);
		}
		return min;
	},
	maxid: function (params) {
		params.order = params.isatout?'J 9 A 10 K Q 8 7':'A 10 K Q J 9 8 7';
		params.above = params.trybelow || params.below;

		var max = this.minid (params);
		if ((max === false) && params.trybelow) {
			params.above = false;
			max = this.minid (params);
		}
		return max;
	}
});

var CoinchePlayer = Player.extend ({
	init: function (nickname) {
		this.isia = false;
		this.nickname = nickname;
		this.hand = new CoincheHand ();
	}
});

function evalHand (main, agressivite, forceatout) {
	// calculate suit sizes
	var suitsizes = {},
		pts = {};
	$.each (Suits, function (i, suit) {
		pts[suit] = {
			atouts: 0,
			belote: 0,
			as: 0,
			second: 0,
			coupe: 0, 
			longe: 0 
		};
		suitsizes[suit] = 0;
	});
	$.each (main.cards, function (i, card) {
		suitsizes[card.suit]++;
	});

	// Détection des longes
	var nbsuits = 0;
	$.each (suitsizes, function (suit, suitsize) {
		if (suitsize)
			nbsuits++;
		if (suitsize > 3) { // long starts at 4
			//console.log ('longe a', suit);
			pts[suit].longe = 10;
		}
	});

	// Détection des coupes
	//console.log ('nbsuits', nbsuits);
	if (nbsuits < 4)
		$.each (pts, function (suit, pt) {
			//console.log (4-nbsuits, 'coupe(s) detectee(s)');
			pt.coupe = (4-nbsuits) * 10;
		});

	// Lecture des cartes
	$.each (main.cards, function (i, card) {
		switch (card.rank) {
			case 'J':
			case '9':
				if (pts[card.suit].atouts) {
					//console.log (card+' complete mon autre atout', 90);
					pts[card.suit].atouts = 90;
				} else if (suitsizes[card.suit] > 1) {
					//console.log (card+' pas sec', 80);
					pts[card.suit].atouts = card.rank=='J'?20:10; // J mieux que 9
				} else {
					//console.log (card+' sec, ignorer');
				} 
				break;
			case 'A':
				$.each (pts, function (suit, pt) {
					if (card.suit==suit/* && pt.atouts*/) { // remplacer pt.atouts par has? tester qd A arriver avant J 9
						//console.log (card+' ignoree pour', suit, 'car atout potentiel');
					} else {
						//console.log (card+' rajoute 10 à',suit);
						pt.as += 10;
					}	
				});
				break;
			case '10': // todo ignorer 10 second si il y a deja un as dans la couleur
				if (suitsizes[card.suit] == 1) {
					//console.log (card+' sec, ignorer');
					break; // ignore 10 sec
				}
				$.each (pts, function (suit, pt) {
					if (card.suit==suit && pt.atouts) { // remplacer pt.atouts par has? tester qd 10 arriver avant J 9
						//console.log (card+' ignoree pour', suit, 'car atout potentiel');
					} else {
						//console.log (card+' second rajoute au bonus');
						pt.second += 10;
					}	
				});
				break;
			case 'K':
				if (main.has ('Q', card.suit)) {
					pts[card.suit].belote = 20;
					//console.log ('belote a '+card.suit);
				}
				else {
					//console.log (card+' ne complete pas une belote');
				}
				break;
			default:
				//console.log (card+' sert a rien');
				break;
		}
	});	
	//console.log ('potentiel main', pts);

	// Choix de la meilleur couleur
	var choix = {};
	if (forceatout) {
		choix = pts[forceatout];
		choix.couleur = forceatout;
	} else {
		var besttotal = 0;
		$.each (pts, function (suit, pt) {
			var total = 0;
			for (var key in pt)
				total += pt[key];
			if (total > besttotal) {
				besttotal = total;
				choix = pt;
				choix.couleur = suit;
			}
		});
		// normalisation
		if (choix.atouts && choix.atouts < 80)
			choix.atouts = 80;
	}

	switch (agressivite) {
		case 0: // assureur
			choix.as = 0;
			choix.potentiel = 0;
			break;
		case 1: // annonceur
			choix.potentiel = 0;
			break;
		case 2: // attaquant
			choix.potentiel = choix.belote + choix.longe;
			break;
		case 3: // aggressif
			choix.potentiel = choix.belote + choix.longe + choix.coupe + choix.second + 10;
			break;
	}

	//console.log ('agressivite', Agressivites[agressivite].face, '('+Agressivites[agressivite].value+')');
	//console.log ('potentiel', choix.potentiel);

	return choix;
}
/*
function getPotentiel (choix, agressivite) {
	var potentiel = 0,
		marges = [
			0, // assureur
			choix.as, // + (choix.atouts<80?choix.atouts:0), // annonceur
			choix.belote + choix.longe, // attaquant // TODO la belote ne devrait servir qu'à prendre donc déplacer dans bloc de décision
			choix.coupe + choix.second + 10 // aggressif
		];
	//console.log ('marges', marges);

	for (i = 1; i <= agressivite; i++) {
		potentiel += marges[i];
	}
	//console.log ('agressivite', Agressivites[agressivite].face, '('+Agressivites[agressivite].value+')');
	//console.log ('potentiel', potentiel);

	return potentiel;
}
*/
var CoincheRobot = Robot.extend ({
	init: function (agressivite) {
		this._super ();
		this.agressivite = agressivite || 0; // automatique
		this.hand = new CoincheHand ();
		this.reset ();
	},
	reset: function () {
		this._super ();
		my.debug ('resetting', this.nickname);
		this.annonce = false;
		this.pts = false;
		this.accord_couleur = false;
	},
	speak: function (game) {
		console.log (this.hand.toString());

		// Vérification annonces précédentes
		var annonce_equipe = game.teams[this.team].annonce,
			annonce_part,
			atout_manquant = false,
			annonce_adv = game.teams[(this.team+1)%2].annonce,
			speech = "Rien à faire";

		if (annonce_equipe && ( !this.annonce.montant || (annonce_equipe.montant > this.annonce.montant ))) {
			annonce_part = annonce_equipe;
		}

		my.debug ('this.annonce', this.annonce);
		my.debug ('this.pts', this.pts);

		if (this.annonce) {
			console.log ("j'ai déjà fait une annonce", this.annonce);
			console.log ("il me reste", this.pts);
		} else {
			// Choix de la meilleur couleur à annoncer
			this.pts = evalHand (this.hand, this.agressivite);
			//console.log ('meilleure couleur', this.couleur, this);
			console.log ('meilleur jeu à', this.pts.couleur, this.pts.atouts, '+ as', this.pts.as, '+ potentiel', this.pts.potentiel);
		}

		// combine avec annonce partenaire
		if (annonce_part) {
			if (annonce_part.couleur == this.pts.couleur) {
				my.log ("mon partenaire a fait une annonce dans ma couleur");
				this.accord_couleur = true;
				if (this.pts.atouts) {
					atout_manquant = true;
					this.pts.atouts = annonce_part.montant+10;
				}
			} else {
				my.log ('mon partenaire a fait une annonce a', annonce_part.couleur);
				if (this.accord_couleur) {
					console.log ("on est déjà d'accord sur cette couleur");
					my.debug (this.pts);
				} else {
					var ptspart = evalHand (this.hand, this.agressivite, annonce_part.couleur);
					//console.log ('ptspart', ptspart);
					var macouleur = this.pts.atouts + this.pts.as + this.pts.potentiel,
						sacouleur = annonce_part.montant + ptspart.atouts + ptspart.as + ptspart.potentiel;
					//console.log ("max à ma couleur", macouleur, this.pts.couleur);
					console.log ("à sa couleur on ferait", sacouleur, annonce_part.couleur);
					
					if (sacouleur >= macouleur) {
						this.pts = ptspart;
						this.annonce = annonce_part; // NEW
						console.log ("on va jouer à sa couleur", this.pts.couleur, this.pts.atouts, '+ as', this.pts.as, '+ potentiel', this.pts.potentiel);
						if (this.pts.atouts)
							atout_manquant = true;
						/* commenté car robot passait alors qu'il pouvait annoncer 2 as pour part 90 enchéri par adv à 100
						else if (!ptspart.potentiel || this.pts.atouts == 80) {
							console.log ('pourquoi?');
							console.warn ('pass');
							return false;
						}
						*/
						//this.pts.atouts += annonce_part.montant; // pourquoi? le pb est qu'au 2ème tour il annonce un atout manquant qu'il n'a pas
					} else {
						console.log ("je préfère rester à ma couleur");
					}
					this.accord_couleur = true;
				}
			}
			
		}
		
		var annonce = false;
		// prise en compte annonce adverse
		if (annonce_adv && game.teneur != this.team) {
			console.log ("l'équipe adverse a fait une annonce");
			if (this.pts.atouts + this.pts.as + this.pts.potentiel + (atout_manquant?10:0) > annonce_adv.montant) {
				console.log ("mais j'ai de quoi annoncer mieux");
				if (this.pts.atouts < 90 || this.pts.atouts+this.pts.as <= annonce_adv.montant) {
					speech = "cependant je prends des risques alors je monte qu'un peu";
					annonce = {
						montant: annonce_adv.montant + 10, 
						couleur: this.pts.couleur,
						speech: "Je prends des risques"
					};
					this.pts.atouts = 0;
					this.pts.as = 0;
					this.pts.potentiel = 0; // TODO pour avoir le montant exact
				}
				else {
					annonce = {
						montant: this.pts.atouts+this.pts.as,
						couleur: this.pts.couleur,
						speech: "J'annonce juste atouts et as"
					};
					this.pts.atouts = 0;
					this.pts.as = 0;
				}
			}
			else {
				annonce = { speech: "Pas mieux" };
			}

		} else {
			if (annonce_part) { 
				console.log ("je vais annoncer par rapport à mon part");
				if (atout_manquant) {
					annonce = {
						montant: this.pts.atouts, 
						couleur: this.pts.couleur,
						speech: "J'annonce ton atout manquant"
					};
					this.pts.atouts = 0;
				} else if (annonce_part.montant == 80) {
					annonce = { speech: "J'ai pas ton atout manquant" };
				} else {
					if (this.pts.as) {
						annonce = {
							montant: annonce_part.montant+this.pts.as, 
							couleur: annonce_part.couleur,
							speech: "J'annonce mes as"
						};
						this.pts.as = 0;
					} else {
						annonce = { speech: "Rien à annoncer en plus" };
					}
				}
			} else if (this.pts.atouts) {
				if (this.pts.atouts < 90) {
					annonce = {
						montant: 80, 
						couleur: this.pts.couleur,
						speech: "Il me manque un atout"
					};
					this.pts.atouts = 0;
				}
				else {
					annonce = {
						montant: this.pts.atouts+this.pts.as, 
						couleur: this.pts.couleur,
						speech: "J'ouvre les enchères"
					};
					this.pts.atouts = 0;
					this.pts.as = 0;
				}
			} else {
				annonce = { speech: "J'ai pas de jeu" };
			}
		}
		this.annonce = annonce;
		//my.debug ('this.pts', this.pts);
		return this.annonce;
	},
	appel: function (par_couleur, cartes_maitres, couleur_atout, en_attaque) {
		//my.debug ("TENTATIVE D'APPEL, cartes maitres:", cartes_maitres);
		for (var couleur in cartes_maitres) {
			if ((carte_maitre = cartes_maitres[couleur]) // elle est maitre
			&& (couleur != couleur_atout) // ce n'est pas la couleur atout
			&& (par_couleur[couleur].length > 1)) { // et elle est deuxieme
				var cid = false;
				if (en_attaque) {
					cid = this.hand.maxid ({suit: couleur, below: carte_maitre.rank});
					if (this.hand.cards[cid].rank == '10') // si c'est le 10
						cid = this.hand.maxid ({suit: couleur}); // je fais l'appel avec l'as	
				} else {
					cid = this.hand.minid ({suit: couleur});
				}
				return {
					cid: cid,
					speech: "Je fais un appel à "+couleur
				};
			}
		}
		return false;
	},
	play: function (game) {
		var couleur_atout = game.contrat.couleur,
			couleur_demandee = game.pli.couleur,
			en_attaque = game.teneur == this.team,
			atouts_restants = game.manche.cartes_jouees.atoutsRestants (),
			carte_tenante = game.pli.cards.best (couleur_atout),
			part_maitre = ((carte_tenante.team == this.team) // mon partenaire tiens
							&& game.manche.cartes_jouees.est_maitre (carte_tenante)); // avec une carte maitre? (que faire si part coupe petit?)
			par_couleur = {},
			cartes_maitres = {};
		$.each (Suits, function (i, suit) {
			par_couleur[suit] = [];
			cartes_maitres[suit] = false;
		});
		$.each (this.hand.cards, function (cid, card) {
			card.id = cid;
			par_couleur[card.suit].push (card);
			if (game.manche.cartes_jouees.est_maitre (card))
				cartes_maitres[card.suit] = card;
		});
		atouts_restants -= par_couleur[couleur_atout].length;
		
		if (couleur_demandee === false) {
			my.log ("je dois poser la première carte");
			if (en_attaque && atouts_restants) {
				my.log ("je dois faire tomber les atouts chez l'adversaire");
				if (par_couleur[couleur_atout].length) {
					if (cartes_maitres[couleur_atout]) {
						return {
							cid: cartes_maitres[couleur_atout].id,
							speech: "Je fais tomber les atouts avec un atout maitre"
						};
					}
					my.log ("je n'ai pas d'atout maitre");
					return {
						cid: this.hand.minid ({suit: couleur_atout, isatout:true}),
						speech: "Je fais tomber les atouts par un petit atout"
					};
					/*
					if (meilleur atout < 10) {
						my.log ("je pose un petit atout pour faire tomber les autres");
					} else {
						my.log ("je ne veux pas sacrifier mes atouts, j'essaye de faire couper");
					}
					*/
				}
				my.log ("je n'ai pas d'atout, j'essaye de faire couper l'adversaire");
				my.log ("je joue dans la couleur qui a la plus été jouée");
				return {
					cid: this.hand.minid ({suite: game.manche.cartes_jouees.couleurCoupe (couleur_atout)}),
					speech: "Je fais tomber les atouts en essayant de faire couper"
				};
			}
			else {
				my.log ("je joues mes cartes maitres");
				for (var suit in cartes_maitres)
					if (cartes_maitres.hasOwnProperty (suit) && (suit != couleur_atout) && cartes_maitres[suit])
						return {
							cid: cartes_maitres[suit].id,
							speech: "Je joues mes cartes maitres"
						};
				my.log ("je n'ai pas de carte maitre");
			}
			/*
			if (appel part) {
				my.log ("je reponds a l'appel de mon part");
			}
			else if (coupe part) {
				my.log ("j'essaye de faire couper mon part");
			}
			else
			*/
			my.log ('je pisse une carte non-atout');
			if ((cid = this.hand.minid ({avoid: couleur_atout})) !== false)
				return {
					cid: cid,
					speech: "Je pisse une carte non-atout"
				};
			my.log ("je n'ai plus que des atouts?");
			return {
				cid: this.hand.minid ({}),
				speech: "J'ai plus que des atouts"
			};
		}
		
		my.log ('je dois jouer du', couleur_demandee);
		if (couleur_demandee == couleur_atout) {
			my.log ("c'est de l'atout je dois monter sur "+carte_tenante);
			if (par_couleur[couleur_atout].length) {
				// j'ai des atouts
				if (en_attaque) {
					if (cartes_maitres[couleur_atout]) {
						my.log ("je joue mon atout maitre");
						return {
							cid: cartes_maitres[couleur_atout].id,
							speech: "Je joue mon atout maitre"
						};
					}
				}
				if ((carte_tenante.team == this.team) && game.manche.cartes_jouees.est_maitre (carte_tenante)) {
					return {
						cid: this.hand.maxid ({suit: couleur_demandee, isatout:true, trybelow: '9'}),
						speech: "Mon part est maître, je charge" // sauf si j'ai le 14
					};
				}
				return {
					cid: this.hand.minid ({suit: couleur_demandee, isatout: true, tryabove: carte_tenante.rank}),
					speech: "Je mets le minimum possible"
				};
			} else {
				// J'ai pas d'atout
				if ((appel = this.appel (par_couleur, cartes_maitres, couleur_atout, part_maitre)) !== false)
					return appel;
				if (part_maitre) {
					return {
						cid: this.hand.maxid ({}),
						speech: "Pas d'appel possible, mon part est maître, je charge"
					};
				}
				return {
					cid: this.hand.minid ({}),
					speech: "Pas d'appel possible, part pas maître, je pisse"
				};
			}
		} else {
			// couleur demandée non atout
			if (par_couleur[couleur_demandee].length) {
				// j'ai de la couleur demandée
				if (cartes_maitres[couleur_demandee]) {
					// je suis maitre à cette couleur
					if (carte_tenante.suit == couleur_atout && carte_tenante.team != this.team) {
						// l'adversaire a coupé
						return {
							cid: this.hand.minid ({suit: couleur_demandee}),
							speech: "Ca a coupé, je pisse"
						};
					}
					return {
						cid: cartes_maitres[couleur_demandee].id,
						speech: "Je suis maître à cette couleur"
					};
				}
				if (part_maitre) {
					return {
						cid: this.hand.maxid ({suit: couleur_demandee}),
						speech: "Mont part est maître, je charge"
					};
				}
				return {
					cid: this.hand.minid ({suit: couleur_demandee}),
					speech: "Je pisse"
				};
			} else {
				// j'ai pas de la couleur non-atout demandée, je dois couper
				if (part_maitre) {
					// sauf si mon part est maitre (TODO: excepté s'il a coupé, je dois couper aussi)
					if ((appel = this.appel (par_couleur, cartes_maitres, couleur_atout, true)) !== false)
						// je peux faire un appel
						return appel;
					if ((cid = this.hand.maxid ({avoid: couleur_atout})) !== false)
						// pas d'appel possible, je charge
						return {
							cid: cid,
							speech: "Mon part est maître, pas d'appel possible, je charge"
						};
					return {
						// plus que des atouts
						cid: this.hand.minid ({}),
						speech: "J'ai plus que des atouts, désolé"
					};
				} else {
					// mon part n'est pas maitre, je coupe
					if (carte_tenante.suit == couleur_atout) {
						// ca a déjà coupé, je dois monter
						if ((cid = this.hand.minid ({suit: couleur_atout, isatout: true, above: carte_tenante.rank})) !== false)
							// je peux monter
							return {
								cid: cid,
								speech: "Ca a déjà coupé, je dois monter"
							};
						my.log ("je ne peux pas monter");
						if ((cid = this.hand.minid ({suit: couleur_atout, isatout: true})) !== false)
							// je peux pas monter
							return {
								cid: cid,
								speech: "Ca a déjà coupé, je peux pas monter"
							};
						// je n'ai pas d'atout
						// => voir après else {}
					} else {
						// ca n'a pas coupé avant, je coupe
						if (par_couleur[couleur_atout].length>1 && cartes_maitres[couleur_atout])
							// je garde mon atout maitre second
							return {
								// todo return par_couleur (atout).filter (not maitre).best ().id;
								cid: this.hand.minid ({suit: couleur_atout, isatout: true}),
								speech: "Je coupe, mais pas avec mon atout maître"
							};
						// je  coupe avec mon plus gros atout
						if ((cid = this.hand.maxid ({suit: couleur_atout, isatout: true})) !== false)
							return {
								cid: cid,
								speech: "Je sauve mon meilleur atout"
							};
					}
					// je n'ai pas d'atout, mon partenaire n'est pas maitre
					if ((appel = this.appel (par_couleur, cartes_maitres, couleur_atout, false)) !== false)
						// je peux faire un appel léger
						return appel;
					return {
					// pas d'appel possible, je pisse
						cid: this.hand.minid ({}),
						speech: "Pas d'appel possible, je pisse"
					};
				}
			}
		}
	}
});
/*
var CoincheGame = Game.extend({
	init: function (players) {
		var robotnicknames = 'South West North Est'.split(' ');
		$.each (players, function (i, player) {
			player.team = i%2; // team 0 or 1
			if (player.isia)
				player.nickname = robotnicknames[i];
		});
		this._super (players, 32);
		this.dealer = 0;
		this.turn = 1;
		this.game = {
			teams: [{
				points: 0,
				annonce: false
			},{
				points: 0,
				annonce: false
			}],
			annonce: { montant: 0 },
			nbpass: 0,
			couleur: false
		};
		$.each (this.players, function (i, player) {
			player.hand = new CoincheHand ();
		});
	},
	deal: function () {
		this.dealer = (this.dealer++)%4;
		console.log ('dealer is', this.players[this.dealer].nickname);
		this.deck.cut ();
		//this.deck.set ('A♠ 10♦ K♠ K♣ Q♥ 9♠ 9♥ Q♠ 7♠ Q♣ A♣ K♦ K♥ 10♣ 7♥ 9♦ 8♥ 8♦ J♠ 9♣ J♥ 7♦ A♥ 8♠ J♣ A♦ 10♥ 7♣ 8♣ 10♠ Q♦ J♦');
		//this.deck.set ('K♦ 7♥ K♣ K♥ 10♠ 8♥ J♥ Q♠ 9♠ 9♥ Q♣ A♦ 8♦ J♠ Q♥ J♦ 9♦ 10♦ K♠ A♠ 8♠ 7♣ 10♥ A♥ 10♣ Q♦ 7♦ A♣ J♣ 8♣ 9♣ 7♠');
		//this.deck.set ('K♥ 8♣ 10♥ K♣ 9♥ 7♣ 7♠ 7♦ Q♥ J♦ 10♦ 7♥ A♣ J♥ 9♣ Q♠ Q♦ 8♥ A♥ K♠ 8♦ J♣ A♦ J♠ K♦ 10♣ 9♠ 9♦ 10♠ Q♣ A♠ 8♠');
		//this.deck.set ('K♠ J♦ K♣ Q♦ 7♠ J♣ 10♠ A♦ K♥ 9♣ 9♥ 8♥ A♠ 9♠ 7♣ A♥ 8♦ 7♥ 10♥ Q♠ K♦ 9♦ Q♣ A♣ 8♣ 8♠ J♥ Q♥ 10♦ J♠ 7♦ 10♣');
		//this.deck.set ('K♣ A♥ 7♣ 7♦ 10♦ Q♥ Q♦ 8♠ J♣ J♠ K♠ Q♠ 9♣ 8♦ 8♥ 9♠ 7♥ A♦ 9♥ K♥ 10♠ 10♣ A♣ Q♣ 9♦ A♠ J♥ J♦ 10♥ K♦ 8♣ 7♠');
		//this.deck.set ('10♠ J♠ 7♠ J♣ 9♠ 8♠ K♥ A♥ 9♥ 7♣ 8♥ 10♦ 7♥ K♠ 8♦ Q♠ 10♣ J♦ 8♣ A♣ K♣ Q♦ A♦ A♠ 7♦ Q♣ 9♣ 10♥ J♥ 9♦ Q♥ K♦');
		//this.deck.set ('8♥ 7♠ 9♥ J♦ Q♠ 10♦ 10♣ 9♣ 8♦ Q♣ J♣ 7♥ Q♦ 8♠ K♥ K♣ K♦ A♥ 8♣ J♠ A♦ A♠ 9♦ 7♦ 9♠ J♥ A♣ K♠ 10♠ 7♣ 10♥ Q♥');
		//this.deck.set ('9♣ Q♥ J♦ 8♥ 7♦ J♥ K♣ K♦ J♣ K♥ A♠ 9♦ 10♣ 9♥ 10♠ 8♣ 7♣ A♣ 8♦ A♦ 7♥ 10♦ Q♠ K♠ 9♠ 10♥ 8♠ 7♠ Q♦ J♠ A♥ Q♣');
		//this.deck.set ('7♣ 8♣ A♦ A♥ Q♣ 7♥ K♥ 10♣ 10♦ 9♠ 10♥ Q♠ A♠ 8♥ 7♠ J♠ K♠ J♦ Q♥ 8♠ A♣ Q♦ K♦ 9♣ 10♠ K♣ 9♦ J♥ 7♦ 9♥ J♣ 8♦');
		//this.deck.set ('9♦ Q♦ K♣ 7♥ J♣ 8♥ 10♣ 8♣ Q♥ A♠ A♦ K♠ J♦ 9♥ 8♠ 7♠ K♥ K♦ 10♥ 8♦ 9♠ 10♦ 7♦ Q♣ 7♣ 9♣ A♣ A♥ 10♠ Q♠ J♠ J♥');
		//this.deck.set ('Q♣ 8♥ J♥ Q♠ 7♣ 10♦ 9♥ A♦ 7♥ 9♦ K♣ A♣ 9♣ K♥ A♥ K♦ 8♠ 10♥ 7♦ J♠ J♦ 8♣ K♠ 8♦ Q♥ 10♣ 10♠ A♠ Q♦ 9♠ 7♠ J♣');
		console.log ('cartes distribuées: ',this.deck);
		

		for (var i=0; i<4; i++) {
			this.players[(this.dealer+i+1)%4].hand.cards.push (this.deck.deal ());
			this.players[(this.dealer+i+1)%4].hand.cards.push (this.deck.deal ());
			this.players[(this.dealer+i+1)%4].hand.cards.push (this.deck.deal ());
		}
		for (i=0; i<4; i++) {
			this.players[(this.dealer+i+1)%4].hand.cards.push (this.deck.deal ());
			this.players[(this.dealer+i+1)%4].hand.cards.push (this.deck.deal ());
		}
		for (i=0; i<4; i++) {
			this.players[(this.dealer+i+1)%4].hand.cards.push (this.deck.deal ());
			this.players[(this.dealer+i+1)%4].hand.cards.push (this.deck.deal ());
			this.players[(this.dealer+i+1)%4].hand.cards.push (this.deck.deal ());
		}
	},
	play: function () {
		player = this.players[this.dealer+this.turn];
		if (this.game.contrat)
			player.play ();
		else {
			var parole = player.speak (this.game);
			if (parole) {
				this.game.teams[player.team].annonce = parole;
				this.game.teneur = player.team;
				this.game.annoncefaite = true;
				this.game.nbpass = 0;
			} else {
				this.game.nbpass++;
				if (this.game.annoncefaite) {
					if (this.game.nbpass == 3) {
						this.game.contrat = this.game.teams[this.game.teneur].annonce;
						console.warn ('contrat établit à', this.game.contrat);
						this.turn = 0;
					} else if (this.game.nbpass == 4) {
						console.warn ('tout le monde a passé, on redistribue');
					}
				}
			}
		}
		this.turn = (this.turn+1)%4;
	},
	toString: function () {
		return 'next to speak: '+this.players[this.dealer+this.turn].nickname;
	}
});
*/