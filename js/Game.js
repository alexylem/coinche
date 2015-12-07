var Suits = ['\u2665', '\u2666', '\u2663', '\u2660'];
var SuitLabels = {
	'\u2665': { order: 0, label: 'hearts' },
	'\u2666': { order: 2, label: 'diams'  },
	'\u2663': { order: 1, label: 'clubs'  },
	'\u2660': { order: 3, label: 'spades' }
};

function Card (rank, suit) {
	this.rank = rank;
	this.suit = suit;

	this.toString = function () {
		return this.rank+this.suit;
	};
}

function Deck (size) {
	size = size || 52;
	this.deck = [];

	var ranks = 'A K Q J 10 9 8 7 6 5 4 3 2'.split(' ');

	for (var i = 0; i<size; i++) {
		this.deck.push (new Card(ranks[Math.floor(i/4)], Suits[i%4]));
	}

	this.toString = function () {
		return this.deck.join (' ');
	};

	this.set = function (scards) {
		this.deck = [];
		cards = scards.split (' ');
		for (var i=0; i<cards.length; i++) {
			var card = cards[i],
				rank = card.slice(0, -1),
				suit = card.slice(-1);
			this.deck.push (new Card (rank, suit));
		}
	};

	this.shuffle = function () {
        console.log ('shuffling deck');
        for (var i = 0; i < this.deck.length; i++)
            this.deck[i] = this.deck.splice(
                parseInt(this.deck.length * Math.random()), 1, this.deck[i])[0];
    };

	this.cut = function () {
		console.log ('cutting deck');
		var at = Math.floor(Math.random() * this.deck.length-2) + 1,
			half = this.deck.splice (0, at);
		Array.prototype.push.apply(this.deck, half);
	};

	this.deal = function (nb) {
        return this.deck.splice(0, nb || 1);
    };
}

var Hand = Class.extend ({
	init: function () {
		this.cards = [];
	},
	order: function (order, groupbysuit) {
		order = order || '2 3 4 5 6 7 8 9 10 J Q K A';
		order = order.split (' ');
		this.cards.sort (function (a, b) {
			if (groupbysuit && (a.suit != b.suit)) {
				return SuitLabels[a.suit].order - SuitLabels[b.suit].order;
			}
			return (order.indexOf (a.rank) - order.indexOf (b.rank));
		});
	},
	has: function (sranks, suit) { // usage has ('J 9', '♠') returns 1 if J ou 9 found, 2 if both, 0 if none
		ranks = sranks.split (' ');
		return $.grep (this.cards, function (card) {
			return (ranks.indexOf (card.rank) != -1) && (card.suit == suit);
		}).length;
	},
	toString: function () {
		return this.cards.join (' ');
	},
	minid: function (order, suit) {
		order = order || '2 3 4 5 6 7 8 9 10 J Q K A';
		order = order.split (' ');
		var mincid = false,
			minorder = false;
		$.each (this.cards, function (cid, card) {
			if (suit && card.suit != suit)
				return;
			if ((mincid === false) || (order.indexOf (card.rank) < minorder))
				mincid = cid;
		});
		return mincid;
	}
});

var Player = Class.extend ({
	init: function (nickname) {
		this.isia = false;
		this.nickname = nickname;
		this.hand = new Hand ();
	},
	toString: function () {
		return this.nickname+': '+this.hand;
	},
	play: function () {
		var answer,
			regex = /^(\d+)(C|c|t|p)$/;
		while (1) {
			answer = regex.exec (prompt ('Posez une carte, ex: AC, 2c, 3t ou 4p'));
			if (answer || (answer === null))
				break;
		}
		console.log (this.nickname, 'played', answer);
	}
});

var Robot = Player.extend ({
	init: function () {
		this._super ('Robot');
		this.isia = true;
	},
	play: function () {
		console.log (this.nickname, 'doesnt know how to play');
	}
});

var Game = Class.extend ({
	init: function (players, decksize) {
		this.players = players;
		this.deck = new Deck (decksize);
		this.deck.shuffle ();
		$.each (this.players, function (i, player) {
			player.hand = Hand ();
		});
		this.turn = 0;
	},

	toString: function () {
		return 'Deck: '+this.deck+'\n'+
			   this.players.join ('\n');
	},

	deal: function () {
		for (var i=0; i<this.deck.length; i++)
			Array.prototype.push.apply (this.players[i%4].hand.cards, this.deck.deal ());
	}
});