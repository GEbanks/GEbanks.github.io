const { db } = require("./routes");
routes = require('./routes.js');

function socketH(socket) {

  console.log('a user connected');
  socket.on('connect', function () {
    console.log('user connected');
  });

  socket.on('disconnect', function () {
    console.log('user disconnected');
  });

  socket.on('message', function (msg) {
    console.log('message: ' + msg);
  });
  
  function newATTHand() {
    const suits = {
      clubs: 'C',
      diamonds: 'D',
      hearts: 'H',
      spades: 'S'
    };
  
    const ranks = [
      { name: 'ace', short: 'A', value: 1 },
      { name: '2', short: '2', value: 2 },
      { name: '3', short: '3', value: 3 },
      { name: '4', short: '4', value: 4 },
      { name: '5', short: '5', value: 5 },
      { name: '6', short: '6', value: 6 },
      { name: '7', short: '7', value: 7 },
      { name: '8', short: '8', value: 8 },
      { name: '9', short: '9', value: 9 },
      { name: '10', short: '10', value: 10 },
      { name: 'jack', short: 'J', value: 10 },
      { name: 'queen', short: 'Q', value: 10 },
      { name: 'king', short: 'K', value: 10 }
    ];
  
    const cards = [];
  
    for (let suitName in suits) {
      const suitAbbr = suits[suitName];
      ranks.forEach(rank => {
        cards.push({
          name: `${rank.name} of ${suitName.charAt(0).toUpperCase() + suitName.slice(1)}`,
          img: `/img/cards/${rank.short}${suitAbbr}.png`,
          value: rank.value,
          suit: suitName
        });
      });
    }

    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  
    const hand = cards.slice(0, 4);
    socket.emit('newATTHand', hand);
  }
  
  socket.on('newATTHand', () => {
    newATTHand();
  });

  socket.on('placeBet', (data) => {
    const bet = data.bet;
    const user = data.user;
  
    console.log('bet:', bet);
    console.log('user:', user);
  
    db.get('SELECT * FROM users WHERE username=?;', [user], (err, row) => {
      if (err) {
        console.error(err);
      } else if (!row) {
        console.log('User not found');
      } else {
        if (row.money >= bet) {
          db.run('UPDATE users SET money = money - ? WHERE username = ?;', [bet, user], (err) => {
            if (err) {
              console.error(err);
            } else {
              socket.emit('betPlaced', bet);
              console.log('Bet placed:', bet);
            }
          });
        } else {
          socket.emit('insufficientFunds');
          console.log('Insufficient funds');
        }
      }
    });
  });

}

module.exports = { socketH };