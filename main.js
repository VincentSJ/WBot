const http = require('http');

const key = require('../key.js');           // private keys and id
const ru = require('./translation.js');     // translation info

const refreshRate = 180 * 1000; // data fetching frequency

const Discord = require('discord.js');
const bot = new Discord.Client();


bot.login( key.data.bot_id() );


var state,
    alertItem = {},
    alertId = [];

var options = {
    host: 'content.warframe.com',
    path: '/dynamic/worldState.php'
}

function _time() {
    return ( new Date() ).toLocaleString();
}

function alerts() {
    var request = http.request( options, function (res) {
        var data = '';
        res.on('data', function ( chunk ) {
            data += chunk;
        });
        res.on('end', function () {
            state = JSON.parse( data );
            console.log( _time() + ' Done\n  --->> next update in: ' +  refreshRate/1000 + 's');
            setTimeout( alerts, refreshRate );
            parse();
        });
    });
    request.on('error', function (e) {
        console.log( _time() + ' ' + e.message );
    });

    request.end();
    console.log( _time() + ' Loading data from: ' + options.host + '...');
}

function faction(f) {
    if ( ru.factionList[f] ) {
        return ru.factionList[f];
    } else {
        return f;
    }
}

function mission(m) {
    if ( ru.missionTypeList[m] ) {
        return ru.missionTypeList[m];
    } else {
        // Valid only till restart. Storing data about untraslated missions type
        writeToChannel( key.data.channel_id(), '```Хммм, я не знаю такой тип миссии... : ' + m + '```' );
        ru.missionTypeList[m] = m;
        return m;
    }
}

function reward(r) {
    if ( ru.missionReward[r] ) {
        return ru.missionReward[r];
    } else {
        // Valid only till restart. Storing data about untraslated rewards
        writeToChannel( key.data.channel_id(), '```Непереведённая награда подъехала, шеф! : ' + r + '```' );
        ru.missionReward[r] = r;
        return r;
    }
}

function msToTime(s) {
    var ms = s % 1000;
    s = ( s - ms ) / 1000;
    var sec = s % 60;
    s = ( s - sec ) / 60;
    var min = s % 60;
    var hr = (s - min) / 60;

    if ( hr != 0 ) {
        return hr + 'ч ' + min + 'м ' + sec +'с'
    } else {
        if ( min <= 0 && sec <= 0) {
            return 'expired'
        } else {
            return min + 'м ' + sec +'с'
        }

    }
    
}

function itemCheck(i) {
    if (i) {
        return i;
    } else {
        return '';
    }
}

function itemCountCheck(i) {
    if ( i && typeof(i) == 'number' ) {
        return ' (' + i + ')'
    } else {
        return '';
    }
}

function writeToChannel( channel, text ) {
    bot.channels.get( channel ).send( text );
}

function parse() {
    alertItem = [];
    var temp = [];
    for ( i = 0; i < state['Alerts'].length; i++ ) {
        var oid = state['Alerts'][i]['_id']['$oid'],
            expire = state['Alerts'][i]['Expiry']['$date']['$numberLong'],
            missionType = mission( state['Alerts'][i]['MissionInfo']['missionType'] ),
            enemy = faction( state['Alerts'][i]['MissionInfo']['faction'] );
            lvl = state['Alerts'][i]['MissionInfo']['minEnemyLevel'] + '-' + state['Alerts'][i]['MissionInfo']['maxEnemyLevel'] + '   ',
            itemsTemp = state['Alerts'][i]['MissionInfo']['missionReward']['countedItems'],
            items = [],
            itemCount = [];

        if ( itemsTemp && itemsTemp.length > 0 ) {
            items = reward( itemsTemp[0]['ItemType'] );
            itemCount = itemsTemp[0]['ItemCount'];
        }

        temp.push( oid, missionType, enemy, lvl, expire, itemCheck( items ), itemCountCheck( itemCount ) );
        alertItem.push( temp );
        temp = [];
    }
}

bot.on( 'message', ( message ) => {
    if ( message.content == '-h' ) {
        message.reply('```Дороу!\nЯ - ВафлБот.\nИ вот что ты можешь попросить меня сделать, дорогой друг.\nТы можешь набрать:\n-l       : и я покажу, чо щас в алертах\n\n\nmore commands in development...\nmaybe...```');
    } else if ( message.content == 'meh' ) {
        message.reply('слышь, жуёба, хватит лениться!');
    } else if ( message.content == '-l' ) {
        let content = '';

        if ( alertItem.length > 0 ) {
            var serverTime = new Date();
            alertItem.forEach( function( item ) {
                content += '```' + item[1] + ' ' + item[2] + ' ' + item[3] + ' осталось: ' + msToTime(item[4] - serverTime) + '   ' + item[5] + item[6] + '```';
            });
            message.reply( content );
        } else {
            message.reply('```Fetching data from Warframe. Please try again later (in 5-10 seconds)```');
        }
    }
});


// TODO I'm not very happy with this waiting for bot initialising,
//      but without it there will be an error when trying to message
//      to a specific channel when needed.
bot.on('ready', () => {
    alerts();
})